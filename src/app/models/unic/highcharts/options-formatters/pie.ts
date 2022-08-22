import { Options as HighchartsOptions } from 'highcharts';
import { BaseFormatter } from './base-formatter';

export class Pie extends BaseFormatter 
{
    protected optionsToAdd: HighchartsOptions = {
        plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: 'pointer',
                dataLabels: {
                    enabled: false
                },
                showInLegend: true
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
