import { GoogleGenAI } from "@google/genai";
import { SimulationConfig, SelectedLocation } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateLocationAnalysis = async (
  location: SelectedLocation,
  config: SimulationConfig
): Promise<string> => {
  try {
    const prompt = `
      Act as a senior real estate and business strategy consultant for Delhi, India.
      
      I am considering opening a ${config.architecturalStyle} ${config.businessType} in ${location.name} (Type: ${location.type}).
      
      Please provide a concise but deep analysis (max 300 words) covering:
      1. **Demographics & Vibe**: What is the typical crowd in ${location.name}?
      2. **Business Fit**: Why is a ${config.businessType} a good or bad fit here?
      3. **Strategic Advice**: One key tip for success in this specific Delhi locality.
      
      Format the response in clean Markdown.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Analysis could not be generated.";
  } catch (error) {
    console.error("Error generating analysis:", error);
    return "Failed to generate market analysis. Please check your API key.";
  }
};

export const generateShopVisualization = async (
  location: SelectedLocation,
  config: SimulationConfig
): Promise<string | undefined> => {
  try {
    // Construct a prompt optimized for 360 panorama generation
    // We explicitly ask for a "Concept Visualization" rather than "Real Street View"
    // to reduce the chance of Safety Filter refusals.
    const prompt = `
      Create a photorealistic 3D architectural concept visualization of a store in ${location.name}, Delhi.
      
      Format: 360-degree equirectangular panorama (VR ready).
      
      Scene Details:
      - Subject: A ${config.businessType} with a "${config.architecturalStyle}" design.
      - Environment: A bustling street typical of ${location.name}, Delhi.
      - Atmosphere: ${config.timeOfDay}.
      - Perspective: Standing on the sidewalk directly in front of the shop entrance.
      - Technical: High resolution, seamless edges, correct equirectangular projection.
      
      IMPORTANT: This is a design concept render, not a real photograph.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', 
      contents: prompt,
      config: {
        // We request no specific aspect ratio constraint to let the model decide best dimensions for panorama, 
        // or prompt text handles the content structure.
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    
    return undefined;
  } catch (error) {
    console.error("Error generating visualization:", error);
    return undefined;
  }
};