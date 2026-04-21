import { useState, useEffect } from 'react';
import { Setup } from './components/Setup';
import { BeatTheHeat } from './components/BeatTheHeat';

export default function App() {
  const [googleMapsKey, setGoogleMapsKey] = useState<string>('');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const savedGMKey = localStorage.getItem('googleMapsApiKey');
    
    if (savedGMKey) {
      setGoogleMapsKey(savedGMKey);
      setIsReady(true);
    }
  }, []);

  const handleSetupComplete = (gmKey: string) => {
    localStorage.setItem('googleMapsApiKey', gmKey);
    setGoogleMapsKey(gmKey);
    setIsReady(true);
  };

  const clearKeys = () => {
    localStorage.removeItem('googleMapsApiKey');
    setIsReady(false);
  };

  if (!isReady) {
    return <Setup onComplete={handleSetupComplete} />;
  }

  return <BeatTheHeat googleMapsKey={googleMapsKey} onReset={clearKeys} />;
}
