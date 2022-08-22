import { Options as HighchartsOptions } from 'highcharts';
import { BaseFormatter } from './base-formatter';

export class TreeMap extends BaseFormatter 
{
    constructor(
        currentOptions: HighchartsOptions,
        unformattedOptions?:any
    ) {
        super(currentOptions, unformattedOptions);
    }

    public execute(): void {

        if( ! this.allSeriesHasAssignedColor() )
        {             
            this.optionsToAdd = {
                colorAxis: {
                    minColor: "#DDF0F6",
                    maxColor: "#89CDE2"
                }
            };
        }

        this.appendRequiredOptions();
        this.addRequiredSeriesOptions();
        this.removeUnnecessaryOptions();
    }

    protected allSeriesHasAssignedColor():boolean
    {
        return this.options.series.every(serie => 
            serie.data.every(data => data.color)
        );
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
    protected removeUnnecessaryOptions():void
    {
        delete this.options.xAxis;
        delete this.options.yAxis;
        delete this.options.responsive.rules[0];
    }
}
