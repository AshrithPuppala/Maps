import { GoogleGenAI } from "@google/genai";
import { SimulationConfig, SelectedLocation } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to throttle requests
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
    // Artificial delay to prevent "429 Too Many Requests" when running immediately after text generation
    await delay(1000);

    // Optimized prompt for gemini-2.5-flash-image
    const prompt = `
      Create a wide-angle architectural concept visualization.
      
      Subject: A storefront for a ${config.architecturalStyle} ${config.businessType}.
      Setting: Located in a busy street in ${location.name}, Delhi, India.
      Atmosphere: ${config.timeOfDay}, bustling, authentic street vibes.
      Style: Photorealistic, architectural render.
      
      View: Wide street level view, showing the shop facade and the immediate street context.
    `;

    console.log("Generating image with prompt:", prompt);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', 
      contents: prompt,
      config: {
        imageConfig: {
            aspectRatio: "16:9" 
        }
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
    // Log specifically if it's a quota issue so we know, but return undefined so UI handles it gracefully
    console.warn("Visualization failed (likely rate limit):", error);
    return undefined;
  }
};