import { Component, QueryList, ViewChild, ViewChildren, ElementRef, Input, ChangeDetectorRef, AfterViewChecked } from '@angular/core';
import { HideableSectionComponent } from '../../../../../../shared/hideable-section/hideable-section.component';
import { delayExecution } from 'src/app/shared/helpers';
import { AnalysisConfiguration, ChartConfiguration } from '../../../../../../../interfaces/analysis/analysis-chart-configuration';
import { MapService } from '../../../../../../../services/unic/map.service';
import { ProjectService } from '../../../../../../../services/unic/project.service';
import { ProjectsService } from '../../../../../../../services/unic/projects.service';
import { ToastrService } from 'ngx-toastr';
import { Map } from 'leaflet';
import { ModalDeConfiguracionComponent } from './modal-de-configuracion/modal-de-configuracion.component';
import { VistaExportacionComponent } from './vista-exportacion/vista-exportacion.component';
import { GeoJSONHelper } from '../../../../../../../models/geojson-helper';
import { ShepherdService } from 'angular-shepherd';
import { toggleFullscreen } from '../../../../../../../shared/helpers';
import { GraficoComponent } from './grafico/grafico.component';
import { IndicadorLinealComponent } from './indicador-lineal/indicador-lineal.component';

export interface ChartData
{
  configuration: ChartConfiguration;
  parameters: any;
}

@Component({
  selector: 'herramienta-analisis-grafico',
  templateUrl: './analisis-grafico.component.html',
  styleUrls: ['./analisis-grafico.component.css']
})
export class AnalisisGraficoComponent extends HideableSectionComponent implements AfterViewChecked
{
  @Input()
  public map:Map;

  @ViewChild(ModalDeConfiguracionComponent)
  private ConfigurationModal:ModalDeConfiguracionComponent;

  @ViewChildren("chartContainerRef")
  private chartsContainers:QueryList<ElementRef<HTMLElement>>;
  
  @ViewChildren(GraficoComponent)
  public charts:QueryList<GraficoComponent>;

  @ViewChildren(IndicadorLinealComponent)
  public linearIndicators:QueryList<IndicadorLinealComponent>;

  public chartsData:Array<ChartData>  = [];

  public isActive:boolean = false;

  public movingMap:boolean = false; // estado para evitar que evento de "movimiento" en mapa se ejecute multiples veces.
  
  public showSpinner:boolean = false;

  public updateChartsPerMapDisplayed:() => Promise<void> = async () => {

    if( ! document.fullscreenElement && ! this.movingMap )
    {
      this.movingMap = true;

      this._mapService.disableEvents();

      this.showSpinner = true;

      const chartsToUpdate = this.charts.filter(chart => chart.configuration.analysisMode === "Mapa visualizado"),
            linearIndicatorsToUpdate = this.linearIndicators.filter(indicator => indicator.configuration.analysisMode === "Mapa visualizado")

      const charts = [...chartsToUpdate, ...linearIndicatorsToUpdate];

      charts.forEach(chart => {

        if( chart instanceof GraficoComponent ) 
          chart.chartRef.showLoading();

      });

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

      const swPoint = {
        type: "Point",
        coordinates: [ sw_coord.lng, sw_coord.lat]
      }; 
   
      const nePoint = {
        type: "Point",
        coordinates: [ ne_coord.lng, ne_coord.lat]
      }; 

      [swPoint, nePoint].forEach(point => {
        GeoJSONHelper.reproyectGeometry(
          null,
          this._projectService.configuration.datos_municipio.nombre_proj4, 
          point 
        );
      });
      
      const bbox = [
        ...swPoint.coordinates,
        ...nePoint.coordinates
      ];

      const requestData = {
        "proyecto": this._projectService.project.nombre,
        "proyeccion": this._projectService.project.proyeccion,
        "bbox": bbox,
        "filtros": "",
        "graficas": charts.map(chart => { 
          return {
            "numero": chart.configuration.position,
            "tipo": chart.configuration.chartType,
            "informacion": chart.configuration.info,
            "analisis": chart.configuration.analysisMode
          }
        })
      }

      const chartsData = (await this._projectsService.getAnalisysChartsData(requestData)).datos.datos_graficas;

      const updateChartClosure = (chart:GraficoComponent|IndicadorLinealComponent, chartsData:Array<any>) => {
        
          const newData = chartsData.find(chartData => chartData.numero === chart.configuration.position).datos;

          const configuration = this.chartsData.find(chartData => chartData.configuration.position === chart.configuration.position)
          
          if( configuration )
            configuration.parameters = newData; 

          chart instanceof IndicadorLinealComponent ? chart.updateSerie(newData.texto) : chart.updateSeries(newData.series);    

          if( chart instanceof GraficoComponent ) 
            chart.chartRef.hideLoading();
      }

      charts.forEach(chart => setTimeout(() => updateChartClosure(chart, chartsData), 0));

      setTimeout(() => {
        this.showSpinner = false;
        this._mapService.enableEvents();
        this.movingMap = false;
      }, 250);

    }

  };

