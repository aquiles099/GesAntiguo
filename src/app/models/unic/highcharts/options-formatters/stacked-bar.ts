import { Options as HighchartsOptions } from 'highcharts';
import { BaseFormatter } from './base-formatter';

export class StackedBar extends BaseFormatter 
{
    protected optionsToAdd: HighchartsOptions = {
        plotOptions: {
            series: {
                stacking: "normal"
            }
        }
    };

    constructor(currentOptions: HighchartsOptions) {
        super(currentOptions);
    }

    public execute(): void {
        this.appendRequiredOptions();
    }
}
