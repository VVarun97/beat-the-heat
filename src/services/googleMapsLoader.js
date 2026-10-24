/**
 * Google Maps Dynamic Loader
 */
let googleMapsPromise = null;

export function loadGoogleMaps(apiKey) {
  if (window.google && window.google.maps) {
    return Promise.resolve(window.google.maps);
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    // Check if script element already exists
    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    // Load maps with places and geometry libraries
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&loading=async&callback=__googleMapsInitCallback`;
    script.async = true;
    script.defer = true;

    window.__googleMapsInitCallback = () => {
      resolve(window.google.maps);
      delete window.__googleMapsInitCallback;
    };

    script.onerror = (err) => {
      googleMapsPromise = null;
      reject(new Error('Failed to load Google Maps SDK. Please check your API key and network permissions.'));
    };

    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

export function resetGoogleMapsLoader() {
  googleMapsPromise = null;
  const existingScript = document.getElementById('google-maps-script');
  if (existingScript) {
    existingScript.remove();
  }
}
