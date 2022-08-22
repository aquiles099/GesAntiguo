import { GeoJSONFile } from '../../geojson/geojson-file';
import {Options as HighchartOptions} from "highcharts";
import { ChartConfiguration } from 'src/app/interfaces/analysis/analysis-chart-configuration';

export abstract class GeoJSONToHighchart
{
    protected geojson:GeoJSONFile;
    protected chartConfiguration:ChartConfiguration;
    protected featureData: Array<any>;

    protected options:any;

    constructor(
        geojson:GeoJSONFile,
        chartConfiguration:ChartConfiguration
    )
    {
        this.geojson = geojson;
        this.chartConfiguration = chartConfiguration;
        this.featureData = this.geojson.getContent().features.length > 0 ? this.geojson.getFeaturesNumberByPropertyValue( chartConfiguration.info ) : [];
        
        this.options = {
            titulo: chartConfiguration.info ? `${chartConfiguration.info.toUpperCase()} (${chartConfiguration.analysisMode})` : null,        
            subtitulo: geojson.layer_name,
        }
    }

    public abstract execute():any;
}
