import { getRandomColor, sortArray } from '../../../../shared/helpers';
import { GeoJSONFile } from '../../geojson/geojson-file';
import { GeoJSONToHighchart } from './geojson-to-highchart';
import { ChartConfiguration } from '../../../../interfaces/analysis/analysis-chart-configuration';

export class GeoJSONToActivityGaugeChart extends GeoJSONToHighchart
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
            eje_y: {
                min: 0,
                max: this.getMaxYAxis()
            },
            series: this.buildSeries()
        });

        return this.options;
    }

    private getMaxYAxis():number
    {
        return sortArray(
                    this.featureData,
                    "desc",
                    "total"
                )[0].total;
    }

    private buildSeries():any
    {
        let radius =  7.75;
        
        return sortArray( 
                        this.featureData,
                        "asc",
                        "total"
                    )
                    .map(data => {

                        let item = {
                            name: data.value,
                            data: [
                                {
                                    radius: `${radius}%`,
                                    innerRadius: `${radius - 3.5}%`,
                                    y: data.total,
                                    color: getRandomColor()
                                }
                            ]
                        };

                        radius += 6.25;

                        return item;
                    });
    }
    
}