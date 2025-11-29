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
    // We use a more generic prompt to avoid "Location Privacy" safety filters.
    // Instead of asking for the *real* street, we ask for a concept *inspired* by it.
    const prompt = `
      Generate a professional 3D architectural visualization (concept render).
      
      Subject: A ${config.architecturalStyle} ${config.businessType} storefront.
      Context: A busy street in Delhi, India. The vibe should match the neighborhood of "${location.name}".
      Format: 360-degree equirectangular panorama.
      Lighting: ${config.timeOfDay}.
      
      Requirements: 
      - High resolution (4k).
      - Seamless panoramic projection.
      - Photorealistic textures.
      - NO text overlays or watermarks.
      - Focus on the architectural design and street atmosphere.
    `;

    console.log("Generating image with prompt:", prompt);

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview', 
      contents: prompt,
      config: {
        // No strict aspect ratio to allow panorama generation
      }
    });

    // Iterate through parts to find the image
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        console.log("Image generation successful");
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    
    console.warn("No image data found in response:", response);
    return undefined;
  } catch (error) {
    console.error("Error generating visualization:", error);
    return undefined;
  }
};