  @ViewChild(VistaExportacionComponent)
  public ExportView:VistaExportacionComponent;

  constructor(
    private _changeDetectorRef:ChangeDetectorRef,
    private _mapService:MapService,
    private _projectService:ProjectService,
    private _projectsService:ProjectsService,
    private _toastrService:ToastrService,
    private _shepherdService:ShepherdService
  )
  {
    super();
  }

  get tourIsActive():boolean
  {
    return this._shepherdService.isActive;
  }

  public ngAfterViewChecked():void
  {
    this._changeDetectorRef.detectChanges();
  }

  public async show():Promise<void>
  {
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
    try
    {
      this.showSpinner = true;

      const requestData = {
          "proyecto": this._projectService.project.nombre,
          "proyeccion": this._projectService.project.proyeccion,
          "bbox": [0,0,0,0],
          "filtros": "",
          "graficas": analisisConfiguration.configurations.map(config => { 
            return {
              "numero": config.position,
              "tipo": config.chartType,
              "informacion": config.info,
              "analisis": config.analysisMode
            }
          })
      };

      const chartsData = (await this._projectsService.getAnalisysChartsData(requestData)).datos.datos_graficas;

      for(let configuration of analisisConfiguration.configurations)
      {
        this.chartsData.push({
          configuration: configuration,
          parameters: chartsData.find(chartData => chartData.numero === configuration.position).datos
        });
      }

      await delayExecution(500);

      this.isActive = true;

      await this.renderCharts();
  
    }
    catch (error)
    {
      console.error(error);
      this._toastrService.error(error.message,"Error"); 
      await this.hide();
    }
    finally
    {
      this.showSpinner = false;
    }
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
    if( this.tourIsActive )
      return;

    await this.ExportView.exportModeSelectionModal.show();
  }

  public async hide():Promise<void>
  {
    if( this.chartsContainers.length )
      await this.hideEnabledCharts();

    this.map.off("moveend", this.updateChartsPerMapDisplayed);

    this._shepherdService.tourObject = null;

    await super.hide();
  }

  public desactivate():void
  {
    this.chartsData = [];
    this.isActive = false;
  }

  
  /* TOUR */

  public showTour():void
  {
    if( this.tourIsActive )
      return;

    this.buildTour();

    this._shepherdService.start();
  }

