import React from 'react';
import { Sparkles, ThermometerSnowflake, ShieldAlert, Award, Clock } from 'lucide-react';

export default function AiAdvisorCard({ advisorData, loading, onFocusStop }) {
  if (loading) {
    return (
      <div className="card advisor-loading-card">
        <div className="flex items-center gap-2 text-cyan-400 font-semibold mb-2">
          <Sparkles className="w-4 h-4 animate-spin text-cyan-300" />
          <span>Gemini 3.8 Flash AI Heat Advisor is analyzing route...</span>
        </div>
        <div className="shimmer-line h-4 w-3/4 mb-2"></div>
        <div className="shimmer-line h-4 w-1/2"></div>
      </div>
    );
  }

  if (!advisorData) return null;

  return (
    <div className="card advisor-card">
      <div className="advisor-header">
        <div className="flex items-center gap-2">
          <div className="advisor-sparkle-icon">
            <Sparkles className="w-4 h-4 text-cyan-300" />
          </div>
          <div>
            <h4 className="advisor-title">Gemini Heat Copilot</h4>
            <span className="advisor-badge">AI Powered Respite Route</span>
          </div>
        </div>

        {advisorData.coolingScore !== undefined && (
          <div className="cooling-score-badge" title="Cooling comfort index based on AC stop density">
            <ThermometerSnowflake className="w-4 h-4 text-cyan-400" />
            <div className="text-right">
              <span className="score-val">{advisorData.coolingScore}</span>
              <span className="score-lbl">/100 Chill Index</span>
            </div>
          </div>
        )}
      </div>

      <p className="advisor-summary">{advisorData.summary}</p>

      {advisorData.tips && advisorData.tips.length > 0 && (
        <div className="advisor-tips-list">
          {advisorData.tips.map((tip, idx) => (
            <div key={idx} className="advisor-tip-item">
              <div className="tip-bullet">{idx + 1}</div>
              <span className="tip-text">{tip}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
