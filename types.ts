export interface GeoJSONFeature {
  type: "Feature";
  properties: {
    [key: string]: any;
    name?: string;
    pin_code?: string;
    area?: string;
  };
  geometry: {
    type: string;
    coordinates: any[];
  };
}

export interface GeoJSONCollection {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

export enum MapLayer {
  CITY = "City",
  PINCODE = "Pincode",
  AREA = "Area"
}

export interface SelectedLocation {
  name: string;
  type: string; // 'area', 'pincode', 'city'
  coordinates: [number, number]; // Center point for visualization
  properties: any;
}

export interface SimulationConfig {
  businessType: string;
  architecturalStyle: string;
  timeOfDay: string;
}

export interface AnalysisResult {
  markdownAnalysis: string;
  imageUrl?: string;
  loading: boolean;
}