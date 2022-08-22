import { Component, QueryList, ViewChild, ViewChildren, ElementRef, Input, ChangeDetectorRef } from '@angular/core';
import { HideableSectionComponent } from '../../../../shared/hideable-section/hideable-section.component';
import { ConfigurationModalComponent } from './configuration-modal/configuration-modal.component';
import { delayExecution } from 'src/app/shared/helpers';
import { GeojsonFilesService } from '../../../../../../services/unic/geojson-files.service';
import { ChartComponent } from './chart/chart.component';
import { LinearIndicatorComponent } from './linear-indicator/linear-indicator.component';
import { LatLngBounds, Map } from 'leaflet';
import { geojsonToHighcharts } from 'src/app/models/unic/highcharts/geojson/formatter';
import { ObjectUtility } from '../../../../../../shared/object-utility';
import { GeoJSONFile } from 'src/app/models/unic/geojson/geojson-file';
import { MapService } from '../../../../../../services/unic/map.service';
import { ExportViewComponent } from './export-view/export-view.component';
import { ChartData } from 'src/app/interfaces/analysis/analysis-chart-configuration';
import { AnalysisConfiguration } from '../../../../../../interfaces/analysis/analysis-chart-configuration';

@Component({
  selector: 'analysis-charts',
  templateUrl: './analysis-charts.component.html',
  styleUrls: ['./analysis-charts.component.css']
})
export class AnalysisChartsComponent extends HideableSectionComponent 
{
  @Input()
  public map:Map;

  @ViewChild(ConfigurationModalComponent)
  private ConfigurationModal:ConfigurationModalComponent;

  @ViewChildren("chartContainerRef")
  private chartsContainers:QueryList<ElementRef<HTMLElement>>;
  
  @ViewChildren(ChartComponent)
  public charts:QueryList<ChartComponent>;

  @ViewChildren(LinearIndicatorComponent)
  public linearIndicators:QueryList<LinearIndicatorComponent>;

  public chartsData:Array<ChartData>  = [];

  private projectedLayerFiles:Array<GeoJSONFile>;

  public isActive:boolean = false;

  public movingMap:boolean = false; // estado para evitar que evento de "movimiento" en mapa se ejecute multiples veces.
  
  public showSpinner:boolean = false;

  public updateChartsPerMapDisplayed:() => void = () => {

    if( ! document.fullscreenElement && ! this.movingMap )
    {
      this.movingMap = true;

      this._mapService.disableEvents();

      this.showSpinner = true;

      const anyChartInVerticalSection = this.chartsContainers.filter(container => Number(container.nativeElement.getAttribute("data-position")) <= 2)[0],
          anyChartInHorizontalSection = this.chartsContainers.filter(container => Number(container.nativeElement.getAttribute("data-position")) > 3 )[0],
          chartInMiddleSection = this.chartsContainers.find(container => Number(container.nativeElement.getAttribute("data-position")) === 3 );

      let sw_x, sw_y, sw_coord;

      switch( true )
      {
        case anyChartInVerticalSection !== undefined && anyChartInHorizontalSection === undefined:
          sw_x = anyChartInVerticalSection.nativeElement.getBoundingClientRect().right;
          sw_y = this.map.getContainer().getBoundingClientRect().bottom; 
          break;

        case anyChartInHorizontalSection !== undefined && anyChartInVerticalSection === undefined:
          sw_x = this.map.getContainer().getBoundingClientRect().left;
          sw_y = anyChartInHorizontalSection.nativeElement.getBoundingClientRect().top; 
          break;

        case anyChartInHorizontalSection !== undefined && anyChartInVerticalSection !== undefined:
          sw_x = anyChartInVerticalSection.nativeElement.getBoundingClientRect().right;
          sw_y = anyChartInHorizontalSection.nativeElement.getBoundingClientRect().top; 
          break;
      
        case chartInMiddleSection !== undefined:
          sw_x = chartInMiddleSection.nativeElement.getBoundingClientRect().right;
          sw_y = chartInMiddleSection.nativeElement.getBoundingClientRect().top; 
          break;
      }

      sw_coord = this.map.containerPointToLatLng([sw_x, sw_y]);

      const ne_x = document.getElementById("mapToolbar").getBoundingClientRect().right,
            ne_y = document.getElementById("mapToolbar").getBoundingClientRect().bottom;

      const ne_coord = this.map.containerPointToLatLng([ne_x, ne_y]);
      
      const bbox = new LatLngBounds([sw_coord.lng, sw_coord.lat], [ne_coord.lng, ne_coord.lat]);

      const chartsToUpdate = this.charts.filter(chart => chart.configuration.analysisMode === "Mapa visualizado"),
            linearIndicatorsToUpdate = this.linearIndicators.filter(indicator => indicator.configuration.analysisMode === "Mapa visualizado")

      const updateChartClosure = (chart:ChartComponent|LinearIndicatorComponent) => {
        
          if( chart instanceof ChartComponent ) 
            chart.chartRef.showLoading();

          const geojsonFile = this.projectedLayerFiles.find(file => file.layerId === chart.configuration.layerId);
          
          const geojsonFileCopy = new GeoJSONFile( ObjectUtility.simpleCloning(geojsonFile) );

          const geojsonContent = geojsonFileCopy.getContent(); 

          geojsonContent.features = geojsonContent.features.filter(
            feature => {

              if( (feature.geometry.coordinates as Array<number>).length )
              {
                return geojsonFile.geometryType === "Point" ? 
                        bbox.contains( feature.geometry.coordinates ) :
                        bbox.intersects( new LatLngBounds(feature.geometry.coordinates) );
              }
              else
              {
                return false;
              }
            }
          );

          geojsonFileCopy.updateContent(geojsonContent);
          
          const newData = geojsonToHighcharts(chart.configuration, geojsonFileCopy);
          
          chart instanceof LinearIndicatorComponent ? chart.updateSerie(newData.texto) : chart.updateSeries(newData.series);    

          this._changeDetectorRef.detectChanges();
      }

      const charts = [...chartsToUpdate, ...linearIndicatorsToUpdate];

      charts.forEach(chart => setTimeout(() => updateChartClosure(chart), 0));

      setTimeout(() => {
        this.showSpinner = false;
        this._mapService.enableEvents();
        this.movingMap = false;
      }, 250);

    }

  };

