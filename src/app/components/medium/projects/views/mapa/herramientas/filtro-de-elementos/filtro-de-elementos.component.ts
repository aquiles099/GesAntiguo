import { Component, Input, OnInit, OnDestroy, Output, EventEmitter, ViewChild } from '@angular/core';
import { Map } from 'leaflet';
import { HideableSectionComponent } from '../../../../../../shared/hideable-section/hideable-section.component';
import { ToastrService } from 'ngx-toastr';
import { delayExecution } from 'src/app/shared/helpers';
import { Subscription } from 'rxjs';
import { SpinnerService } from '../../../../../../../services/spinner.service';
import { ProjectLayersService } from '../../../../../../../services/medium/project-layers.service';
import { ProjectService } from '../../../../../../../services/unic/project.service';
import { Capa } from '../../../../../../../interfaces/medium/mapa/Modulo';
import { isNumeric, isset, toggleFullscreen } from '../../../../../../../shared/helpers';
import Swal from 'sweetalert2';
import { ShepherdService } from 'angular-shepherd';
import { ApiService } from '../../../../../../../services/api.service';

@Component({
  selector: 'herramienta-filtro-de-elementos',
  templateUrl: './filtro-de-elementos.component.html',
  styleUrls: ['./filtro-de-elementos.component.css','../../../../../../../../themes/styles/map-tool-bar.scss']
})
export class FiltroDeElementosComponent extends HideableSectionComponent implements OnInit, OnDestroy {

  @Input()
  public map:Map;

  @Output()
  public toggleSectionVisibility:EventEmitter<void> = new EventEmitter;

  public apiData:any;

  public isThereAnyLayerWithActiveFilter:boolean = false;
  public projectLayersSubscription:Subscription;

  private selectedLayer:Capa;

  public formData:any = {
    module:null,
    group:null,
    layer:null,
    property:null
  };

  private selectedPropertyData:any;

  public properties:Array<any> = [];
  public propertyValues:Array<string|number> = [];

  public search:string = null;

  public selectedLayerFilter:{[atributo:string]:Array<string|number>};

  public showSpinner:boolean = false;

  constructor(
    private _projectService:ProjectService,
    private _projectLayersService: ProjectLayersService,
    private _toastrService:ToastrService,
    private _spinnerService:SpinnerService,
    private _shepherdService:ShepherdService,
    private _apiService:ApiService
  )
  {
    super();
  }

  get tourIsActive():boolean
  {
    return this._shepherdService.isActive;
  }
  
  get thereIsOnlyOneModule():boolean
  {
    return this._projectLayersService.modulesNumber === 1;
  }
 
  public ngOnInit():void
  {
    this.projectLayersSubscription = this._projectLayersService.capasProyectada$.subscribe(capas => {
      this.isThereAnyLayerWithActiveFilter = capas.some(capa => Object.keys(capa.obtenerFiltro()).length > 0);
    });
  }

  public async show():Promise<void>
  {
    await super.show();
    this.getFilterData();
  }

  private async getFilterData():Promise<void>
  {
    try
    {
      this.showSpinner = true;

      this.apiData = ( await this._apiService.postWithAuthentication({
        funcion: "informacion_filtrado",
        proyecto: this._projectService.project.bd_proyecto,
        capas: this._projectLayersService.obtenerFiltrosDeCapas()
      })).datos;

    }
    catch (error)
    {
      console.error(error);
      this.hide();
      this._toastrService.error(error.message,"Error");
    }
    finally
    {
      this.showSpinner = false;
    }
  }

  public onChangeModuleOrGroupSelector():void
  {
    this.selectedLayer = null;
  }

