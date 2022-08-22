import { FeatureSheetTemplate } from './export/feature-sheet-template';
import { FeatureListingTemplate } from './export/feature-listing-template';
import { PlanimetryBox, PlanimetryTemplate } from './planimetry/planimetry-template';
import { LayerStyle } from './layer-style';

export interface IGeoJSONFile
{
    readonly name:string;
    readonly layer_id:number;
    readonly layer_name:string;
    readonly module_name:string;
    readonly geometry_type:GeometryType;
    readonly content:any;
    readonly default_style:LayerStyle;
    readonly feature_property_values: FeaturePropertyValues;
    readonly disabled_feature_properties: Array<string>;
    readonly feature_filter: FeaturePropertyValues;
    readonly feature_property_categories: FeaturePropertyValues;
    readonly categorization:string|null;
    readonly status:GeoJSONFileStatus;
    readonly enabled:boolean;
    readonly feature_pdf_export_templates: IGeoJSONFeaturePdfExportTemplates;
    readonly planimetry_templates: Array<PlanimetryTemplate>;
    readonly planimetry_boxes: Array<PlanimetryBox>;
    generatedPlanesNumber:number;
}

export type GeoJSONFileStatus = "projected" | "unprojected" | "undefined";

export type GeometryType = "Point" | "LineString" | "Polygon" | "MultiLineString" | "MultiPolygon";

export const GEOMETRY_TYPES:GeometryType[] = [
    "Point",
    "LineString",
    "Polygon",
    "MultiLineString",
    "MultiPolygon"
];

export interface FeaturePropertyValues
{
    [key:string] : Array<string|number|boolean>;
}

export interface IGeoJSONFeaturePdfExportTemplates
{
    sheet: Array<FeatureSheetTemplate>;
    listing: Array<FeatureListingTemplate>;
}