import { Options as HighchartsOptions } from 'highcharts';
import { BaseFormatter } from './base-formatter';

export class RadialBar extends BaseFormatter 
{
    protected optionsToAdd: HighchartsOptions|any = {
        chart: {
            type: 'column',
            inverted: true,
            polar: true
        },
        pane: {
            size: '85%',
            innerSize: '20%',
            endAngle: 270
        },
        xAxis: {
            tickInterval: 1,
            labels: {
                align: 'right',
                useHTML: true,
                allowOverlap: true,
                step: 1,
                y: 3,
                style: {
                    fontSize: '13px'
                }
            },
            lineWidth: 0,
            title: {
                text: ""
            }
        },
        yAxis: {
            crosshair: {
                enabled: true,
                color: '#333'
            },
            lineWidth: 0,
            tickInterval: 25,
            reversedStacks: false,
            endOnTick: true,
            showLastLabel: true,
            title: {
                text: ""
            }
        },
        plotOptions: {
            column: {
                stacking: 'normal',
                borderWidth: 0,
                pointPadding: 0,
                groupPadding: 0.15
            }
        }
    };

    constructor(
        currentOptions:HighchartsOptions|any,
        unformattedOptions?:any
    )
    {
        super(currentOptions, unformattedOptions);
    }

    public execute(): void {
        this.appendRequiredOptions();
    }

}