  public onChangeLayerSelector(layer?:Capa):void
  {
    if( layer )
    {
      this.selectedLayer = layer;
      this.properties = this.apiData[layer.filtro_capa].atributos;
      this.selectedLayerFilter = layer.obtenerFiltro();
      if(this.properties.length < 1){
        Swal.fire({
          icon: "info",
          title: "Error",
          text: "Debe configurar algún atributo para esta herramienta.",
          confirmButtonText: "OK",
          heightAuto: false
        });
      }
    }
    else
    {
      this.selectedLayer = null;
      this.properties = [];
      this.selectedLayerFilter = null;
    }

    this.search = null;
    this.formData.property = null;
    this.selectedPropertyData = null;
    this.propertyValues = [];
  }

  public onChangePropertySelector():void
  {
    this.selectedPropertyData = this.properties.find(property => property.nombre === this.formData.property);

    this.propertyValues = this.apiData[this.selectedLayer.filtro_capa]
                              .valores[this.selectedPropertyData.nombre_formateado]
                              .filter(value => isset(value));

    this.search = null;
  }

  public selectedLayerHasFilterOnProperty():boolean
  {
    return this.selectedLayerFilter && Object.keys(this.selectedLayerFilter).length &&
    this.selectedLayerFilter[this.selectedPropertyData.nombre_formateado] ?
    this.selectedLayerFilter[this.selectedPropertyData.nombre_formateado].length > 0 :
    false;
  }

  public async updateFilter(value:string|number):Promise<void>
  {
    if( this.selectedLayerFilter[this.selectedPropertyData.nombre_formateado] )
    {
      this.selectedLayerFilter[this.selectedPropertyData.nombre_formateado] = this.valueExistsOnFilter(value) ?
      this.selectedLayerFilter[this.selectedPropertyData.nombre_formateado].filter(_value => _value !== value) :
      [...this.selectedLayerFilter[this.selectedPropertyData.nombre_formateado], value];
    }
    else
    {
      this.selectedLayerFilter[this.selectedPropertyData.nombre_formateado] = [value];
    }

    this.updateCqlFilterInSelectedLayer();
  }

  public valueExistsOnFilter(value:string|number):boolean
  {
    return this.selectedLayerFilter[this.selectedPropertyData.nombre_formateado] ?
    this.selectedLayerFilter[this.selectedPropertyData.nombre_formateado].includes(value) :
    false;
  }

  private updateCqlFilterInSelectedLayer():void
  {
    let cqlFilter = "";

    if( ! this.selectedLayerFilter[this.selectedPropertyData.nombre_formateado].length )
      delete this.selectedLayerFilter[this.selectedPropertyData.nombre_formateado];

    for( let [property, values] of Object.entries(this.selectedLayerFilter))
    {
      if( cqlFilter.charAt(cqlFilter.length - 1) === ")" )
        cqlFilter += " AND ";

      values = values.map(value =>  isNumeric(value) ? value : `'${value}'`);

      cqlFilter += `"${property}" IN (${values.join(", ")})`;
    }

    isset(cqlFilter) ?
    this.selectedLayer.capaWms.wmsParams.cql_filter = cqlFilter :
    delete this.selectedLayer.capaWms.wmsParams.cql_filter;

    this.selectedLayer.refrescar();

    this._projectLayersService.notificarCambioEnObservador();
  }

  public async removeFilterOnProperty():Promise<void>
  {
    this.selectedLayerFilter[this.selectedPropertyData.nombre_formateado] = [];
    this.updateCqlFilterInSelectedLayer();
  }

  public async removeFilterOnAllLayers():Promise<void>
  {
    try
    {
      this._spinnerService.updateText("Eliminando filtros...");
      this._spinnerService.show();

      await delayExecution(250);

      this._projectLayersService
          .obtenerCapas({modulo: null, grupo: null, proyectado: true})
          .forEach(capa => {
            delete capa.capaWms.wmsParams.cql_filter;
            capa.refrescar();
          });

      this.selectedLayerFilter = {};

      this._projectLayersService.notificarCambioEnObservador();

      this._toastrService.success("Filtros eliminados.","Exito!");

    } catch (error)
    {
      console.error(error);
      this._toastrService.error(error.message, "Error");
    }
    finally
    {
      this._spinnerService.hide();
      this._spinnerService.cleanText();
    }
  }