  @ViewChild(ExportViewComponent)
  public ExportView:ExportViewComponent;

  constructor(
    private _geojsonFilesService:GeojsonFilesService,
    private _changeDetectorRef:ChangeDetectorRef,
    private _mapService:MapService,
  )
  {
    super();
  }

  public async show():Promise<void>
  {
    this.projectedLayerFiles = this._geojsonFilesService.getProjected();

    await super.show();

    this.isActive ?
    this.renderCharts() :
    await this.ConfigurationModal.show();
  }

  public async onHideConfigurationModal(data?:any):Promise<void>
  {
    data ?
    await this.buildConfigurationsAndRenderCharts(data) :
    await this.hide();
  }

  private async buildConfigurationsAndRenderCharts(analisisConfiguration:AnalysisConfiguration):Promise<void>
  {
    for(let configuration of analisisConfiguration.configurations)
    {
      const geojsonFile = this.projectedLayerFiles.find(file => file.layerId === configuration.layerId);
        
      this.chartsData.push({
        configuration: configuration,
        parameters: geojsonToHighcharts(configuration, geojsonFile)
      });

    }

    await delayExecution(500);

    this.isActive = true;

    await this.renderCharts();
  }

  private async renderCharts():Promise<void>
  {
    await delayExecution(500);

    [...this.charts, ...this.linearIndicators].forEach(chart => {
      setTimeout(() => {
        const chartConfiguration = this.chartsData.find(data => data.configuration.position == chart.configuration.position);
        chart.build(chartConfiguration.parameters);      
      });
    });

    const isThereAnyChartPerMapDisplayed = this.chartsData.some(data => data.configuration.analysisMode === "Mapa visualizado");

    if( isThereAnyChartPerMapDisplayed )
    {
      this.map.on("moveend", this.updateChartsPerMapDisplayed);
      this.map.fire("moveend", this.updateChartsPerMapDisplayed);
    }
  }

  private async hideEnabledCharts():Promise<void>
  {
    for(let chartContainer of this.chartsContainers)
    {
      chartContainer.nativeElement.classList.remove("animate__fadeIn");
      chartContainer.nativeElement.classList.add("animate__fadeOut");
    }

    await delayExecution(500);
  }

  public async export():Promise<void>
  {
    await this.ExportView.exportModeSelectionModal.show();
  }

  public async hide():Promise<void>
  {
    if( this.chartsContainers.length )
      await this.hideEnabledCharts();

    this.map.off("moveend", this.updateChartsPerMapDisplayed);

    await super.hide();
  }

  public desactivate():void
  {
    this.chartsData = [];
    this.isActive = false;
  }
}
