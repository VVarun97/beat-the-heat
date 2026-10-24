import React, { useState, useEffect, useCallback } from 'react';
import { Snowflake, ShieldCheck, Key, Settings, AlertTriangle, Sparkles, Footprints } from 'lucide-react';
import confetti from 'canvas-confetti';

import { loadGoogleMaps, resetGoogleMapsLoader } from './services/googleMapsLoader';
import { analyzeRouteHeat } from './services/geminiService';
import ApiKeyModal from './components/ApiKeyModal';
import RouteSearchPanel from './components/RouteSearchPanel';
import RouteSummaryCard from './components/RouteSummaryCard';
import AiAdvisorCard from './components/AiAdvisorCard';
import StopListPanel from './components/StopListPanel';
import MapView from './components/MapView';

export default function App() {
  // Stored API Keys
  const [mapsKey, setMapsKey] = useState(() => localStorage.getItem('BTH_MAPS_KEY') || '');
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem('BTH_GEMINI_KEY') || '');
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

  // Map state
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [mapError, setMapError] = useState('');

  // Routing inputs & results
  const [originText, setOriginText] = useState('Times Square, Manhattan, NY');
  const [destinationText, setDestinationText] = useState('Empire State Building, NY');
  const [isCalculating, setIsCalculating] = useState(false);
  const [routeResult, setRouteResult] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);

  // Shelters (ATMs & Banks)
  const [stops, setStops] = useState([]);
  const [selectedStop, setSelectedStop] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'atm' | 'bank'
  const [radiusMeters, setRadiusMeters] = useState(300);

  // Gemini AI heat analysis
  const [advisorData, setAdvisorData] = useState(null);
  const [advisorLoading, setAdvisorLoading] = useState(false);

  // Load Maps whenever mapsKey changes
  useEffect(() => {
    if (!mapsKey) {
      setIsKeyModalOpen(true);
      return;
    }

    setMapError('');
    setMapsLoaded(false);

    loadGoogleMaps(mapsKey)
      .then(() => {
        setMapsLoaded(true);
      })
      .catch((err) => {
        console.error("Map SDK load failure:", err);
        setMapError(err.message || 'Unable to authenticate Google Maps. Please check your API Key.');
      });
  }, [mapsKey]);

  // Save API Keys
  const handleSaveKeys = ({ mapsKey: newMapsKey, geminiKey: newGeminiKey }) => {
    localStorage.setItem('BTH_MAPS_KEY', newMapsKey);
    localStorage.setItem('BTH_GEMINI_KEY', newGeminiKey);
    setMapsKey(newMapsKey);
    setGeminiKey(newGeminiKey);
    resetGoogleMapsLoader();
  };

  // Helper: Find nearby ATMs and Banks along route points
  const searchCoolingStopsAlongRoute = useCallback((route) => {
    if (!window.google || !window.google.maps || !window.google.maps.places) return;

    const dummyMapDiv = document.createElement('div');
    const service = new window.google.maps.places.PlacesService(dummyMapDiv);

    const path = route.overview_path;
    if (!path || path.length === 0) return;

    // Sample sample points along polyline every ~350-500 meters
    const samplePoints = [];
    const stepSize = Math.max(1, Math.floor(path.length / 8));
    for (let i = 0; i < path.length; i += stepSize) {
      samplePoints.push(path[i]);
    }
    // Always include end point
    if (samplePoints[samplePoints.length - 1] !== path[path.length - 1]) {
      samplePoints.push(path[path.length - 1]);
    }

    const fetchedStopsMap = new Map();
    let pendingRequests = samplePoints.length * 2; // for ATM & Bank at each sample point

    const checkFinished = () => {
      pendingRequests--;
      if (pendingRequests <= 0) {
        // Calculate approximate distance from route polyline for each stop
        const allStops = Array.from(fetchedStopsMap.values()).map(stop => {
          let minDistance = 999999;
          const stopLatLng = stop.geometry.location;

          for (let i = 0; i < path.length; i++) {
            const dist = window.google.maps.geometry.spherical.computeDistanceBetween(stopLatLng, path[i]);
            if (dist < minDistance) {
              minDistance = dist;
            }
          }

          return {
            id: stop.place_id,
            name: stop.name,
            type: stop.customType,
            lat: stopLatLng.lat(),
            lng: stopLatLng.lng(),
            vicinity: stop.vicinity,
            rating: stop.rating,
            user_ratings_total: stop.user_ratings_total,
            distanceFromRoute: minDistance
          };
        });

        // Sort stops by proximity to path
        allStops.sort((a, b) => a.distanceFromRoute - b.distanceFromRoute);

        // Cap to the top 40 most relevant stops to keep the map clean and responsive
        const curatedStops = allStops.slice(0, 40);

        setStops(curatedStops);

        // Run Gemini 3.8 Flash Route Analysis
        const leg = route.legs[0];
        setAdvisorLoading(true);
        analyzeRouteHeat({
          geminiApiKey: geminiKey,
          origin: leg.start_address || originText,
          destination: leg.end_address || destinationText,
          routeDistance: leg.distance.text,
          routeDuration: leg.duration.text,
          stops: curatedStops.slice(0, 10)
        }).then(res => {
          setAdvisorData(res);
          setAdvisorLoading(false);
          try {
            confetti({
              particleCount: 40,
              spread: 60,
              origin: { y: 0.8 },
              colors: ['#00e5ff', '#38bdf8', '#34d399']
            });
          } catch(e) {}
        }).catch(err => {
          setAdvisorLoading(false);
        });
      }
    };

    // Dispatch searches for 'atm' and 'bank'
    samplePoints.forEach((point) => {
      // 1. Search ATMs
      service.nearbySearch({
        location: point,
        radius: radiusMeters,
        type: 'atm'
      }, (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          results.forEach(place => {
            if (!fetchedStopsMap.has(place.place_id)) {
              place.customType = 'atm';
              fetchedStopsMap.set(place.place_id, place);
            }
          });
        }
        checkFinished();
      });

      // 2. Search Banks
      service.nearbySearch({
        location: point,
        radius: radiusMeters,
        type: 'bank'
      }, (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          results.forEach(place => {
            if (!fetchedStopsMap.has(place.place_id)) {
              place.customType = 'bank';
              fetchedStopsMap.set(place.place_id, place);
            }
          });
        }
        checkFinished();
      });
    });
  }, [geminiKey, originText, destinationText, radiusMeters]);

  // Main Route Calculation
  const handleCalculateRoute = () => {
    if (!mapsLoaded || !window.google || !window.google.maps) {
      alert("Maps engine is still initializing or API key is invalid.");
      return;
    }

    setIsCalculating(true);
    setStops([]);
    setSelectedStop(null);
    setAdvisorData(null);

    const directionsService = new window.google.maps.DirectionsService();

    directionsService.route(
      {
        origin: originText,
        destination: destinationText,
        travelMode: window.google.maps.TravelMode.WALKING, // Strict Walking Path
      },
      (result, status) => {
        setIsCalculating(false);
        if (status === window.google.maps.DirectionsStatus.OK && result) {
          setRouteResult(result);
          const leg = result.routes[0].legs[0];
          setRouteInfo({
            distance: leg.distance.text,
            duration: leg.duration.text,
            startAddress: leg.start_address,
            endAddress: leg.end_address
          });

          // Trace ATMs and Bank branches
          searchCoolingStopsAlongRoute(result.routes[0]);
        } else {
          alert(`Could not calculate walking path: ${status}. Please verify address names.`);
        }
      }
    );
  };

  // Preset Selection
  const handlePresetSelect = (orig, dest) => {
    setOriginText(orig);
    setDestinationText(dest);
  };

  // GPS User Location
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (window.google && window.google.maps) {
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: { lat: latitude, lng: longitude } }, (results, status) => {
            if (status === 'OK' && results[0]) {
              setOriginText(results[0].formatted_address);
            } else {
              setOriginText(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
            }
          });
        } else {
          setOriginText(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        }
      },
      (err) => {
        alert(`Location permission denied or unavailable: ${err.message}`);
      }
    );
  };

  const stats = {
    totalStops: stops.length,
    atmCount: stops.filter(s => s.type === 'atm').length,
    bankCount: stops.filter(s => s.type === 'bank').length
  };

  // Memoize marker click handler so it doesn't change on input typing
  const handleMarkerClick = useCallback((stop) => {
    setSelectedStop(stop);
  }, []);

  // Memoize filtered stops so reference doesn't change on input typing
  const filteredStops = React.useMemo(() => {
    return stops.filter(s => {
      if (activeFilter === 'atm') return s.type === 'atm';
      if (activeFilter === 'bank') return s.type === 'bank';
      return true;
    });
  }, [stops, activeFilter]);

  return (
    <div className="app-container">
      {/* Top Header */}
      <header className="top-navbar">
        <div className="brand-section">
          <div className="brand-logo-glow">
            <Snowflake className="w-6 h-6 text-slate-900" />
          </div>
          <div>
            <h1 className="brand-title">Beat the Heat</h1>
            <p className="brand-tagline">
              <span className="heat-dot"></span> Air-Conditioned Walking Haven Navigator
            </p>
          </div>
        </div>

        <div className="nav-actions">
          {mapsKey ? (
            <span className="key-badge ready">
              <ShieldCheck className="w-3.5 h-3.5" /> Maps Connected
            </span>
          ) : (
            <span className="key-badge missing">
              <AlertTriangle className="w-3.5 h-3.5" /> Key Required
            </span>
          )}

          {geminiKey ? (
            <span className="key-badge ready">
              <Sparkles className="w-3.5 h-3.5" /> Gemini 3.8 Active
            </span>
          ) : (
            <span className="key-badge" style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}>
              Gemini Standby
            </span>
          )}

          <button
            type="button"
            className="btn-settings"
            onClick={() => setIsKeyModalOpen(true)}
            id="btn-open-settings"
          >
            <Settings className="w-4 h-4" /> API Keys
          </button>
        </div>
      </header>

      {/* Main Two-Pane View */}
      <main className="main-content">
        {/* Left Side: Route Controls, Stats, Gemini Insights & Stop List */}
        <aside className="sidebar">
          <RouteSearchPanel
            originText={originText}
            destinationText={destinationText}
            setOriginText={setOriginText}
            setDestinationText={setDestinationText}
            onCalculateRoute={handleCalculateRoute}
            onUseCurrentLocation={handleUseCurrentLocation}
            isCalculating={isCalculating}
            mapsLoaded={mapsLoaded}
            onPresetSelect={handlePresetSelect}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            radiusMeters={radiusMeters}
            setRadiusMeters={setRadiusMeters}
            stats={stats}
          />

          <RouteSummaryCard routeInfo={routeInfo} stopsCount={stops.length} />

          <AiAdvisorCard
            advisorData={advisorData}
            loading={advisorLoading}
            onFocusStop={(stop) => setSelectedStop(stop)}
          />

          <StopListPanel
            stops={stops}
            activeFilter={activeFilter}
            onSelectStop={handleMarkerClick}
            selectedStopId={selectedStop?.id}
          />
        </aside>

        {/* Right Side: Interactive Google Map */}
        <section className="map-section">
          <MapView
            mapsLoaded={mapsLoaded}
            mapError={mapError}
            routeResult={routeResult}
            stops={filteredStops}
            selectedStop={selectedStop}
            onMarkerClick={handleMarkerClick}
          />
        </section>
      </main>

      {/* First-use / Key Settings Modal */}
      <ApiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        onSave={handleSaveKeys}
        initialMapsKey={mapsKey}
        initialGeminiKey={geminiKey}
      />
    </div>
  );
}
