import { Options as HighchartsOptions } from 'highcharts';
import { BaseFormatter } from './base-formatter';

export  class StackedArea extends BaseFormatter
{
    protected optionsToAdd: HighchartsOptions = {
        tooltip: {
          split: true
        },
        plotOptions: {
          area: {
            stacking: 'normal'
          }
        }
    };

    constructor(currentOptions:HighchartsOptions)
    {
        super(currentOptions);
    }
    
    public execute():void
    {
        this.appendRequiredOptions();
        this.sortSeriesAsRequired();
    }
    
    protected sortSeriesAsRequired(): void 
    {
        let highestValueOfEachSerie = [];

        this.options.series.reduce((acum, serie, index) => {

            let highestValue = serie.data.reduce((acum2: number, value: number) => {
             
                                            if(acum2 < value)
                                              acum2 = value;

                                            return acum2;

                                          }, 0);

            highestValueOfEachSerie.push({ index, highestValue });

        }, 0);

        highestValueOfEachSerie = highestValueOfEachSerie.sort((a, b) => b.highestValue - a.highestValue);

        let seriesSorted = [];

        highestValueOfEachSerie.forEach((object: any) => seriesSorted.push(this.options.series[object.index]));

        this.options.series = seriesSorted;
    }
}
