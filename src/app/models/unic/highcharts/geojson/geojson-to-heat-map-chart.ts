import { GeoJSONFile } from '../../geojson/geojson-file';
import { GeoJSONToHighchart } from './geojson-to-highchart';
import { ChartConfiguration } from '../../../../interfaces/analysis/analysis-chart-configuration';

export class GeoJSONToHeatMapChart extends GeoJSONToHighchart
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
            colores: {
                minColor: "#DDF0F6",
                maxColor: "#89CDE2"
            },
            series: [{
                name: 'Nº de elementos',
                data: this.buildSeries()
            }]
        });

        return this.options;
    }
    
    private buildSeries():Array<number|string>
    {
        const series = [];

        let i = 0;

        for(let category of this.geojson.getValuesByFeatureProperty(this.chartConfiguration.info) )
        {
            let data = this.featureData.find(data => data.value === category);

            series.push([i, 0, data.total]);

            i++;
        }

        return series;
    }
}