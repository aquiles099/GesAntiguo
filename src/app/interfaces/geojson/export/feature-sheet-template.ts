import { FeatureImage } from '../../../services/unic/geojson-layer-images.service';

export interface FeatureSheetTemplate
{
    title: string;
    mapImageSrc: string;
    featureImages:Array<FeatureImage>;
    propertiesGroups: Array<PropertyGroup|SheetSection>;
    readonly created_at:string;
    readonly updated_at:string;
}

export interface PropertyGroup 
{
    title: string;
    columns: Array<string[]>
}

export type SheetSection = "map"|"images";
