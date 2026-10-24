import React, { useEffect, useRef } from 'react';
import { Snowflake, Building2, CreditCard, Navigation, AlertCircle } from 'lucide-react';

export default function MapView({
  mapsLoaded,
  mapError,
  routeResult,
  stops,
  selectedStop,
  onMarkerClick,
  onMapClick
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const markersRef = useRef([]);
  const infoWindowRef = useRef(null);

  // Initialize Map
  useEffect(() => {
    if (!mapsLoaded || !mapContainerRef.current || !window.google || !window.google.maps) {
      return;
    }

    if (!mapInstanceRef.current) {
      // Default to central view (e.g. Times Square or Manhattan)
      const defaultCenter = { lat: 40.7580, lng: -73.9855 };

      const map = new window.google.maps.Map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 14,
        mapTypeControl: false,
        fullscreenControl: true,
        streetViewControl: false,
        zoomControl: true,
        styles: [
          { elementType: 'geometry', stylers: [{ color: '#1d2330' }] },
          { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1f2c' }] },
          { elementType: 'labels.text.fill', stylers: [{ color: '#8e9bb0' }] },
          {
            featureType: 'administrative.locality',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#00d2ff' }]
          },
          {
            featureType: 'poi',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#6ee7b7' }]
          },
          {
            featureType: 'poi.park',
            elementType: 'geometry',
            stylers: [{ color: '#13282a' }]
          },
          {
            featureType: 'road',
            elementType: 'geometry',
            stylers: [{ color: '#2a3449' }]
          },
          {
            featureType: 'road',
            elementType: 'geometry.stroke',
            stylers: [{ color: '#1d2537' }]
          },
          {
            featureType: 'road.highway',
            elementType: 'geometry',
            stylers: [{ color: '#3b4b68' }]
          },
          {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{ color: '#0d1829' }]
          },
          {
            featureType: 'water',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#38bdf8' }]
          }
        ]
      });

      // Directions renderer with custom styling
      const directionsRenderer = new window.google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: false,
        polylineOptions: {
          strokeColor: '#00e5ff',
          strokeWeight: 6,
          strokeOpacity: 0.85
        }
      });

      infoWindowRef.current = new window.google.maps.InfoWindow();
      mapInstanceRef.current = map;
      directionsRendererRef.current = directionsRenderer;
    }
  }, [mapsLoaded]);

  // Update Route Polyline
  useEffect(() => {
    if (!directionsRendererRef.current) return;

    if (routeResult) {
      directionsRendererRef.current.setDirections(routeResult);
    } else {
      directionsRendererRef.current.set('directions', null);
    }
  }, [routeResult]);

  // Smart Render Stop Markers (no DROP animation, preserve existing markers)
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google || !window.google.maps) return;

    if (!stops || stops.length === 0) {
      // Clear markers if stops are emptied
      markersRef.current.forEach(m => m.setMap(null));
      markersRef.current = [];
      return;
    }

    // Check if the stops list has actually changed by comparing IDs
    const currentMarkerIds = markersRef.current.map(m => m.__stopId);
    const newStopIds = stops.map(s => s.id);

    const isSameList = currentMarkerIds.length === newStopIds.length &&
      currentMarkerIds.every((id, idx) => id === newStopIds[idx]);

    // If identical list of stops, do not rebuild markers at all!
    if (isSameList) {
      return;
    }

    // Otherwise clear and recreate smoothly without dropping animation
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    stops.forEach((stop) => {
      const position = {
        lat: typeof stop.lat === 'function' ? stop.lat() : stop.lat,
        lng: typeof stop.lng === 'function' ? stop.lng() : stop.lng
      };

      const isAtm = stop.type === 'atm';

      // SVG Icon for ATM (cyan snowflake) and Bank (emerald vault)
      const iconUrl = isAtm
        ? `data:image/svg+xml;utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="38" height="46" viewBox="0 0 38 46"><path d="M19 0C8.5 0 0 8.5 0 19c0 13.5 19 27 19 27s19-13.5 19-27C38 8.5 29.5 0 19 0z" fill="%230284c7" stroke="%2338bdf8" stroke-width="2"/><circle cx="19" cy="19" r="14" fill="%23082f49"/><text x="19" y="24" font-size="12" font-family="sans-serif" font-weight="bold" fill="%2338bdf8" text-anchor="middle">ATM</text></svg>`
        : `data:image/svg+xml;utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="38" height="46" viewBox="0 0 38 46"><path d="M19 0C8.5 0 0 8.5 0 19c0 13.5 19 27 19 27s19-13.5 19-27C38 8.5 29.5 0 19 0z" fill="%23059669" stroke="%2334d399" stroke-width="2"/><circle cx="19" cy="19" r="14" fill="%23064e3b"/><text x="19" y="24" font-size="11" font-family="sans-serif" font-weight="bold" fill="%2334d399" text-anchor="middle">BANK</text></svg>`;

      const marker = new window.google.maps.Marker({
        position,
        map: mapInstanceRef.current,
        title: stop.name,
        icon: {
          url: iconUrl,
          scaledSize: new window.google.maps.Size(34, 42),
          anchor: new window.google.maps.Point(17, 42)
        }
      });

      marker.__stopId = stop.id;

      marker.addListener('click', () => {
        onMarkerClick(stop);

        const contentString = `
          <div style="color: #0f172a; font-family: 'Plus Jakarta Sans', sans-serif; padding: 4px; max-width: 240px;">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
              <span style="background: ${isAtm ? '#0284c7' : '#059669'}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700;">
                ${isAtm ? '🏧 ATM CHILL SPOT' : '🏦 BANK COOLING BRANCH'}
              </span>
            </div>
            <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 700; color: #0284c7;">${stop.name}</h4>
            <p style="margin: 0 0 6px 0; font-size: 12px; color: #475569;">${stop.vicinity || stop.formatted_address || ''}</p>
            <div style="background: #e0f2fe; color: #0369a1; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">
              ❄️ Verified AC Chill Vestibule
            </div>
          </div>
        `;

        infoWindowRef.current.setContent(contentString);
        infoWindowRef.current.open(mapInstanceRef.current, marker);
      });

      markersRef.current.push(marker);
    });
  }, [stops, onMarkerClick]);

  // Center on selected stop if any
  useEffect(() => {
    if (selectedStop && mapInstanceRef.current) {
      const position = {
        lat: typeof selectedStop.lat === 'function' ? selectedStop.lat() : selectedStop.lat,
        lng: typeof selectedStop.lng === 'function' ? selectedStop.lng() : selectedStop.lng
      };

      mapInstanceRef.current.panTo(position);
      mapInstanceRef.current.setZoom(17);

      if (infoWindowRef.current) {
        const isAtm = selectedStop.type === 'atm';
        const contentString = `
          <div style="color: #0f172a; font-family: 'Plus Jakarta Sans', sans-serif; padding: 4px; max-width: 240px;">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
              <span style="background: ${isAtm ? '#0284c7' : '#059669'}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700;">
                ${isAtm ? '🏧 ATM CHILL SPOT' : '🏦 BANK COOLING BRANCH'}
              </span>
            </div>
            <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 700; color: #0284c7;">${selectedStop.name}</h4>
            <p style="margin: 0 0 6px 0; font-size: 12px; color: #475569;">${selectedStop.vicinity || selectedStop.formatted_address || ''}</p>
            <div style="background: #e0f2fe; color: #0369a1; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">
              ❄️ Verified AC Chill Vestibule
            </div>
          </div>
        `;
        infoWindowRef.current.setContent(contentString);
        infoWindowRef.current.setPosition(position);
        infoWindowRef.current.open(mapInstanceRef.current);
      }
    }
  }, [selectedStop]);

  return (
    <div className="map-view-wrapper">
      {mapError ? (
        <div className="map-placeholder error-placeholder">
          <AlertCircle className="w-12 h-12 text-rose-400 mb-3" />
          <h3 className="text-lg font-bold text-slate-100">Google Maps Error</h3>
          <p className="text-sm text-slate-400 max-w-md text-center mt-1">
            {mapError}
          </p>
        </div>
      ) : !mapsLoaded ? (
        <div className="map-placeholder loading-placeholder">
          <div className="pulsing-snowflake">
            <Snowflake className="w-10 h-10 text-cyan-400 animate-spin" />
          </div>
          <h3 className="text-base font-semibold text-slate-200 mt-4">Initializing Map Engine...</h3>
          <p className="text-xs text-slate-400">Loading Google Maps SDK with Places & Geometry</p>
        </div>
      ) : null}

      <div ref={mapContainerRef} className="map-canvas" style={{ display: mapError ? 'none' : 'block' }} />

      {/* Map Legend Overlay */}
      <div className="map-legend">
        <div className="legend-item">
          <span className="legend-color-bar walking-route"></span>
          <span>Walking Route</span>
        </div>
        <div className="legend-item">
          <span className="legend-pin atm-pin">ATM</span>
          <span>AC ATM Kiosk</span>
        </div>
        <div className="legend-item">
          <span className="legend-pin bank-pin">BANK</span>
          <span>AC Bank Branch</span>
        </div>
      </div>
    </div>
  );
}
