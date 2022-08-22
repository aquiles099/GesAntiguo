import { Options as HighchartsOptions } from 'highcharts';
import { BaseFormatter } from './base-formatter';
import { convertHexToRGBA } from '../../../../shared/helpers';


export class ActvityGauge extends BaseFormatter 
{
    protected optionsToAdd: HighchartsOptions = {
        pane: {
            startAngle: 0,
            endAngle: 360
        },
        plotOptions: {
            solidgauge: {
                dataLabels: {
                    enabled: false
                },
                linecap: 'round',
                stickyTracking: false,
                rounded: true
            }
        },
        yAxis: {
            min: 0,
            max: 100,
            lineWidth: 0,
            tickPositions: []
        },
        responsive: {
            rules: [
                {
                    condition: {
                        minWidth: 500
                    },
                    chartOptions: {
                        tooltip: {
                            borderWidth: 0,
                            backgroundColor: 'none',
                            shadow: false,
                            style: {
                                fontSize: '16px'
                            },
                            pointFormat: '{series.name}<br><span style="font-size:2em; color: {point.color}; font-weight: bold">{point.y}</span>',
                            positioner: function (labelWidth) {
                                return {
                                    x: (this.chart.chartWidth - labelWidth) / 2,
                                    y: (this.chart.plotHeight / 2) + 15
                                };
                            }
                        },
                    }
                }
            ]
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
        this.addPaneBackgroundOptions();
        this.addRangeOfYAxis();
        this.removeUnnecessaryOptions();
    }

    private addPaneBackgroundOptions():void
    {
        this.options.pane['background'] =  this.options.series.map((serie:any) => {

            return {
                outerRadius: serie.data[0].radius,
                innerRadius: serie.data[0].innerRadius,
                backgroundColor: convertHexToRGBA(serie.data[0].color, 30),
                borderWidth: 0
            };

        });
    }

    private addRangeOfYAxis():void
    {
        let {eje_y} = this.unformattedOptions;

        if(eje_y)
        {
            this.options.yAxis.min = eje_y.min;
            this.options.yAxis.max = eje_y.max;
        }
    }

    protected removeUnnecessaryOptions():void
    {
        delete this.options.xAxis;
        delete this.options.yAxis.title;
    }
}