  public toggleSectionVisibilityEvent():void
  {
    this.toggleSectionVisibility.emit();
  }

  public async hide():Promise<void>
  {
    this.apiData = null;

    this.selectedLayer = null;
    this.properties = [];
    this.propertyValues = [];

    this.search = null;
    this.showSpinner = false;

    this.selectedPropertyData = null;
    this.selectedLayerFilter = null;

    this._shepherdService.tourObject = null;

    await super.hide();
  }

  public ngOnDestroy():void
  {
    this.projectLayersSubscription.unsubscribe();
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
        text: 'Expandir recursos',
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
       _buttons = _buttons.slice(2);
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
       text: step.content
     };

     _steps.push(_step);
    }

    this._shepherdService.addSteps(_steps);
  }

  private buildTourSteps():any[]
  {
    const steps = [
      {
        element: `layer-selector`,
        labelPosition: "left",
        content: 'Seleccionar <b>capa</b>.',
        selectorPrefix: "."
      },
      {
        element: `filter-elements-attribute-selector`,
        labelPosition: "left",
        content: `
        Seleccionar <b>atributo</b>.
        <br>
        Si la capa no tiene atributos habilitados o elementos se mostrará un mensaje informativo. 
        `
      },
      {
        element: `filter-elements-attribute-values-list`,
        labelPosition: "top",
        hasMedia: true,
        content: `
        Se listarán los posibles valores para el atributo seleccionado, por los cuales, se podrán filtrar los elementos de la capa.
        <br>
        Para aplicar o remover un filtro por valor marcar o desmarcar la casilla correspondiente y 
        se podrá ver el cambio en la capa a los segundos. 
        <br><br>
        <div style="display: none">Error al cargar video.</div>
        <video onerror="this.classList.add('hide'); this.previousElementSibling.style.display = 'block';" 
              class="step-media" loop autoplay muted>
          <source src="assets/images/medium/tours/herramientas/filtrado/5-filtrar-por-valor.mp4" type="video/mp4">
          Tu navegador no soporta videos.
        </video> 
        `
      },
      {
        element: `filter-elements-attributes-finder`,
        labelPosition: "left",
        content: `
        Utilice el buscador para filtrar los atributos.
        `
      },
      {
        element: `filter-elements-attribute-selector`,
        labelPosition: "left",
        hasMedia: true,
        content: `
        Puede aplicar filtros en varios atributos a la vez.
        <br><br>
        <div style="display: none">Error al cargar video.</div>
        <video onerror="this.classList.add('hide'); this.previousElementSibling.style.display = 'block';" 
              class="step-media" loop autoplay muted>
          <source src="assets/images/medium/tours/herramientas/filtrado/6-filtrar-en-varios-atributos.mp4" type="video/mp4">
          Tu navegador no soporta videos.
        </video> 
        `
      },
      {
        element: `filter-elements-remove-layer-filter-btn`,
        labelPosition: "top",
        content: `
        Para eliminar los filtros de valores del <b>atributo seleccionado</b> hacer click en <span class="badge-outline-info">Eliminar filtro capa</span>.
        `
      },
      {
        element: `filter-elements-remove-all-filters-btn`,
        labelPosition: "top",
        content: `
        Para <b>eliminar</b> todos los filtros de atributos en <b>todas las capas del proyecto</b> hacer click en <span class="badge-outline-info">Eliminar todo</span>.
        `
      }
    ];

    if( this._projectLayersService.thereIsMoreThanOneModule )
    {
      steps.unshift(
        {
          element: `module-selector`,
          labelPosition: "left",
          content: 'Seleccionar <b>modulo</b>. Si el proyecto tiene un solo módulo este será seleccionado automaticamente.'
        },
        {
          element: `group-selector`,
          labelPosition: "left",
          content: 'Seleccionar <b>grupo</b>.'
        }  
      );
    }

    return steps;
  }
}
