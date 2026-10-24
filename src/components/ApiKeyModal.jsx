import React, { useState } from 'react';
import { Key, ShieldCheck, Flame, ExternalLink, HelpCircle, Eye, EyeOff } from 'lucide-react';

export default function ApiKeyModal({ isOpen, onClose, onSave, initialMapsKey = '', initialGeminiKey = '' }) {
  const [mapsKey, setMapsKey] = useState(initialMapsKey);
  const [geminiKey, setGeminiKey] = useState(initialGeminiKey);
  const [showMapsKey, setShowMapsKey] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!mapsKey.trim()) {
      setError('Google Maps API Key is required to display maps, directions, and places.');
      return;
    }
    setError('');
    onSave({ mapsKey: mapsKey.trim(), geminiKey: geminiKey.trim() });
    onClose();
  };

  return (
    <div className="fixed-overlay" role="dialog" aria-modal="true" aria-labelledby="api-modal-title">
      <div className="modal-card">
        <div className="modal-header">
          <div className="modal-icon-badge">
            <Flame className="w-6 h-6 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <h2 id="api-modal-title" className="modal-title">Welcome to Beat the Heat ❄️</h2>
            <p className="modal-subtitle">Configure your API credentials to calculate routes & discover chilled AC spots.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {error && (
            <div className="error-banner">
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="maps-key-input">
              <span className="flex items-center gap-1.5">
                <Key className="w-4 h-4 text-emerald-400" /> Google Maps API Key <span className="text-rose-400">*</span>
              </span>
              <a
                href="https://console.cloud.google.com/google/maps-apis/overview"
                target="_blank"
                rel="noreferrer"
                className="link-helper"
              >
                Get Key <ExternalLink className="w-3 h-3 inline" />
              </a>
            </label>
            <div className="input-wrapper">
              <input
                id="maps-key-input"
                type={showMapsKey ? 'text' : 'password'}
                className="modal-input"
                placeholder="AIzaSy..."
                value={mapsKey}
                onChange={(e) => setMapsKey(e.target.value)}
                autoComplete="off"
                required
              />
              <button
                type="button"
                className="toggle-visibility-btn"
                onClick={() => setShowMapsKey(!showMapsKey)}
                aria-label="Toggle Maps API Key visibility"
              >
                {showMapsKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="input-hint">
              Needs <strong>Maps JavaScript API</strong>, <strong>Directions API</strong>, and <strong>Places API (New)</strong> enabled in your GCP project.
            </p>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="gemini-key-input">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400" /> Google Gemini API Key <span className="optional-tag">Recommended</span>
              </span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="link-helper"
              >
                Get Free Key <ExternalLink className="w-3 h-3 inline" />
              </a>
            </label>
            <div className="input-wrapper">
              <input
                id="gemini-key-input"
                type={showGeminiKey ? 'text' : 'password'}
                className="modal-input"
                placeholder="AIzaSy..."
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                autoComplete="off"
              />
              <button
                type="button"
                className="toggle-visibility-btn"
                onClick={() => setShowGeminiKey(!showGeminiKey)}
                aria-label="Toggle Gemini API Key visibility"
              >
                {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="input-hint">
              Powers Gemini 3.8 Flash AI heat index advisory, tactical cooling route analysis, and respite scheduling.
            </p>
          </div>

          <div className="privacy-badge">
            <HelpCircle className="w-4 h-4 text-cyan-300 flex-shrink-0" />
            <span>
              Your keys are saved exclusively in your browser's local storage and never transmitted to any secondary servers.
            </span>
          </div>

          <div className="modal-actions">
            {initialMapsKey && (
              <button type="button" onClick={onClose} className="btn-secondary">
                Cancel
              </button>
            )}
            <button type="submit" className="btn-primary flex-1">
              Save Keys & Start Chilling 🧊
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
