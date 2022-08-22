import { GeoJSONFile } from '../../geojson/geojson-file';
import { GeoJSONToHighchart } from './geojson-to-highchart';
import { ChartConfiguration } from '../../../../interfaces/analysis/analysis-chart-configuration';

export class GeoJSONToLinearGaugeChart extends GeoJSONToHighchart
{
    constructor(
        geojson:GeoJSONFile,
        chartConfiguration:ChartConfiguration
    )
    {
        super(geojson, chartConfiguration);
    }

    public execute():any
    {
        return {
            titulo: `${this.geojson.layer_name} <br> (${this.chartConfiguration.analysisMode})`,
            texto: `Nº de elementos: ${this.geojson.totalFeatures}`,
            buttons: false
        };
    }
    
}