import { GeoJSONFile } from '../../geojson/geojson-file';
import { GeoJSONToHighchart } from './geojson-to-highchart';
import { ChartConfiguration } from '../../../../interfaces/analysis/analysis-chart-configuration';

export class GeoJSONToTreeMapChart extends GeoJSONToHighchart
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
        Object.assign(this.options, {
            series: this.buildSeries()
        });

        return this.options;
    }

    private buildSeries():any[]
    {
        return [{
            layoutAlgorith: "squarified",
            data:  this.featureData
                        .map(data => {
                            return {
                                name: data.value.toString(),
                                value: data.total,
                                colorValue: data.total
                            };
                        })
        }];
    }
}