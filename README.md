# Beat the Heat ❄️

**Beat the Heat** is a smart pedestrian navigation web application designed to help people safely traverse urban spaces in extreme summer temperatures. It calculates the walking route from an origin to a destination and plots verified air-conditioned **ATMs** and **Bank Branches** along the path as quick cooling respite stops.

---

## 🌟 Key Features

1. **Walking Path Navigation**:
   - Computes walking directions between any two addresses or coordinates using Google Maps Directions API.
   - Includes real-time Autocomplete search for origin and destination with one-click geolocation GPS support.

2. **AC Chill Havens Detection (ATMs & Bank Branches)**:
   - Scans along the walking route polyline using Google Places API.
   - Accurately filters and ranks nearby ATMs (ideal for quick 3–5 min cool-offs) and full bank branches.
   - Displays detour distance from the route for each cooling spot.
   - Interactive custom markers (blue ATM pins with snowflake icons and emerald Bank vault pins) with rich info windows.

3. **Gemini 3.8 Flash Heat Advisory**:
   - Integrates the official `@google/genai` SDK with **Gemini 3.8 Flash**.
   - Analyzes distance, walking duration, and cooling refuge density to generate:
     - Heat safety assessment.
     - 3 tactical, route-specific heat coping tips.
     - An overall **Chill Score (0–100)**.

4. **First-Use API Key Prompt & Local Persistence**:
   - Automatically prompts the user for their **Google Maps API Key** and **Google Gemini API Key** on initial launch.
   - Securely stored in the browser's `localStorage` (never sent to third-party backends).
   - Easy settings modal accessible at any time to update keys.

5. **Modern, High-Contrast Dark UI**:
   - Built with modern glassmorphism, responsive split-pane desktop/mobile layout, and custom typography (*Plus Jakarta Sans* and *JetBrains Mono*).
   - Filter chips for toggling between All, ATMs only, or Banks only.
   - Adjustable search buffer radius (150m, 300m, 500m).

---

## 🚀 Getting Started

The app is running locally via Vite.

```bash
# Start the development server
npm run dev
```

Visit [http://localhost:5173/](http://localhost:5173/) in your web browser.

### API Key Requirements:
- **Google Maps API Key**: Requires **Maps JavaScript API**, **Directions API**, and **Places API (New)** enabled on your Google Cloud Console project.
- **Google Gemini API Key**: Obtain a key from [Google AI Studio](https://aistudio.google.com/app/apikey).
