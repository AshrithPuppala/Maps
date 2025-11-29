import React from 'react';
import { SelectedLocation, SimulationConfig, AnalysisResult, MapLayer } from '../types';
import { BuildingStorefrontIcon, SparklesIcon, MapPinIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';
import PanoramaViewer from './PanoramaViewer';

interface SidebarProps {
  selectedLocation: SelectedLocation | null;
  config: SimulationConfig;
  setConfig: React.Dispatch<React.SetStateAction<SimulationConfig>>;
  activeLayer: MapLayer;
  setActiveLayer: React.Dispatch<React.SetStateAction<MapLayer>>;
  analysis: AnalysisResult;
  onGenerate: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  selectedLocation,
  config,
  setConfig,
  activeLayer,
  setActiveLayer,
  analysis,
  onGenerate
}) => {
  // Construct Google Street View URL
  const getStreetViewUrl = () => {
    if (!selectedLocation) return '#';
    const [lat, lng] = selectedLocation.coordinates;
    // Opens Google Maps in Street View mode if available, or just the location
    return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
  };

  return (
    <div className="w-full md:w-[450px] bg-white border-l border-gray-200 h-full overflow-y-auto shadow-xl flex flex-col z-20">
      
      {/* Header */}
      <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-indigo-600 to-purple-600 text-white shrink-0">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <BuildingStorefrontIcon className="h-6 w-6" />
          DelhiBizViz
        </h1>
        <p className="text-indigo-100 text-sm mt-1">Smart Location Finder & Visualizer</p>
      </div>

      <div className="p-6 space-y-8 flex-1 overflow-y-auto">
        
        {/* Layer Selection */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Map Layer</label>
          <div className="flex bg-gray-100 p-1 rounded-lg">
            {Object.values(MapLayer).map((layer) => (
              <button
                key={layer}
                onClick={() => setActiveLayer(layer)}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
                  activeLayer === layer 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {layer}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Location */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 transition-all">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
              <MapPinIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-indigo-400 uppercase">Selected Area</p>
              <h2 className="text-lg font-bold text-gray-900 break-words">
                {selectedLocation ? selectedLocation.name : "Select a location on map"}
              </h2>
              {selectedLocation && (
                <div className="mt-2 space-y-2">
                  <p className="text-xs text-gray-500">
                    Type: {selectedLocation.type} | Lat: {selectedLocation.coordinates[0].toFixed(4)}
                  </p>
                  <a 
                    href={getStreetViewUrl()} 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    <GlobeAltIcon className="h-3 w-3" />
                    Compare with Real Street View
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Configuration Form */}
        <div className="space-y-4">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Business Configuration</label>
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
              <select
                value={config.businessType}
                onChange={(e) => setConfig({ ...config, businessType: e.target.value })}
                className="w-full rounded-lg border-gray-300 border p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="Coffee Shop">Coffee Shop</option>
                <option value="Boutique Clothing Store">Boutique Clothing</option>
                <option value="Bakery">Bakery</option>
                <option value="Tech Startup Office">Tech Office</option>
                <option value="Restaurant">Fine Dining Restaurant</option>
                <option value="Bookstore">Bookstore</option>
                <option value="Gym">Fitness Gym</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Architectural Style</label>
              <select
                value={config.architecturalStyle}
                onChange={(e) => setConfig({ ...config, architecturalStyle: e.target.value })}
                className="w-full rounded-lg border-gray-300 border p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="Modern Industrial">Modern Industrial</option>
                <option value="Minimalist Scandinavian">Minimalist Scandinavian</option>
                <option value="Traditional Indian Heritage">Traditional Heritage</option>
                <option value="Cyberpunk Neon">Cyberpunk / Neon</option>
                <option value="Eco-Friendly Green">Eco-Friendly / Biophilic</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time of Day</label>
               <select
                value={config.timeOfDay}
                onChange={(e) => setConfig({ ...config, timeOfDay: e.target.value })}
                className="w-full rounded-lg border-gray-300 border p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="Sunny afternoon">Sunny Afternoon</option>
                <option value="Golden hour sunset">Golden Hour</option>
                <option value="Rainy evening">Rainy Evening</option>
                <option value="Night with street lights">Night</option>
              </select>
            </div>
          </div>

          <button
            onClick={onGenerate}
            disabled={!selectedLocation || analysis.loading}
            className={`w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-semibold text-white transition-all shadow-lg ${
              !selectedLocation || analysis.loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.02]'
            }`}
          >
            {analysis.loading ? (
              <>
                 <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating 3D View...
              </>
            ) : (
              <>
                <SparklesIcon className="h-5 w-5" />
                Generate 3D Simulation
              </>
            )}
          </button>
        </div>

        {/* Results Area */}
        {(analysis.markdownAnalysis || analysis.imageUrl) && (
          <div className="space-y-6 pt-4 border-t border-gray-100 animate-fade-in">
            
            {/* Generated Image/Panorama */}
            {analysis.imageUrl && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider flex justify-between items-center">
                  <span>Projected Storefront</span>
                  <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full border border-green-200">Interactive 360°</span>
                </h3>
                <div className="relative group rounded-xl overflow-hidden shadow-md border border-gray-200 aspect-video bg-gray-900">
                  <PanoramaViewer imageUrl={analysis.imageUrl} />
                </div>
              </div>
            )}

            {/* Analysis Text */}
            {analysis.markdownAnalysis && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Market Analysis</h3>
                <div className="prose prose-indigo prose-sm max-w-none bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <ReactMarkdown>{analysis.markdownAnalysis}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;