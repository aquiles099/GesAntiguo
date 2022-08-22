import { Component, Input, EventEmitter, Output, HostListener } from '@angular/core';
import { ChartConfiguration } from 'src/app/interfaces/analysis/analysis-chart-configuration';
import { BaseChart } from '../../../../models/unic/highcharts/base-chart';

@Component({
  selector: 'highchart',
  templateUrl: './highchart.component.html',
  styleUrls: ['./highchart.component.css']
})
export class HighchartComponent extends BaseChart
{
  @Input()
  public configuration: ChartConfiguration;

  @Input()
  public width: number;

  @Input()
  public height: number;

  constructor()
  {
    super();
  }

  chartCallback: Highcharts.ChartCallbackFunction = (chart) => {
    if(!this.chartRef)
    {
      this.chartRef = chart;
      this.chartRef.showLoading();
      this.updateChartSize();
    }
  };

  public build(options:any): void
  {
    try {
      
      this.chartRef.showLoading();

      this.setUnformattedOptions(options);
      
      // añadir datos necesarios a clase base
      this.setChartType(this.getChartType());
      this.setUnformattedChartType(this.configuration.chartType);

      // formatear opciones recibidas
      // y agregar nuevas opciones por tipo de grafico
      // si es necesario
      this.formatUnformattedOptionsAndAddThemToDefaultOptions();
      this.appendAdditionalOptionsByChartTypeIfRequired();
      
      // cambiar estado bandera de actualizacion de highcharts
      this.updateFlag = true

      this.chartRef.hideLoading();

    } catch (error) {

      console.error(error);
    }
  }

  private getChartType():string
  {
    let unformatedType = this.configuration.chartType,
        formatedType = undefined;

    switch(true)
    {
      case unformatedType.includes('line'):
        formatedType = "line";
        break;
      case unformatedType.includes('area'):
        formatedType = "area";
        break;
      case unformatedType.includes('vertical_bar'):
        formatedType = "column";
        break;
      case unformatedType.includes('horizontal_bar'):
        formatedType = "bar";
        break;
      case unformatedType.includes('pie'):
        formatedType = "pie";
        break;
      case unformatedType.includes('heat'):
        formatedType = "heatmap";
        break;
      case unformatedType.includes('tree'):
        formatedType = "treemap";
        break;
      case unformatedType.includes('activity_gauge'):
        formatedType = "solidgauge";
        break;
      case unformatedType.includes('radial'):
        formatedType = "column";
        break;
    }

    return formatedType;
  }

  public updateSeries(newSeries:Array<any>):void
  {
    try {
      
      this.chartRef.showLoading();

      this.options.series = newSeries;

      this.updateFlag = true

      this.chartRef.redraw(false);
      
      this.chartRef.hideLoading();
  
    } catch (error) {

      console.error(error);
      this.chartRef.hideLoading();

    }
  }

  @HostListener('window:resize')
  private updateChartSize():void
  {
    if(this.chartRef)
    {
      // si se activa el modo "pantalla completa"
      // asignar tamaño actual de ventana
      if(document.fullscreenElement)
      {
        this.chartRef.setSize(
          (window as any).visualViewport ? (window as any).visualViewport.width : window.screen.width,
          (window as any).visualViewport ? (window as any).visualViewport.height : window.screen.height
        );
      }else
      {
        // sino asignar tamaño de contenedor de grafico (menos alguna diferencia para relleno)
        this.setSize(
          this.width - 10,
          this.height - 10
        );
      }

    }
  }

}