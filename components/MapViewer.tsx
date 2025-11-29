import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import { GeoJSONCollection, GeoJSONFeature, MapLayer, SelectedLocation } from '../types';

// Fix for default Leaflet marker icons in React without module bundler support for images
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface MapViewerProps {
  activeLayer: MapLayer;
  onLocationSelect: (loc: SelectedLocation) => void;
}

const DELHI_CENTER: [number, number] = [28.6139, 77.2090];

// Fallback data to ensure the app works even if external GeoJSON fails to load (CORS/Network issues)
const FALLBACK_DATA: GeoJSONCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "Connaught Place", area: "Connaught Place", pin_code: "110001" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [77.2140, 28.6340], [77.2220, 28.6340], [77.2220, 28.6270], [77.2140, 28.6270], [77.2140, 28.6340]
        ]]
      }
    },
    {
      type: "Feature",
      properties: { name: "Hauz Khas Village", area: "Hauz Khas", pin_code: "110016" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [77.1930, 28.5560], [77.1980, 28.5560], [77.1980, 28.5520], [77.1930, 28.5520], [77.1930, 28.5560]
        ]]
      }
    },
    {
      type: "Feature",
      properties: { name: "Saket District Centre", area: "Saket", pin_code: "110017" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [77.2170, 28.5260], [77.2240, 28.5260], [77.2240, 28.5200], [77.2170, 28.5200], [77.2170, 28.5260]
        ]]
      }
    },
    {
      type: "Feature",
      properties: { name: "Karol Bagh", area: "Karol Bagh", pin_code: "110005" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [77.1850, 28.6550], [77.1950, 28.6550], [77.1950, 28.6450], [77.1850, 28.6450], [77.1850, 28.6550]
        ]]
      }
    },
     {
      type: "Feature",
      properties: { name: "Lajpat Nagar", area: "Lajpat Nagar", pin_code: "110024" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [77.2350, 28.5700], [77.2450, 28.5700], [77.2450, 28.5600], [77.2350, 28.5600], [77.2350, 28.5700]
        ]]
      }
    }
  ]
};

// Helper to auto-fit bounds
const BoundsFitter = ({ data }: { data: GeoJSONCollection | null }) => {
  const map = useMap();
  useEffect(() => {
    if (data && data.features && data.features.length > 0) {
      try {
        const geoJsonLayer = L.geoJSON(data);
        const bounds = geoJsonLayer.getBounds();
        if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50] });
        }
      } catch (e) {
        console.warn("Could not fit bounds:", e);
      }
    }
  }, [data, map]);
  return null;
};

const MapViewer: React.FC<MapViewerProps> = ({ activeLayer, onLocationSelect }) => {
  const [geoData, setGeoData] = useState<GeoJSONCollection | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [usingFallback, setUsingFallback] = useState<boolean>(false);

  // URLs for data
  const DATA_URLS = {
    [MapLayer.CITY]: 'https://d3ucb59hn6tk5w.cloudfront.net/delhi_city.geojson',
    [MapLayer.PINCODE]: 'https://d3ucb59hn6tk5w.cloudfront.net/delhi_pincode.geojson',
    [MapLayer.AREA]: 'https://d3ucb59hn6tk5w.cloudfront.net/delhi_area.geojson',
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setUsingFallback(false);
      
      try {
        const response = await fetch(DATA_URLS[activeLayer]);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const json = await response.json();
        
        // Basic validation to ensure it has features
        if (!json.features || json.features.length === 0) {
            throw new Error("Empty FeatureCollection");
        }
        setGeoData(json);
      } catch (error) {
        console.warn("Failed to fetch GeoJSON, using fallback data:", error);
        setGeoData(FALLBACK_DATA);
        setUsingFallback(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeLayer]);

  // Use 'any' type for feature here to bypass strict GeoJSON interface conflicts with react-leaflet
  const onEachFeature = (feature: any, layer: L.Layer) => {
    // Robust name extraction handling various casing and keys
    const p = feature.properties || {};
    const name = p.name || p.Name || p.NAME || 
                 p.pin_code || p.pincode || p.Pincode || 
                 p.area || p.Area || p.AREA || 
                 p.locality || "Unknown Location";
    
    layer.bindTooltip(`${name}`, {
      permanent: false,
      direction: "top"
    });

    // Style helpers
    const setHighlight = (l: any) => {
        if (l.setStyle) {
            l.setStyle({
                weight: 3,
                color: '#6366f1',
                fillOpacity: 0.6
            });
        }
    };

    const resetHighlight = (l: any) => {
        if (l.setStyle) {
            l.setStyle({
                weight: 2,
                color: '#3b82f6',
                fillOpacity: 0.2
            });
        }
    };

    layer.on({
      mouseover: (e) => setHighlight(e.target),
      mouseout: (e) => resetHighlight(e.target),
      click: (e) => {
        const target = e.target;
        let center: [number, number] = DELHI_CENTER;

        // Safely get center based on layer type
        if (target.getBounds) {
          // It's a Polygon or Polyline
          const bounds = target.getBounds();
          const c = bounds.getCenter();
          center = [c.lat, c.lng];
        } else if (target.getLatLng) {
          // It's a Marker / Point
          const c = target.getLatLng();
          center = [c.lat, c.lng];
        }

        onLocationSelect({
          name: name,
          type: activeLayer,
          coordinates: center,
          properties: p
        });
      }
    });
  };

  const geoJsonStyle = {
    color: '#3b82f6',
    weight: 2,
    fillColor: '#3b82f6',
    fillOpacity: 0.2
  };

  return (
    <div className="h-full w-full relative bg-gray-100">
      {loading && (
        <div className="absolute inset-0 z-[1000] bg-white/50 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center p-4 bg-white rounded-xl shadow-lg">
             <svg className="animate-spin h-8 w-8 text-indigo-600 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-indigo-900 font-semibold">Loading Map Data...</span>
          </div>
        </div>
      )}

      {usingFallback && !loading && (
        <div className="absolute top-4 left-4 z-[900] max-w-sm">
             <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg shadow-lg flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                    <h3 className="font-bold text-sm">Using Demo Data</h3>
                    <p className="text-xs mt-1 opacity-90">External map data could not be loaded. Showing representative locations (Connaught Place, Saket, etc.) for demonstration.</p>
                </div>
             </div>
        </div>
      )}
      
      <MapContainer 
        center={DELHI_CENTER} 
        zoom={11} 
        scrollWheelZoom={true} 
        className="h-full w-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {geoData && (
          <GeoJSON 
            key={usingFallback ? 'fallback' : activeLayer} // Key ensures remount on data change
            data={geoData} 
            style={geoJsonStyle} 
            onEachFeature={onEachFeature} 
          />
        )}
        <BoundsFitter data={geoData} />
      </MapContainer>
    </div>
  );
};

export default MapViewer;