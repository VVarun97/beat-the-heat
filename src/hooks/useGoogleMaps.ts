import { useState, useEffect } from 'react';

const SCRIPT_ID = 'google-maps-script';

export function useGoogleMaps(apiKey: string) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!apiKey) return;

    // If an old script exists but user provided a new key (or reset), clean it up
    const existingScript = document.getElementById(SCRIPT_ID) as HTMLScriptElement;
    if (existingScript && !existingScript.src.includes(apiKey)) {
      existingScript.remove();
      if (window.google) {
        delete (window as any).google;
      }
      setIsLoaded(false);
      setError(null);
    } else if (window.google?.maps && !error) {
      setIsLoaded(true);
      return;
    }

    if (document.getElementById(SCRIPT_ID)) {
      // Script is already injecting or injected, just wait for it to load
      const checkInterval = setInterval(() => {
        if (window.google?.maps) {
          setIsLoaded(true);
          clearInterval(checkInterval);
        }
      }, 100);
      return () => clearInterval(checkInterval);
    }
    
    // Handle auth failures from Google Maps
    (window as any).gm_authFailure = () => {
      setError(new Error('Google Maps authentication failed (ApiNotActivatedMapError). Please go to the Google Cloud Console and ENSURE that "Maps JavaScript API", "Places API", and "Directions API" are ENABLED for this project.'));
    };

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      // Don't set true if it immediately failed auth
      setTimeout(() => {
        setIsLoaded(true);
      }, 500); 
    };

    script.onerror = () => {
      setError(new Error('Failed to load Google Maps script. Check your internet connection or ad-blocker.'));
    };

    document.head.appendChild(script);

    return () => {
      // We do not cleanup on normal unmounts to keep maps working,
      // cleanup is handled on remount with a different key (at the top).
    };
  }, [apiKey, error]);

  return { isLoaded, error };
}
