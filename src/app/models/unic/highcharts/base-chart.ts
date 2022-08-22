import * as Highcharts from "highcharts";

/**
 * options formatters
 */
import { StackedArea as StackedAreaChartOptionsFormatter } from './options-formatters/stacked-area';
import { StackedColumn as StackedColumnChartOptionsFormatter } from './options-formatters/stacked-column';
import { StackedBar as StackedBarChartOptionsFormatter} from './options-formatters/stacked-bar';
import { Pie as PieChartOptionsFormatter } from './options-formatters/pie';
import { HeatMap as HeatMapChartOptionsFormatter } from './options-formatters/heat-map';
import { TreeMap as TreeMapChartOptionsFormatter } from './options-formatters/tree-map';
import { ActvityGauge as ActvityGaugeChartOptionsFormatter } from './options-formatters/actvity-gauge';
import { RadialBar as RadialBarChartOptionsFormatter } from './options-formatters/radial-bar';

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

export class BaseChart {

  public options:Highcharts.Options = {
    "chart":{
      "style": {
        "fontFamily": "Raleway"
      }
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
      "noData": "Sin datos"
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
        "max-height": "100px",
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

  protected unformattedOptions: any;
  protected chartType: string;
  protected unformattedChartType: string;

  public Highcharts: typeof Highcharts = Highcharts;
  public chartRef: Highcharts.Chart;
  public updateFlag: boolean = false;

  public constructor()
  { }

  public setOptions(options):void
  {
    this.options = options;
  }

  public setUnformattedOptions(unformattedOptions):void
  {
    this.unformattedOptions = unformattedOptions;
  }
  
  public setChartType(type:string):void
  {
    this.chartType = type;
  }
 
  public setUnformattedChartType(type:string):void
  {
    this.unformattedChartType = type;
  }

  protected formatUnformattedOptionsAndAddThemToDefaultOptions():any
  {
    let {titulo, subtitulo, eje_y, eje_x, series} = this.unformattedOptions;

    Object.assign(this.options, {
        chart:{
          type: this.chartType
        },
        series: series,
        title: {
          text: titulo
        },
        subtitle: {
          text: subtitulo
        }
    });

    if(eje_x)
    {
      Object.assign(this.options, {
        xAxis: {
          categories: eje_x.categorias,
          title: {
            text: eje_x.titulo
          }
        }
      });
    }
    
    Object.assign(this.options, {
      yAxis: {
        title: {
          text: eje_y ?? "Valores"
        }       
      }
    });
    
  }

  protected appendAdditionalOptionsByChartTypeIfRequired():void
  {
    let optionsFormatter = this.getOptionsFormatterByType();

    if(optionsFormatter)
    {
      optionsFormatter.execute();
      this.setOptions(optionsFormatter.getOptions());
    }
  }

  protected getOptionsFormatterByType():
  StackedAreaChartOptionsFormatter| StackedColumnChartOptionsFormatter |StackedBarChartOptionsFormatter |
  PieChartOptionsFormatter | HeatMapChartOptionsFormatter | TreeMapChartOptionsFormatter | ActvityGaugeChartOptionsFormatter
  {
    let optionsFormatter = null;

    switch (this.unformattedChartType)
    {
      case "stacked_area_chart":
        optionsFormatter = new StackedAreaChartOptionsFormatter(this.options); 
        break;
        
      case "stacked_vertical_bar_chart":
        optionsFormatter = new StackedColumnChartOptionsFormatter(this.options); 
        break;

      case "stacked_horizontal_bar_chart":
        optionsFormatter = new StackedBarChartOptionsFormatter(this.options); 
        break;

      case "pie_chart":
        optionsFormatter = new PieChartOptionsFormatter(this.options); 
        break;
    
      case "heat_map":
        optionsFormatter = new HeatMapChartOptionsFormatter(this.options, this.unformattedOptions); 
        break;
    
      case "tree_map":
        optionsFormatter = new TreeMapChartOptionsFormatter(this.options); 
        break;
   
      case "activity_gauge":
        optionsFormatter = new ActvityGaugeChartOptionsFormatter(this.options, this.unformattedOptions); 
        break;
     
      case "radial_bar_chart":
        optionsFormatter = new RadialBarChartOptionsFormatter(this.options); 
        break;

    } 

    return optionsFormatter;
  }

  protected addCustomButtons(buttons: any[]): void {
    this.options
      .exporting
      .buttons
      .contextButton
      .menuItems.unshift(...buttons);
  }

  public setSize(width?: number, height?: number): void {
    this.chartRef.setSize(width, height);
  }

}
