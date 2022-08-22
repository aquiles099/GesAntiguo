import { Options as HighchartsOptions } from 'highcharts';
import { BaseFormatter } from './base-formatter';

export class HeatMap extends BaseFormatter 
{
    constructor(
        currentOptions:HighchartsOptions|any,
        unformattedOptions?:any
    )
    {
        super(currentOptions, unformattedOptions);
    }

    public execute(): void {
        this.appendRequiredOptions();
        this.addRequiredSeriesOptions();
    }

    protected appendRequiredOptions():void
    {
        let {colores, eje_y} = this.unformattedOptions;
        
        Object.assign(this.options, {
          colorAxis: colores,
          yAxis: {
            categories: eje_y
          }
        });
    }

    protected addRequiredSeriesOptions():void
    {
        Object.assign(this.options.series[0], {
            dataLabels: {
              enabled: true,
              color: '#000000'
          }
        });
    }
}
