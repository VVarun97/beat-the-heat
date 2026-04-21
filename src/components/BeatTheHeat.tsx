import { useState, useEffect, useRef, FormEvent } from 'react';
import { useGoogleMaps } from '../hooks/useGoogleMaps';
import { MapPin, Navigation, Droplets, ArrowRight, Loader2, SunSnow } from 'lucide-react';

interface BeatTheHeatProps {
  googleMapsKey: string;
  onReset: () => void;
}

interface Place {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: string; // 'atm' or 'bank'
  address: string;
}

export function BeatTheHeat({ googleMapsKey, onReset }: BeatTheHeatProps) {
  const { isLoaded, error } = useGoogleMaps(googleMapsKey);
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
  
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{distance: string, duration: string} | null>(null);
  const [coolSpots, setCoolSpots] = useState<Place[]>([]);
  
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  
  const sourceInputRef = useRef<HTMLInputElement>(null);
  const destinationInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoaded || !sourceInputRef.current) return;
    
    const sourceAutocomplete = new google.maps.places.Autocomplete(sourceInputRef.current);
    sourceAutocomplete.addListener('place_changed', () => {
      const place = sourceAutocomplete.getPlace();
      if (place.formatted_address) {
        setSource(place.formatted_address);
      } else if (place.name) {
        setSource(place.name);
      }
    });

  }, [isLoaded, sourceInputRef.current]);

  useEffect(() => {
    if (!isLoaded || !destinationInputRef.current) return;
    
    const destAutocomplete = new google.maps.places.Autocomplete(destinationInputRef.current);
    destAutocomplete.addListener('place_changed', () => {
      const place = destAutocomplete.getPlace();
      if (place.formatted_address) {
        setDestination(place.formatted_address);
      } else if (place.name) {
        setDestination(place.name);
      }
    });

  }, [isLoaded, destinationInputRef.current]);

  useEffect(() => {
    if (isLoaded && mapRef.current && !map) {
      const gMap = new google.maps.Map(mapRef.current, {
        center: { lat: 40.7128, lng: -74.0060 }, // Default NYC
        zoom: 13,
        mapId: 'BEAT_THE_HEAT_MAP_ID', // Required for AdvancedMarkerElement
        disableDefaultUI: true,
        zoomControl: true,
      });

      const renderer = new google.maps.DirectionsRenderer({
        map: gMap,
        suppressMarkers: false,
      });

      setMap(gMap);
      setDirectionsRenderer(renderer);

      // Add click listener to set source/destination from map
      gMap.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (!e.latLng) return;
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        const geocoder = new google.maps.Geocoder();
        
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === 'OK' && results?.[0]) {
            const address = results[0].formatted_address;
            // Simple heuristic to toggle between source and destination
            // If source is empty, set source. If source is full and dest is empty, set dest.
            // Or just set based on which input was last focused? 
            // For now, let's just use a simple state to track which one we are setting or use a toast?
            // Better: just fill whichever is empty, starting with source.
            setSource(prev => {
              if (!prev) return address;
              setDestination(prevDest => {
                if (!prevDest) return address;
                return prevDest;
              });
              return prev;
            });
          }
        });
      });

      // Try geolocating user
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            gMap.setCenter({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
          },
          () => {}
        );
      }
    }
  }, [isLoaded, map]);

  const clearMarkers = () => {
    markersRef.current.forEach(m => {
      m.map = null;
    });
    markersRef.current = [];
  };

  const getCoolSpotsAlongRoute = async (path: google.maps.LatLng[], gMap: google.maps.Map) => {
    return new Promise<Place[]>((resolve) => {
      const service = new google.maps.places.PlacesService(gMap);
      
      const maxSamples = 8; // limit to avoid OVER_QUERY_LIMIT
      const numSamples = Math.min(maxSamples, Math.max(1, Math.floor(path.length / 5)));
      const step = Math.floor(path.length / numSamples) || 1;
      
      const samplePoints = [];
      for (let i = 0; i < path.length; i += step) {
        samplePoints.push(path[i]);
      }
      
      // Ensure the destination is also a sample point so we don't miss things right at the end!
      if (path.length > 0 && samplePoints[samplePoints.length - 1] !== path[path.length - 1]) {
         samplePoints.push(path[path.length - 1]);
      }

      if (samplePoints.length === 0) {
        resolve([]);
        return;
      }

      const uniquePlaces = new Map<string, Place>();
      let completedSearches = 0;
      const expectedSearches = samplePoints.length * 2; // both bank and atm

      const handleResults = (results: google.maps.places.PlaceResult[] | null, status: google.maps.places.PlacesServiceStatus) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          results.forEach(place => {
            if (place.place_id && place.geometry?.location) {
              if (!uniquePlaces.has(place.place_id)) {
                uniquePlaces.set(place.place_id, {
                  id: place.place_id,
                  name: place.name || 'Bank/ATM',
                  lat: place.geometry.location.lat(),
                  lng: place.geometry.location.lng(),
                  type: place.types?.includes('atm') ? 'atm' : 'bank',
                  address: place.vicinity || ''
                });
              }
            }
          });
        }
        
        completedSearches++;
        if (completedSearches === expectedSearches) {
          resolve(Array.from(uniquePlaces.values()));
        }
      };

      // Search for both types around each point, staggered to avoid rate limits
      samplePoints.forEach((location, index) => {
        setTimeout(() => {
          service.nearbySearch({ location, radius: 250, type: 'bank' }, handleResults);
          service.nearbySearch({ location, radius: 250, type: 'atm' }, handleResults);
        }, index * 100);
      });
    });
  };

  const drawMarkers = (places: Place[], gMap: google.maps.Map) => {
    clearMarkers();
    places.forEach(place => {
      const markerContent = document.createElement('div');
      markerContent.className = 'w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shadow-md border-2 border-white z-10 hover:w-10 hover:h-10 transition-all cursor-pointer';
      // Inline simple snowflake SVG logic using Lucide via React would be tricky, so use raw SVG
      markerContent.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 12 22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`;

      markerContent.title = place.name + ' - Beat the heat here!';

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map: gMap,
        position: { lat: place.lat, lng: place.lng },
        content: markerContent,
        title: place.name,
      });

      markersRef.current.push(marker);
    });
  };

  const clearRoute = () => {
    if (directionsRenderer) {
      directionsRenderer.setDirections({ routes: [] });
    }
    setRouteInfo(null);
    setSource('');
    setDestination('');
    setCoolSpots([]);
    clearMarkers();
  };

  const handleRoute = async (e: FormEvent) => {
    e.preventDefault();
    if (!map || !directionsRenderer) return;
    
    setLoadingRoute(true);
    setCoolSpots([]);
    
    const directionsService = new google.maps.DirectionsService();
    try {
      const result = await directionsService.route({
        origin: source,
        destination: destination,
        travelMode: google.maps.TravelMode.WALKING
      });

      directionsRenderer.setDirections(result);
      
      const route = result.routes[0].legs[0];
      setRouteInfo({
        distance: route.distance?.text || 'Unknown',
        duration: route.duration?.text || 'Unknown'
      });
      
      const path = result.routes[0].overview_path;
      
      // Get chill spots
      const spots = await getCoolSpotsAlongRoute(path, map);
      setCoolSpots(spots);
      drawMarkers(spots, map);
      
    } catch (err: any) {
        console.error(err);
        if (err.message && err.message.includes('NOT_FOUND')) {
           alert('Could not find walking directions. Try making the location more specific.');
        } else {
           alert(`Directions API Error: ${err.message || 'Unknown error occurred. Please ensure Directions API is enabled in Google Cloud.'}`);
        }
    } finally {
        setLoadingRoute(false);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-full bg-gray-50 text-center p-6 space-y-4">
        <SunSnow size={48} className="text-red-400" />
        <h2 className="text-xl font-semibold text-gray-900">Map Loading Error</h2>
        <p className="max-w-md text-gray-600">
          {error.message}
        </p>
        <button
          onClick={onReset}
          className="mt-4 bg-gray-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors"
        >
          Reset API Keys
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col-reverse md:flex-row h-screen bg-white">
      {/* Sidebar */}
      <div className="w-full md:w-[380px] h-1/2 md:h-full flex-shrink-0 flex flex-col border-t md:border-t-0 md:border-r border-gray-200 bg-[#fafafa]">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-gray-200">
           <div className="flex items-center justify-between">
             <div className="flex items-center space-x-2 text-blue-600">
               <SunSnow size={24} />
               <h1 className="font-semibold text-lg">Beat the Heat</h1>
             </div>
             <button onClick={onReset} className="text-xs text-gray-400 hover:text-gray-600 underline">
               Reset Keys
             </button>
           </div>
        </div>

        {/* Input Form */}
        <div className="p-6 border-b border-gray-200 bg-white">
          <form onSubmit={handleRoute} className="space-y-4">
            <div className="relative">
              <div className="absolute top-3 left-3 flex flex-col items-center">
                 <div className="w-2 h-2 rounded-full bg-blue-500 mb-1" />
                 <div className="w-[2px] h-6 bg-gray-200 mb-1" />
                 <MapPin className="w-4 h-4 text-orange-500" />
              </div>
              
              <div className="space-y-3 pl-8">
                <input
                  ref={sourceInputRef}
                  type="text"
                  placeholder="Starting Point"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  required
                />
                <input
                  ref={destinationInputRef}
                  type="text"
                  placeholder="Destination"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col space-y-2">
              <button
                type="submit"
                disabled={loadingRoute || !isLoaded}
                className="w-full flex items-center justify-center space-x-2 bg-gray-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                {loadingRoute ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                <span>{loadingRoute ? 'Finding Route...' : 'Find Cool Route'}</span>
              </button>
              
              {(routeInfo || source || destination) && (
                <button
                  type="button"
                  onClick={clearRoute}
                  className="w-full py-2 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Clear Route & Markers
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {routeInfo && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="grid grid-cols-2 gap-4 divide-x divide-gray-100">
                <div className="text-center">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Walking Time</p>
                  <p className="text-xl font-light text-gray-900">{routeInfo.duration}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Distance</p>
                  <p className="text-xl font-light text-gray-900">{routeInfo.distance}</p>
                </div>
              </div>
            </div>
          )}

          {coolSpots.length > 0 && (
            <div className="flex items-start space-x-3 bg-blue-50/50 rounded-xl p-4 border border-blue-100">
               <Droplets className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
               <div>
                  <h3 className="text-sm font-medium text-blue-900">AC Zones Found</h3>
                  <p className="text-xs text-blue-700/80 mt-1">
                    We found <strong>{coolSpots.length}</strong> bank branches and ATMs along your route. Stop inside for a few minutes of AC!
                  </p>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 w-full h-1/2 md:h-full relative">
        <div ref={mapRef} className="absolute inset-0 w-full h-full bg-gray-100" />
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
             <div className="flex flex-col items-center space-y-3 text-gray-400">
               <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
               <p className="text-sm">Loading Google Maps...</p>
             </div>
          </div>
         )}
      </div>
    </div>
  );
}
