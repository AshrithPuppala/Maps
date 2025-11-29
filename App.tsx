import React, { useState } from 'react';
import MapViewer from './components/MapViewer';
import Sidebar from './components/Sidebar';
import { SelectedLocation, MapLayer, SimulationConfig, AnalysisResult } from './types';
import { generateLocationAnalysis, generateShopVisualization } from './services/geminiService';

const App: React.FC = () => {
  // Application State
  const [activeLayer, setActiveLayer] = useState<MapLayer>(MapLayer.AREA);
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
  
  const [config, setConfig] = useState<SimulationConfig>({
    businessType: 'Coffee Shop',
    architecturalStyle: 'Modern Industrial',
    timeOfDay: 'Sunny afternoon'
  });

  const [analysisResult, setAnalysisResult] = useState<AnalysisResult>({
    markdownAnalysis: '',
    imageUrl: undefined,
    loading: false
  });

  const handleGenerate = async () => {
    if (!selectedLocation) return;

    // Reset state but keep loading true
    setAnalysisResult(prev => ({ ...prev, loading: true, markdownAnalysis: '', imageUrl: undefined }));

    try {
      console.log("Starting sequential generation...");
      
      // Step 1: Generate Text Analysis first (Lighter request)
      const analysisText = await generateLocationAnalysis(selectedLocation, config);
      
      // Update UI immediately so user sees text while waiting for image
      setAnalysisResult(prev => ({ 
        ...prev, 
        markdownAnalysis: analysisText 
      }));

      // Step 2: Generate Image (Heavier request)
      // We do this second so if it fails (429), the user still has the text analysis
      const imageUrl = await generateShopVisualization(selectedLocation, config);

      if (!imageUrl) console.warn("Image generation returned undefined (likely rate limited)");

      setAnalysisResult(prev => ({
        ...prev,
        imageUrl: imageUrl,
        loading: false
      }));

    } catch (error) {
      console.error("Generation failed", error);
      setAnalysisResult(prev => ({ 
        ...prev, 
        loading: false, 
        markdownAnalysis: prev.markdownAnalysis || "An error occurred while communicating with the AI service. Please try again." 
      }));
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50">
      
      {/* Mobile View Adjustment: Flex-col on small screens */}
      <div className="flex flex-col md:flex-row w-full h-full relative">
        
        {/* Map Area */}
        <div className="flex-1 h-1/2 md:h-full relative z-0">
          <MapViewer 
            activeLayer={activeLayer} 
            onLocationSelect={setSelectedLocation} 
          />
          
          {/* Tip Overlay on Map */}
          {!selectedLocation && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] bg-white/90 backdrop-blur-md px-6 py-3 rounded-full shadow-lg border border-indigo-100 pointer-events-none">
              <p className="text-sm font-medium text-indigo-700 flex items-center gap-2">
                <span>👈</span> Click on any highlighted area on the map to begin
              </p>
            </div>
          )}
        </div>

        {/* Sidebar Controls */}
        <Sidebar 
          selectedLocation={selectedLocation}
          config={config}
          setConfig={setConfig}
          activeLayer={activeLayer}
          setActiveLayer={setActiveLayer}
          analysis={analysisResult}
          onGenerate={handleGenerate}
        />
      </div>
    </div>
  );
};

export default App;