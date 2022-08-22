import { GeoJSONFile } from '../../geojson/geojson-file';
import { GeoJSONToHighchart } from './geojson-to-highchart';
import { ChartConfiguration } from '../../../../interfaces/analysis/analysis-chart-configuration';

export class GeoJSONToLineChart extends GeoJSONToHighchart
{
    constructor(
        geojson:GeoJSONFile,
        chartConfiguration:ChartConfiguration, 
    )
    {
        super(geojson, chartConfiguration);
    }

    public execute():any
    {
        Object.assign(this.options, {
            eje_x: {
                titulo:  this.chartConfiguration.info,
                categorias: this.geojson.getValuesByFeatureProperty(this.chartConfiguration.info),
            },
            series: [{
                name: 'Nº de elementos',
                data: this.featureData.map(data => data.total)
            }]
        });
        
        return this.options;
    }    
}