import * as Highcharts from "highcharts";

export class TooltipFormatter {

    protected getForStackedAreaChart(): Highcharts.Options 
    {
        return {
            tooltip: {
                useHTML: true,
                formatter: function () {

                    let ul = '<ul>';

                    this.points.forEach(pointObject => {

                        ul += '<li> ' + pointObject.point.series.name + ' - ' + pointObject.y + ' Kw </li>';

                    });

                    ul += '</ul>';

                    return '<b> Fecha: ' + this.x + '</b><br/>' + ul;

                },
                split: true
            }
        };
    }

    protected getForStackedBarChart(): Highcharts.Options {

        return {
          tooltip: {
            formatter: function () {
    
              return '<b>' + this.point.category + '</b><br/>' +
                this.series.name + ': ' + this.point.y +
                '<br/>Total:' + this.point.total;
            }
          }
        };
    
    }

    protected getStackedColumnChartRequiredOptions(): Highcharts.Options {

        return {
          tooltip: {
            formatter: function () {
    
              return '<b>' + this.point.category + '</b><br/>' +
                this.series.name + ': ' + this.point.y +
                '<br/>Total:' + this.point.total;
            }
          }
        };
    
    }
}    
