import { ChartConfiguration } from 'src/app/interfaces/analysis/analysis-chart-configuration';
import { GeoJSONFile } from '../../geojson/geojson-file';
import { GeoJSONToHighchart } from './geojson-to-highchart';

export class GeoJSONToBarChart extends GeoJSONToHighchart
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
        Object.assign(this.options,{
            eje_y: 'Nº de elementos',
            eje_x: {
                categorias: [this.chartConfiguration.info],
                titulo: "Valores"
            },
            series: this.buildSeries()
        });
        
        return this.options;
    }

    private buildSeries():Array<any>
    {
        return this.featureData
                    .map(data => {

                        return {
                            name: data.value,
                            data: [data.total] 
                        };

                    });
    }
    
}