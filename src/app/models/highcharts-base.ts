import * as Highcharts from "highcharts";

/**
 *  required modules
 */
require('highcharts/highcharts-more')(Highcharts);
require('highcharts/modules/exporting')(Highcharts);
require('highcharts/modules/export-data')(Highcharts);
require('highcharts/modules/annotations')(Highcharts);
require('highcharts/modules/accessibility')(Highcharts);
require('highcharts/modules/heatmap')(Highcharts);
require('highcharts/modules/treemap')(Highcharts);
require('highcharts/modules/solid-gauge')(Highcharts);

declare var require: any;

export class HighchartsBase
{
  private defaultOptions:Highcharts.Options =  {
    "chart":{
      "style": {
        "fontFamily": "Raleway"
      },
      "type": "line"
    },
    "title": {
      "text": "",
      "style":{
        "whiteSpace": "nowrap",
        "overflow": "hidden",
        "textOverflow": "ellipsis"
      }
    },
    "lang": {
      "contextButtonTitle": "Opciones",
      "printChart": "Imprimir",
      "downloadCSV": "Exportar CSV",
      "downloadJPEG": "Exportar JPEG",
      "downloadPDF": "Exportar PDF",
      "downloadPNG": "Exportar PNG",
      "downloadSVG": "Exportar SVG",
      "downloadXLS": "Exportar XLS",
      "viewFullscreen": "Pantalla completa",
      "exitFullscreen": "Salir de pantalla completa",
      "loading": "Cargando...",
      "noData": "Sin datos",
      "resetZoom": "Restablecer zoom",
      "resetZoomTitle": "Restablecer zoom"
    },
    "exporting": {
      "buttons": {
        "contextButton": {
          "menuItems": [
            "viewFullscreen",
            "separator",
            "downloadPNG",
            "downloadSVG",
            "downloadPDF",
            "separator",
            "downloadXLS"
          ],
        }
      },
      "enabled": true
    },
    "navigation": {
      "buttonOptions": {
        "align": "right",
        "verticalAlign": "top",
        "y": 0
      },
      "menuStyle": {
        "overflow-y": "scroll",
        "max-height": "200px",
      }
    },
    "credits": {
      "enabled": false
    },
    "responsive": {
      "rules": [
        {
          "condition": {
            "maxWidth": 500
          },
          "chartOptions": {
            "xAxis": {
              "title": {
                "text": null
              }
            },
            "yAxis": {
              "title": {
                "text": null
              }
            },
            "legend": {
              "itemStyle": {
                "fontSize": "8px"
              }
            }
          }
        }
      ]
    }
  };

  public options:Highcharts.Options = {};

  public Highcharts: typeof Highcharts = Highcharts;
  public chartRef: Highcharts.Chart;
  public updateFlag: boolean = false;

  public chartCallback: Highcharts.ChartCallbackFunction = (chart) => {
    if (!this.chartRef)
      this.chartRef = chart;
  };

  private type:string;

  public constructor()
  { 
    this.type = this.defaultOptions.chart.type;
    Object.assign(this.options, this.defaultOptions);
  }

  public setOptions(options):void
  {
    this.options = options;
  }

  protected addCustomButtons(buttons: any[]): void {
    this.options
      .exporting
      .buttons
      .contextButton
      .menuItems.unshift(...buttons);
  }

  public changeType(type:string):void
  {
    this.type = type;

    switch( type )
    {
      case "line":
      case "area":
      case "bar":
      case "column":
        this.options.chart.type = type;
        this.options["plotOptions"] = {
          "series":{"stacking": undefined},
          "column": {
            "stacking": undefined,
            "dataLabels": { "enabled": false }
          }
        };
        break;
        
      case "stackedBar":
        this.options.chart.type = "bar";
        this.options["plotOptions"] = {"series":{"stacking": "normal"}};
        break;
     
      case "stackedColumn":
        this.options.chart.type = "column";
        this.options["plotOptions"] = {
            "column": {
              "stacking": 'normal',
              "dataLabels": { "enabled": true }
          }
        };
        break;
    } 

    this.updateAndRedraw();
  }
  
  public updateAndRedraw():void
  {
    this.updateFlag = true
    this.chartRef.redraw(false);
  }
}
