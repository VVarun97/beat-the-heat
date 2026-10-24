import React, { useRef, useEffect } from 'react';
import { MapPin, Navigation, ArrowRight, RotateCcw, Sparkles } from 'lucide-react';

export default function RouteSearchPanel({
  originText,
  destinationText,
  setOriginText,
  setDestinationText,
  onCalculateRoute,
  onUseCurrentLocation,
  isCalculating,
  mapsLoaded,
  onPresetSelect,
  activeFilter,
  setActiveFilter,
  radiusMeters,
  setRadiusMeters,
  stats
}) {
  const originInputRef = useRef(null);
  const destInputRef = useRef(null);

  // Setup Google Places Autocomplete when mapsLoaded
  useEffect(() => {
    if (!mapsLoaded || !window.google || !window.google.maps || !window.google.maps.places) {
      return;
    }

    try {
      const originAuto = new window.google.maps.places.Autocomplete(originInputRef.current, {
        fields: ['formatted_address', 'geometry', 'name']
      });
      originAuto.addListener('place_changed', () => {
        const place = originAuto.getPlace();
        if (place && (place.formatted_address || place.name)) {
          setOriginText(place.formatted_address || place.name);
        }
      });

      const destAuto = new window.google.maps.places.Autocomplete(destInputRef.current, {
        fields: ['formatted_address', 'geometry', 'name']
      });
      destAuto.addListener('place_changed', () => {
        const place = destAuto.getPlace();
        if (place && (place.formatted_address || place.name)) {
          setDestinationText(place.formatted_address || place.name);
        }
      });
    } catch (e) {
      console.warn("Places autocomplete setup warning:", e);
    }
  }, [mapsLoaded, setOriginText, setDestinationText]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (originText.trim() && destinationText.trim()) {
      onCalculateRoute();
    }
  };

  const handleSwap = () => {
    const temp = originText;
    setOriginText(destinationText);
    setDestinationText(temp);
  };

  return (
    <div className="search-panel-container">
      <form onSubmit={handleSubmit} className="route-form">
        <div className="inputs-block">
          <div className="input-group">
            <span className="input-icon-dot origin-dot"></span>
            <input
              ref={originInputRef}
              id="route-origin-input"
              type="text"
              placeholder="Origin / Starting point..."
              value={originText}
              onChange={(e) => setOriginText(e.target.value)}
              className="route-input"
              required
            />
            <button
              type="button"
              className="action-icon-btn"
              onClick={onUseCurrentLocation}
              title="Use current GPS location"
            >
              <Navigation className="w-4 h-4 text-cyan-400" />
            </button>
          </div>

          <div className="swap-divider">
            <button
              type="button"
              onClick={handleSwap}
              className="swap-btn"
              title="Swap origin and destination"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="input-group">
            <span className="input-icon-dot dest-dot"></span>
            <input
              ref={destInputRef}
              id="route-dest-input"
              type="text"
              placeholder="Destination..."
              value={destinationText}
              onChange={(e) => setDestinationText(e.target.value)}
              className="route-input"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          id="btn-find-cool-route"
          className="btn-primary search-submit-btn"
          disabled={isCalculating || !originText.trim() || !destinationText.trim()}
        >
          {isCalculating ? (
            <span className="flex items-center gap-2">
              <span className="spinner-border animate-spin"></span> Calculating Route & AC Stops...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-200" /> Find Cool Walking Route
            </span>
          )}
        </button>
      </form>

      {/* Preset popular city strolls for instant 1-click test */}
      <div className="preset-cities">
        <span className="preset-label">Quick try:</span>
        <button
          type="button"
          className="preset-chip"
          onClick={() => onPresetSelect('Times Square, NY', 'Bryant Park, NY')}
        >
          New York (Midtown)
        </button>
        <button
          type="button"
          className="preset-chip"
          onClick={() => onPresetSelect('Connaught Place, New Delhi', 'India Gate, New Delhi')}
        >
          Delhi (CP to India Gate)
        </button>
        <button
          type="button"
          className="preset-chip"
          onClick={() => onPresetSelect('Marina Bay Sands, Singapore', 'Gardens by the Bay, Singapore')}
        >
          Singapore Marina
        </button>
      </div>

      {/* Filter and Radius Controller */}
      <div className="controls-row">
        <div className="filter-pill-group">
          <button
            type="button"
            className={`pill-btn ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            All Shelters ({stats.totalStops})
          </button>
          <button
            type="button"
            className={`pill-btn ${activeFilter === 'atm' ? 'active' : ''}`}
            onClick={() => setActiveFilter('atm')}
          >
            🏧 ATMs ({stats.atmCount})
          </button>
          <button
            type="button"
            className={`pill-btn ${activeFilter === 'bank' ? 'active' : ''}`}
            onClick={() => setActiveFilter('bank')}
          >
            🏦 Banks ({stats.bankCount})
          </button>
        </div>

        <div className="radius-selector">
          <label htmlFor="radius-select">Search buffer:</label>
          <select
            id="radius-select"
            value={radiusMeters}
            onChange={(e) => setRadiusMeters(Number(e.target.value))}
            className="radius-dropdown"
          >
            <option value={150}>150m (Directly on path)</option>
            <option value={300}>300m (~3 min detour)</option>
            <option value={500}>500m (~5 min detour)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
