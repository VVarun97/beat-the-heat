import React from 'react';
import { Snowflake, Footprints, Clock, ShieldCheck, Thermometer } from 'lucide-react';

export default function RouteSummaryCard({ routeInfo, stopsCount }) {
  if (!routeInfo) return null;

  return (
    <div className="card route-stats-card">
      <div className="stats-grid">
        <div className="stat-box">
          <div className="stat-icon-wrapper text-cyan-400">
            <Footprints className="w-5 h-5" />
          </div>
          <div>
            <span className="stat-label">Walk Distance</span>
            <span className="stat-value">{routeInfo.distance}</span>
          </div>
        </div>

        <div className="stat-box">
          <div className="stat-icon-wrapper text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="stat-label">Walk Time</span>
            <span className="stat-value">{routeInfo.duration}</span>
          </div>
        </div>

        <div className="stat-box">
          <div className="stat-icon-wrapper text-teal-400">
            <Snowflake className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="stat-label">AC Chill Havens</span>
            <span className="stat-value">{stopsCount} Stops</span>
          </div>
        </div>

        <div className="stat-box">
          <div className="stat-icon-wrapper text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="stat-label">Avg. Refuge Dist</span>
            <span className="stat-value">
              {stopsCount > 0 ? `Every ~${Math.max(150, Math.round(parseInt(routeInfo.distance) * 1000 / (stopsCount + 1)) || 250)}m` : 'Direct Path'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
