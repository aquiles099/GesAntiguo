import { Options as HighchartsOptions } from 'highcharts';
import { BaseFormatter } from './base-formatter';

export class StackedColumn extends BaseFormatter 
{
    protected optionsToAdd: HighchartsOptions = {
        plotOptions: {
            column: {
                stacking: "normal",
                dataLabels: {
                    enabled: true
                }
            }
        },
    };

    constructor(currentOptions: HighchartsOptions) {
        super(currentOptions);
    }

    public execute(): void {
        this.appendRequiredOptions();
    }
}
