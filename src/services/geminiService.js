import { GoogleGenAI } from '@google/genai';

/**
 * Generate heat advisory and chill route recommendations using Gemini 3.8 Flash
 */
export async function analyzeRouteHeat({ geminiApiKey, origin, destination, routeDistance, routeDuration, stops }) {
  if (!geminiApiKey) {
    return {
      summary: "Stay hydrated and step into any of the highlighted ATM / Bank branches to cool down!",
      tips: [
        "Take a 3-5 minute cooling pause inside air-conditioned ATM kiosks along the way.",
        "Drink water before starting your walk.",
        "Walk on the shaded side of the street where possible."
      ],
      coolingScore: 88
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });

    const stopSummary = stops.map(s => `- ${s.name} (${s.type === 'atm' ? 'ATM Kiosk' : 'Bank Branch'}), approx ${Math.round(s.distanceFromRoute || 0)}m off route`).join('\n');

    const prompt = `
You are the AI advisor for "Beat the Heat", an urban walking app that helps pedestrians navigate scorching weather by using air-conditioned ATM vestibules and bank branches as quick respite stops.

Route Info:
- Origin: ${origin}
- Destination: ${destination}
- Walking Distance: ${routeDistance}
- Estimated Duration: ${routeDuration}
- Available Cooling Spots found along the route (${stops.length} stops):
${stopSummary || "None directly nearby"}

Please provide a JSON response with:
1. "summary": A catchy, friendly 1-2 sentence assessment of this walk and how to strategically use the AC stops to avoid heat exhaustion.
2. "tips": An array of 3 specific, tactical, highly practical heat-safety tips tailored to this journey.
3. "coolingScore": A number from 0 to 100 assessing how well-sheltered / cooled this route is given the AC stops.
4. "recommendedStopIds": Array of place IDs or names of top 2-3 most strategic stops.

Format your response as valid pure JSON with no markdown backticks or commentary.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const text = response.text;
    const parsed = JSON.parse(text);
    return parsed;
  } catch (error) {
    console.error("Gemini route analysis error:", error);
    return {
      summary: `Walking ${routeDuration} (${routeDistance}). We mapped ${stops.length} air-conditioned bank and ATM shelters along your way to keep you chilled!`,
      tips: [
        "Step into ATM vestibules every 7-10 minutes to bring your core body temperature down.",
        "Bank branches usually maintain 20°C - 22°C (68°F - 72°F) - ideal for a quick cool-off.",
        "Carry electrolyte water and walk under sidewalk awnings."
      ],
      coolingScore: Math.min(95, 50 + (stops.length * 8))
    };
  }
}
