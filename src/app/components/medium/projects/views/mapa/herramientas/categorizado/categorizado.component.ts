import { Component, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { HideableSectionComponent } from '../../../../../../../components/shared/hideable-section/hideable-section.component';
import { ProjectLayersService } from '../../../../../../../services/medium/project-layers.service';
import { ProjectService } from '../../../../../../../services/unic/project.service';
import { ShepherdService } from 'angular-shepherd';
import { Project } from '../../../../../../../interfaces/project';
import { Capa } from '../../../../../../../interfaces/medium/mapa/Modulo';
import { toggleFullscreen, isset } from '../../../../../../../shared/helpers';
import { ToastrService } from 'ngx-toastr';
import { TileLayer } from 'leaflet';
import { ModalCreacionDeCategoriasComponent } from './modal-creacion-de-categorias/modal-creacion-de-categorias.component';
import { SpinnerService } from '../../../../../../../services/spinner.service';
import { AttributeStyleCategory } from '../../../../../../../interfaces/medium/layer-styles';
import { SeccionEstilosPersonalizadosComponent } from './seccion-estilos-personalizados/seccion-estilos-personalizados.component';
import { ApiService } from '../../../../../../../services/api.service';

@Component({
  selector: 'herramienta-categorizado',
  templateUrl: './categorizado.component.html',
  styleUrls: ['./categorizado.component.css', '../../../../../../../../themes/styles/map-tool-bar.scss']
})
export class CategorizadoComponent extends HideableSectionComponent
{
  @Input() 
  public layers:(TileLayer.WMS | any)[] = [];

  @Input() 
  public defaultStyles:any;

  @Output() 
  public toggleSectionVisibility: EventEmitter<any> = new EventEmitter();

  public showSpinner: boolean = false;

  public formData:{[key:string]: string} = {
    module: null,
    group: null,
    layer: null,
    style: null
  };

  private styleLibrary:{[layerStructure:string]:{nombre:string; estilo_geoserver:string;}[]};

  public estilos:any[] = [];

  public selectedLayer:Capa;
  
  private previousLayerStyles = new Map<string, string>();

  @ViewChild(ModalCreacionDeCategoriasComponent)
  public ModalCreacionDeCategorias:ModalCreacionDeCategoriasComponent;

  @ViewChild(SeccionEstilosPersonalizadosComponent)
  public SeccionEstilosPersonalizados:SeccionEstilosPersonalizadosComponent;

  public layerAttributeCategories:{
    [layerName:string]: {[attributeName:string]: AttributeStyleCategory[]}
  } = {};

  constructor(
    private _projectLayersService: ProjectLayersService,
    private _projectService: ProjectService,
    private _apiService: ApiService,
    private _shepherdService: ShepherdService,
    private _toastrService:ToastrService,
    private _spinnerService:SpinnerService
  ) {
    super();
  }

  get tourIsActive(): boolean {
    return this._shepherdService.isActive;
  }

  get project(): Project
  {
    return this._projectService.project;
  }

  get customStylesEnabled():boolean
  {
    return this.formData.style === "custom";
  }
  
  public async show(): Promise<void>
  {
    this.layers.forEach((layer) => this.previousLayerStyles.set(layer.wmsParams.layers, layer.wmsParams.styles));
    
    await super.show();
    
    await this.getStyleLibrary();
  }

  private async getStyleLibrary():Promise<void>
  {
    try
    {
      this.showSpinner = true;
  
      const layerStructures = this._projectLayersService
                                  .obtenerCapas({
                                    modulo: null,
                                    grupo: null,
                                    proyectado: true
                                  })
                                  .map(layer => layer.filtro_capa);
  
      this.styleLibrary = (await this._apiService.postWithAuthentication({
        funcion: "informacion_estilos_web",
        proyecto: this.project.bd_proyecto,
        capas: layerStructures
      }) ).datos.estilos;

    }
    catch (error)
    {
      this._toastrService.error(error.message,"Error");
    }
    finally
    {
      this.showSpinner = false;
    }
  }

  public alCambiarSelectorDeModuloOGrupo():void
  {
    this.selectedLayer = null;
  }

  public eventoCapaSeleccionada(capa:Capa):void
  {
    if( ! this.layerAttributeCategories.hasOwnProperty(capa.nombre_formateado) )
      this.layerAttributeCategories[capa.nombre_formateado] = {};

    this.selectedLayer = capa;

    this.estilos = [
      ...this.styleLibrary[ capa.filtro_capa ],
      {
      nombre: "Personalizado",
      estilo_geoserver: "custom"
      }
    ];

    const currentLayerStyle = capa.capaWms.wmsParams.styles;

    this.formData.style = this.estilos.some(data => data.estilo_geoserver === currentLayerStyle ) ?
    currentLayerStyle : null;
  }

  public eventoEstiloSeleccionado(estilo:any):void
  {
    let url = this._projectService.project.url_base.split('wms?')[0] + "wms?";

    if( estilo.estilo_geoserver === "custom" )
    {
      const selectedLayer = this.layers.find(layer => layer === this.selectedLayer.capaWms);

      selectedLayer.setParams({ 
        styles: this.previousLayerStyles.get(selectedLayer.wmsParams.layers),
        fake: Date.now()
      });
      
      this.selectedLayer.leyenda = `${url}REQUEST=GetLegendGraphic&transparent=true&style=${this.selectedLayer.capaWms.wmsParams.styles}&SCALE=2000&VERSION=1.0.0&FORMAT=image/png&LAYER=gissmart_energy_gestlighting_centro_mando&LEGEND_OPTIONS=FontName:Raleway;fontSize:14;columnheight:199`;
    }
    else
    {
      this.selectedLayer.capaWms.setParams({ styles: estilo.estilo_geoserver });
      
      this.selectedLayer.leyenda = `${url}REQUEST=GetLegendGraphic&transparent=true&style=${estilo.estilo_geoserver}&SCALE=2000&VERSION=1.0.0&FORMAT=image/png&LAYER=gissmart_energy_gestlighting_centro_mando&LEGEND_OPTIONS=FontName:Raleway;fontSize:14;columnheight:199`;
    }
  }

  public async prepareCategoryCreationModalAndShowIt(data:{attributeName:string; category?:AttributeStyleCategory}):Promise<void>
  {
    try
    {
      this._spinnerService.show();

      const attributeData = (await this._apiService.postWithAuthentication({
        "funcion": "web_lista_atributo_dominio",
        "proyecto": this._projectService.project.nombre,
        "modulo": this.selectedLayer.modulo,
        "grupo": this.selectedLayer.grupo,
        "capa": this.selectedLayer.nombre,
        "atributos": [ data.attributeName ]
      }) ).datos[0];

      let attributeCategoriesOfSelectedLayer = this.layerAttributeCategories[this.selectedLayer.nombre_formateado][attributeData.nombre_formateado];
      
      // Para edicion de categoria, permitir que el valor de categoria a editar se liste.
      if( data.category )
        attributeCategoriesOfSelectedLayer = attributeCategoriesOfSelectedLayer.filter(category => category !== data.category);

      // Mostrar solo valores de atributo que no tengan una categoria asociada.
      // (Un valor solo tiene una categoria). 
      const attributeValues = attributeData.valores.filter(
        val => isset(val) && ! attributeCategoriesOfSelectedLayer.some(category => category.value === val)
      );

      this.ModalCreacionDeCategorias.propertyValues = attributeValues;

      this.ModalCreacionDeCategorias.layerGeometryType = this.selectedLayer.tipo_geometria;

      this.ModalCreacionDeCategorias.show( data.category );

    }
    catch(error)
    {
      this._toastrService.error(error.message,"Error");
    }
    finally
    {
      this._spinnerService.hide();
    }
  }

  public backToStyleSelectionSection():void
  {
    this.formData.style = null;
    
    delete this.selectedLayer.capaWms.wmsParams.SLD_BODY;
    
    this.selectedLayer.capaWms.setParams({ 
      styles: this.previousLayerStyles.get(this.selectedLayer.capaWms.wmsParams.layers),
      fake: Date.now()
    });
  }

  public acceptAndCloseTool(): void
  {
    this.toggleSectionVisibility.emit();
  }

  public cancelAndCloseTool():void
  {
    for (let layer of this.layers)
    {
      layer.setParams({ 
        styles: this.previousLayerStyles.get(layer.wmsParams.layers),
        fake: Date.now()
      });
    }

    this.toggleSectionVisibility.emit();
  }

  public restoreDefaultStylesAndCloseTool(): void
  {
    for (let layer of this.layers)
    {
      delete layer.wmsParams.SLD_BODY;

      for (let [key, value] of Object.entries(this.defaultStyles))
      {
        let layerStructure = key.replace(/#/g, '_');

        if (layerStructure === layer.wmsParams.layers)
          layer.setParams({ styles: value });
      }
    }

    this.toggleSectionVisibility.emit();
  }

  public async hide(): Promise<void>
  {
    this.showSpinner = false;

    this.estilos = [];

    this.styleLibrary = null;

    this.selectedLayer = null;

    this.previousLayerStyles.clear();

    // 
    this._shepherdService.tourObject = null;

    await super.hide();
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
          element: `${ step.selectorPrefix ?? "#"}${step.element}`, 
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
    const steps = [
      {
        element: `layer-selector`,
        selectorPrefix: ".",
        labelPosition: "left",
        content: 'Seleccionar <b>capa</b>.'
      },
      {
        element: `style-selector`,
        labelPosition: "left-start",
        hasMedia: true,
        content: `
        Seleccionar uno de los estilos disponibles para la capa. Si esta tiene un estilo del listado aplicado, se mostrará seleccionado.
        <br>
        Podrá ver el cambio de estilo sobre la capa en el mapa despues de seleccionar una opción.
        <br><br> 
        <div style="display: none">Error al cargar video.</div>
        <video onerror="this.classList.add('hide'); this.previousElementSibling.style.display = 'block';" 
              class="step-media" loop autoplay muted>
          <source src="assets/images/medium/tours/herramientas/categorizado/4-seleccionar-estilo.mp4" type="video/mp4">
          Tu navegador no soporta videos.
        </video>
        `
      },
      {
        element: `accept-btn`,
        labelPosition: "top",
        content: `Para aceptar los estilos seleccionados hacer click en <span class="badge bg-info text-white">Aceptar</span> o cerrar la herramienta desde la barra de botones.`
      },
      {
        element: `initial-style-btn`,
        labelPosition: "top",
        content: `Para restaurar los estilos por defecto en todas las capas del proyecto hacer click en <span class="badge bg-info text-white">Inicial</span>.`
      },
      {
        element: `previous-style-btn`,
        labelPosition: "top",
        content: `Para revertir cambios y volver a los estilos previos en las capas hacer click en <span class="badge-secondary">Cancelar</span>.`
      }
    ];

    if( this._projectLayersService.thereIsMoreThanOneModule )
    {
      steps.unshift(
        {
          element: `module-selector`,
          selectorPrefix: ".",
          labelPosition: "left",
          content: 'Seleccionar <b>modulo</b>.'
        },
        {
          element: `group-selector`,
          selectorPrefix: ".",
          labelPosition: "left",
          content: 'Seleccionar <b>grupo</b>.'
        }  
      );
    } 

    return steps;
  }

}
