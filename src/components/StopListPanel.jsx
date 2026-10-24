import React from 'react';
import { Snowflake, Building2, CreditCard, Navigation, ExternalLink, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function StopListPanel({ stops, activeFilter, onSelectStop, selectedStopId }) {
  const filteredStops = stops.filter(s => {
    if (activeFilter === 'atm') return s.type === 'atm';
    if (activeFilter === 'bank') return s.type === 'bank';
    return true;
  });

  if (stops.length === 0) {
    return (
      <div className="card empty-stops-card">
        <Snowflake className="w-8 h-8 text-cyan-400/50 mb-2 animate-bounce" />
        <h5 className="font-semibold text-slate-200">No route calculated yet</h5>
        <p className="text-sm text-slate-400 mt-1">
          Enter your starting point and destination above to trace your walking path and discover chilled AC ATM and Bank stops along the way.
        </p>
      </div>
    );
  }

  return (
    <div className="stops-panel">
      <div className="stops-header">
        <h4 className="stops-title">
          <Snowflake className="w-4 h-4 text-cyan-400 inline mr-1.5" />
          Air-Conditioned Chill Stops ({filteredStops.length})
        </h4>
        <span className="stops-subtitle">Ranked by position along walking route</span>
      </div>

      <div className="stops-scroll-list">
        {filteredStops.map((stop, index) => {
          const isSelected = selectedStopId === stop.id;
          const isAtm = stop.type === 'atm';

          return (
            <div
              key={stop.id || index}
              onClick={() => onSelectStop(stop)}
              className={`stop-card ${isSelected ? 'selected' : ''}`}
            >
              <div className="stop-card-badge">
                {isAtm ? (
                  <span className="badge-atm">
                    <CreditCard className="w-3.5 h-3.5" /> ATM
                  </span>
                ) : (
                  <span className="badge-bank">
                    <Building2 className="w-3.5 h-3.5" /> BANK
                  </span>
                )}
                <span className="stop-index">Stop #{index + 1}</span>
              </div>

              <div className="stop-main-info">
                <h5 className="stop-name">{stop.name}</h5>
                <p className="stop-address">{stop.vicinity || stop.formatted_address || "Nearby on path"}</p>
              </div>

              <div className="stop-footer">
                <div className="ac-verified-pill">
                  <Snowflake className="w-3 h-3 text-cyan-300" />
                  <span>AC Cooling Vestibule</span>
                </div>

                {stop.distanceFromRoute !== undefined && (
                  <span className="distance-offset">
                    ~{Math.round(stop.distanceFromRoute)}m detour
                  </span>
                )}
              </div>

              {stop.rating && (
                <div className="rating-pill">
                  ⭐ {stop.rating} ({stop.user_ratings_total || 0})
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