  private buildTour():void
  {
    const that = this;    
  
    const steps = this.buildTourSteps();

    const buttons = [
      {
        classes: 'btn-info',
        text: 'Expandir recurso',
        action(){
          const mediaResources = document.querySelectorAll(".step-media");
          toggleFullscreen(mediaResources[mediaResources.length - 1]);
        }
      },
      {
        classes: 'btn-secondary',
        text: 'Atras',
        action(){
            that._shepherdService.back();
        }
      },
      {
        classes: 'btn-info',
        text: 'Siguiente',
        action(){
            that._shepherdService.next();
        }
      }
    ];
    
    const _steps = [];

    for( let i = 0, stepsLength = steps.length; i < stepsLength; i++ )
    {
      let _buttons = [...buttons]; 
      
      const step = steps[i];

      if( i === 0 )
      {
        _buttons.splice(1,1);
      }
      else
      {
        if( ! step.hasMedia  )
          _buttons = _buttons.slice(1);  
      }
      
      if( i === (stepsLength - 1)  )
      {
        const lastBtnIndex = _buttons.length - 1;
        _buttons[lastBtnIndex] = {..._buttons[lastBtnIndex]}; // El ultimo boton (mas a la derecha) siempre sera el de avanzar / finalizar.
        _buttons[lastBtnIndex].text = 'Finalizar';
        _buttons[lastBtnIndex].action = () => that._shepherdService.complete();
      }
      
      const _step = {
        id: step.element,
        attachTo: { 
          element: `${step.selectorPrefix ?? "#"}${step.element}`, 
          on: step.labelPosition
        },
        buttons: _buttons,
        title: `PASO ${i + 1}`,
        text: step.content,
        when: step.event ?? null,
        beforeShowPromise: step.beforeShowPromise ?? null
      };

      _steps.push(_step);
    }

    this._shepherdService.addSteps(_steps);
  }

  private buildTourSteps():any[]
  {
    const isThereAnyChartInVerticalSection = this.chartsContainers.some(container => Number(container.nativeElement.getAttribute("data-position")) <= 2),
          isThereAnyChartInHorizontalSection = this.chartsContainers.some(container => Number(container.nativeElement.getAttribute("data-position")) > 3 ),
          isThereAChartInMiddleSection = this.chartsContainers.some(container => Number(container.nativeElement.getAttribute("data-position")) === 3 );

    let labelPositionOfChartStep;

    switch(true)
    {
      case isThereAnyChartInVerticalSection:
        labelPositionOfChartStep = "right-end";
        break;
      case isThereAnyChartInHorizontalSection:
      case isThereAChartInMiddleSection:
        labelPositionOfChartStep = "top";
        break;
    }

    const steps = [
      {
        element: `chart-container`,
        selectorPrefix: ".",
        labelPosition: labelPositionOfChartStep,
        hasMedia: true,
        content: `
        <ul>
          <li class="mb-1">
            Para mostrar un gráfico en <b>pantalla completa</b>
            o <b>exportarlo</b> (PNG, SVG, PDF y XLS) hacer click en <i class="fas fa-bars mx-1"></i>
            y seleccionar la opción. 
          </li>
          <li class="mb-1">
            Para ver la información de una serie de gráfico posicione el cursor encima de ésta.
          </li>
          <li class="mb-1">
            Puede mostrar y ocultar series desde la leyenda. 
          </li>
        </ul>
        <div style="display: none">Error al cargar video.</div>
        <video onerror="this.classList.add('hide'); this.previousElementSibling.style.display = 'block';" 
              class="step-media" loop autoplay muted>
          <source src="assets/images/medium/tours/herramientas/graficos-de-analisis/1-visualizacion-grafico.mp4" type="video/mp4">
          Tu navegador no soporta videos.
        </video>
        `
      },
      {
        element: `mapToolbar`,
        labelPosition: "bottom",
        content: `
        Al abrir otra herramienta los gráficos se ocultarán y quedarán en espera. 
        Una vez que cierre la herramienta se mostrará nuevamente el análisis. 
        `
      },
      {
        element: `export-analysis-charts-btn`,
        labelPosition: "bottom",
        content: `
          Para exportar el análisis del mapa en PDF hacer click en <img class="small-icon d-inline ml-1" src="assets/icons/SVG/IMPRIMIR.svg">.
          <br><br>
          Se abrirá una ventana con 2 opciones de exportación:
          <br><br>
          <ul>
            <li class="mb-1"><b>Completo</b>: imagenes de gráficas con tablas que contienen sus datos.</li>
            <li><b>Solo gráficos</b>: solo imagenes de gráficas.</li>
          </ul>
        `
      },
      {
        element: `analysis-charts-tool-btn`,
        labelPosition: "bottom",
        content: `
          Para cerrar el análisis hacer click en <img class="mx-1 small-icon d-inline" src="assets/icons/SVG/GRAFICA.svg">.
        `
      },
    ];
 
    return steps;
  }
}
