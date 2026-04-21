import { useState } from 'react';
import { Map, Key, SunSnow } from 'lucide-react';

interface SetupProps {
  onComplete: (googleMapsKey: string) => void;
}

export function Setup({ onComplete }: SetupProps) {
  const [gmKey, setGmKey] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gmKey.trim()) {
      setError('Google Maps API Key is required.');
      return;
    }
    onComplete(gmKey.trim());
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center p-4">
      <div className="bg-white rounded-[24px] shadow-sm max-w-md w-full p-8 border border-gray-100">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center">
            <SunSnow size={32} />
          </div>
        </div>
        
        <h1 className="text-2xl font-semibold text-center text-gray-900 mb-2">
          Beat the Heat
        </h1>
        <p className="text-gray-500 text-center mb-8 text-sm">
          Provide your API keys to get started. Ensure you've enabled <strong>Maps JavaScript API</strong>, <strong>Places API</strong>, and <strong>Directions API</strong> in Google Cloud Console.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Google Maps API Key
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Map className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                value={gmKey}
                onChange={(e) => setGmKey(e.target.value)}
                placeholder="AIzaSy..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Requires Maps JavaScript, Places, and Directions APIs enabled.
            </p>
          </div>

          {error && (
            <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-medium py-3 rounded-xl hover:bg-blue-700 transition-colors mt-4"
          >
            Start Walking Cool
          </button>
        </form>
      </div>
    </div>
  );
}
