import { Component, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { Map, Marker, Polyline} from 'leaflet';
import { HideableSectionComponent } from '../../../../../../shared/hideable-section/hideable-section.component';
import { ToastrService } from 'ngx-toastr';
import { ProjectService } from '../../../../../../../services/unic/project.service';
import { SpinnerService } from '../../../../../../../services/spinner.service';
import { ProjectsService } from '../../../../../../../services/unic/projects.service';
import { Project } from '../../../../../../../interfaces/project';
import { GeoJSONHelper } from '../../../../../../../models/geojson-helper';
import { Capa } from '../../../../../../../interfaces/medium/mapa/Modulo';
import { SeccionProteccionesGeneralesComponent } from './seccion-protecciones-generales/seccion-protecciones-generales.component';
import { SeccionCajaDeProteccionComponent } from './seccion-caja-de-proteccion/seccion-caja-de-proteccion.component';
import { SeccionPuestaATierraComponent } from './seccion-puesta-a-tierra/seccion-puesta-a-tierra.component';
import { SeccionProteccionesManiobraComponent } from './seccion-protecciones-maniobra/seccion-protecciones-maniobra.component';
import { SeccionCircuitosComponent } from './seccion-circuitos/seccion-circuitos.component';
import { GestionCircuitoComponent } from './gestion-circuito/gestion-circuito.component';
import { delayExecution } from 'src/app/shared/helpers';
import { ObjectUtility } from '../../../../../../../shared/object-utility';
import { Circuito } from '../../../../../../../interfaces/medium/centro-mando';
import { SeccionInformacionPrincipalComponent } from './seccion-informacion-principal/seccion-informacion-principal.component';
import { SeccionOtrosComponent } from './seccion-otros/seccion-otros.component';
import { SeccionElementosManiobraComponent } from './seccion-elementos-maniobra/seccion-elementos-maniobra.component';
import { ShepherdService } from 'angular-shepherd';
export interface AttributeData 
{
  campo: string;
  dominio: boolean;
  dominios?: Array<string|number>;
  nombre: string;
  tipo: string;
  valor_defecto: any;
}
interface DropdownSection 
{
  key:string;
  name:string;
  collapsed:boolean;
  loadedData:boolean;
  attributes:AttributeData[];
}
export interface DatosHerramientaGestionCentroDeMando
{
  layer:Capa;
  element:Marker;
  action:"new"|"update"|"details";
}
@Component({
  selector: 'herramienta-gestion-centro-de-mando',
  templateUrl: './gestion-centro-de-mando.component.html',
  styleUrls: ['./gestion-centro-de-mando.component.css','../../../../../../../../themes/styles/map-tool-bar.scss']
})
export class GestionCentroDeMandoComponent extends HideableSectionComponent
{
  @Input()
  public map:Map;

  public showSpinner:boolean = false;

  private data:DatosHerramientaGestionCentroDeMando;

  public sections:Array<DropdownSection> = [];

  public templates:{[key:string]: any } = {};
  public attributes:AttributeData[] = [];

  @Output()
  public whenClosing:EventEmitter<{layer:Capa; mode:string;}> = new EventEmitter;

  // secciones.
  @ViewChild(SeccionInformacionPrincipalComponent)
  public SeccionInformacionPrincipal:SeccionInformacionPrincipalComponent;

  @ViewChild(SeccionCircuitosComponent)
  public SeccionCircuitos:SeccionCircuitosComponent;

  @ViewChild(SeccionProteccionesGeneralesComponent)
  public SeccionProteccionesGenerales:SeccionProteccionesGeneralesComponent;

  @ViewChild(SeccionProteccionesManiobraComponent)
  public SeccionProteccionesManiobra:SeccionProteccionesManiobraComponent;

  @ViewChild(SeccionElementosManiobraComponent)
  public SeccionElementosManiobra:SeccionElementosManiobraComponent;

  @ViewChild(SeccionCajaDeProteccionComponent)
  public SeccionCajaDeProteccion:SeccionCajaDeProteccionComponent;

  @ViewChild(SeccionPuestaATierraComponent)
  public SeccionPuestaATierra:SeccionPuestaATierraComponent;

  @ViewChild(SeccionOtrosComponent)
  public SeccionOtros:SeccionOtrosComponent;

  /* GESTION DE CIRCUITO (NUEVO - EDITAR - VER) */

  @ViewChild(GestionCircuitoComponent)
  public GestionCircuito:GestionCircuitoComponent;

  public managingCircuit:boolean = false;

  constructor(
    private _toastrService:ToastrService,
    private _projectService:ProjectService,
    private _projectsService:ProjectsService,
    private _spinnerService:SpinnerService,
    private _shepherdService:ShepherdService
  )
  {
    super();
  }

  get title():string
  {
    const titles = {
      "new": "Nuevo Centro de mando",
      "update": "Edicíon Centro de mando",
      "details": "Informacíon Centro de mando"
    };

    return titles[this.data.action];
  }

  get mode():"new"|"update"|"details"
  {
    return this.isVisible ? this.data.action : null;
  }
  
  get layer():Capa
  {
    return this.isVisible ? this.data.layer : null;
  }

  get project():Project
  {
    return this._projectService.project;
  }

  get commandCenterId():string
  {
    return this.data.element.feature ? this.data.element.feature.properties.id : "";
  }
 
  get tourIsActive():boolean
  {
    return this._shepherdService.isActive;
  }

  public async setDataAndShow(data:DatosHerramientaGestionCentroDeMando):Promise<void>
  {
    try
    {
      this.showSpinner = true;

      this.data = data; 
      
      await super.show();

      this.centerMapInVisibleSpace();

      await this.getComandCenterData();      
    }
    catch (error)
    {      
      throw error;
    }
    finally
    {
      this.showSpinner = false;
    }
  }

  private centerMapInVisibleSpace():void
  {
    const elementPointInContainer = this.map.latLngToContainerPoint( this.data.element.getLatLng() );

    const mapContainerBounds = this.map.getContainer().getBoundingClientRect();

    const p1 = this.map.containerPointToLatLng([elementPointInContainer.x , elementPointInContainer.y]),
          p2 = this.map.containerPointToLatLng([mapContainerBounds.right, elementPointInContainer.y]);
  
    const center = new Polyline([p1, p2]).getBounds().getCenter(); 

    this.map.flyTo(center);
  }

  public async getComandCenterData():Promise<void>
  {
    const layerFilter = this.data.layer.filtro_capa.split("#");

    const markerGeometry =  this.data.element.toGeoJSON().geometry;

    GeoJSONHelper.reproyectGeometry(
      null,
      this._projectService.configuration.datos_municipio.nombre_proj4,
      markerGeometry
    );

    const markerGeometryInString = GeoJSONHelper.geometryToString(markerGeometry);
    
    const apiData = (await this._projectsService.consultarApi({
      "funcion": "web_informacion_centro_mando",
      "proyecto": this.project.bd_proyecto,
      "modulo": layerFilter[0],
      "grupo": layerFilter[1],
      "centro_mando": this.data.element.feature ? this.data.element.feature.properties.id : "",
      "geometria": `ST_GEOMFROMTEXT('${markerGeometryInString}',${this._projectService.project.proyeccion})`,
      "proyeccion": this.project.proyeccion,
    })).datos;

    this.templates = apiData.valores;
    this.attributes = apiData.atributos;

    this.addExternalAttributes(apiData.opciones);

    this.buildSections();

    this.formatTemplates();
  }

  private formatTemplates():void
  {
    const dateAttributes = this.attributes.filter(attrData => attrData.tipo === "Fecha Completa" || attrData.tipo === "Hora");

    if( this.mode === "new" )
    {
      const today = new Date();

      today.setHours(0);
      today.setMinutes(0);
    
      // a;adir fecha actual como valor por defecto para atributos de tipo fecha (Fecha completa y hora).
      dateAttributes.forEach(attrData => attrData.valor_defecto = today);
  
      for( let template of Object.values( this.templates ) )
      {
        for( let attributeData of this.attributes )
        {
          template.hasOwnProperty( attributeData.campo ) ?
          template[attributeData.campo] = attributeData.valor_defecto :
          delete template[attributeData.campo];        
        }
      }
    }
    else
    {
      for( let template of Object.values( this.templates ) )
      {
        // formatear campos de fecha (Fecha completa y hora) de cadenas a instancias de clase Date.
        // (datepicker y timepicker utilizados en formularios solo leen instancias de Date).
        for( let attributeData of dateAttributes )
        {
          if( template.hasOwnProperty( attributeData.campo ) )
          {
            if( attributeData.tipo === "Fecha Completa" )
            {
              template[attributeData.campo] = new Date(template[attributeData.campo]);
            }
            else
            {
              if( template[attributeData.campo] )
              {
                const date = new Date();
                const time = template[attributeData.campo].split(":"); 
                date.setHours(time[0]);
                date.setMinutes(time[1]);
                template[attributeData.campo] = date;
              }
            }
          }
        }
      }
    }
  }

  private addExternalAttributes(data:{[key:string]:any[]}):void
  {
    for( let [field, values] of Object.entries( data ) )
    {
      const attrData = this.attributes.find(attr => attr.campo === field);
      attrData.dominio = true;
      attrData.dominios = values.map(item => field === "cm_padre" ? item.id_centro_mando : item);
    }
  }

  private buildSections():void
  {
    const SECTIONS = [
      {key:"centro_mando",            name: "Información principal"},
      {key:"circuitos",               name: "Circuitos"},
      {key:"protecciones_generales",  name: "Protecciones generales"},
      {key:"protecciones_maniobra",   name: "Protecciones maniobra"},
      {key:"elementos_maniobra",      name: "Elementos maniobra"},
      {key:"caja_proteccion",         name: "Caja de protección"},
      {key:"puesta_tierra",           name: "Puesta a tierra"},
      {key:"otros",                   name: "Otros"},
    ];

    SECTIONS.forEach(section => {

      if( ! this.templates[section.key] )
      {
        (this.templates[section.key] as any) = 
        section.key.includes("protecciones") || section.key === 'circuitos' ? [] : {};
      }
      
      this.sections.push({
        key: section.key,
        name: section.name,
        collapsed: true,
        loadedData: section.key === "centro_mando" || section.key === "elementos_maniobra" || section.key === "otros" ? true : false,
        attributes: this.appendAttributesInSections(section.key)
      });

    });
  }

  private appendAttributesInSections(sectionKey:string):AttributeData[]
  {
    const attributes = [];

    if( this.templates[sectionKey] )
    {
      for( let[key, value] of Object.entries( this.templates[sectionKey] ) )
      {
        const attributeData = this.attributes.find(data => data.campo === key);
  
        if( attributeData )
          attributes.push(attributeData);
      }
    }

    return attributes;
  }

  public openSectionAndCollapseTheOthers(section:DropdownSection):void
  {      
    if( this.tourIsActive )
      return;

    if( section.collapsed )
    {
      this.sections
        .filter(_section => _section.key !== section.key)
        .forEach(_section => _section.collapsed  = true);
    }

    section.collapsed = ! section.collapsed;
  }

  public async onExpandsSection(section:DropdownSection):Promise<void>
  {    
    const sections = {
      "centro_mando":           this.SeccionInformacionPrincipal,
      "circuitos":              this.SeccionCircuitos,
      "protecciones_generales": this.SeccionProteccionesGenerales,
      "protecciones_maniobra":  this.SeccionProteccionesManiobra,
      "elementos_maniobra":     this.SeccionElementosManiobra,
      "caja_proteccion":        this.SeccionCajaDeProteccion,
      "puesta_tierra":          this.SeccionPuestaATierra,
      "otros":                  this.SeccionOtros
    };

    if( sections[section.key] ) // AL volver de seccion de gestion de circuito, las secciones no existen al instante 
    {                           // mientras efecto de fadeIn aun no ha terminado. 
      if( sections[section.key].loadData && ! section.loadedData )
      {
        try
        {
          this.showSpinner = true;
  
          await sections[section.key].loadData();
          
          if( ! section.loadedData )
            section.loadedData = true;
        }
        catch(error)
        {
          this._toastrService.error(error.message,"Error.");
        }
        finally
        {
          this.showSpinner = false;
        }
      }
      else
      {
        if( sections[section.key].form ) 
          sections[section.key].handleForm();
      }
    }
  }

  /* GESTION CIRCUITO */

  public async showCircuitManagementSection(circuit:Circuito):Promise<void>
  {
    try
    {
      this.showSpinner = true;

      this.managingCircuit = true;

      await delayExecution(1000); // esperar a que se muestre vista de gestion de circuito (efecto fadeIn). 

      this.GestionCircuito.template = circuit;

      await this.GestionCircuito.show();
    }
    catch(error)
    {
      console.error(error);
      this._toastrService.error(error.message,"Error.");
      this.hideCircuitManagementSection();
    }
    finally
    {
      this.showSpinner = false;
    }
  }

  public hideCircuitManagementSection():void
  {
    this.managingCircuit = false;
    this.sections.find(section => section.key === "circuitos").collapsed = false;
  }
  
  /*  */

  public showLoading():void
  {
    this.showSpinner = true;
  }

  public hideLoading():void
  {
    this.showSpinner = false;
  }

  public async finishManagement():Promise<void>
  {
    let cmData = ObjectUtility.complexCloning(this.templates);

    try
    {
      this._spinnerService.updateText(
        this.commandCenterId ? "Actualizando centro de mando..." : "Creando centro de mando..."
      );
      this._spinnerService.show();

      this.showSpinner = true;

      // enviar solo ids de circuitos creados en solicitud de creacion de CM.
      this.templates["circuitos"] = this.templates["circuitos"]
                                        .filter((circuit:Circuito) => ! circuit.centro_mando)
                                        .map((circuit:Circuito) => circuit.id_circuito);

      // Api de creacion debe recibir proteccion en una solo arreglo.
      // (protecciones generales y de maniobra juntas).

      const protections = [
        ...this.templates['protecciones_generales'], 
        ...this.templates['protecciones_maniobra']
      ];
    
      // remover atributo "sensibilidad_personalizada_habilitada" en protecciones de CM.
      // (atributo usado para habilitar campo de sensibilidad personalizada ).
      protections.forEach(protection => {

        if( protection.hasOwnProperty("sensibilidad_personalizada_habilitada") )
          delete protection["sensibilidad_personalizada_habilitada"];

      });

      delete this.templates["protecciones_generales"];
      delete this.templates["protecciones_maniobra"];
      this.templates["protecciones"] = protections;

      const feature = this.data.element.toGeoJSON();

      GeoJSONHelper.reproyectGeometry(undefined, this._projectService.configuration.datos_municipio.nombre_proj4, feature.geometry);

      const featureGeometryToString = GeoJSONHelper.geometryToString(feature.geometry);

      const requestData = {
        "funcion": "web_crear_centro_mando",
        "proyecto": this._projectService.project.nombre,
        "modulo": this.layer.modulo,
        "grupo": this.layer.grupo,
        "geometria": `ST_GEOMFROMTEXT('${featureGeometryToString}',${this._projectService.project.proyeccion})`
      };
      
      Object.assign(requestData, this.templates);

      await this._projectsService.consultarApi(requestData);

      this._toastrService.success(
        this.commandCenterId ? "Centro de mando actualizado." : "Centro de mando creado.",
        "Exito!"
      );

      this.data.layer.refrescar();

      await this.hideAndShowElementCreationTool();
    }
    catch (error)
    {
      console.error(error);
      this._toastrService.error(error.message, "Error");
      Object.assign(this.templates, cmData);
    }
    finally
    {
      this._spinnerService.hide();
      this._spinnerService.cleanText();

      this.showSpinner = false;
    }
  }

  public async hideAndShowElementCreationTool(removeCircuits:boolean = false):Promise<void>
  {
    try
    {
      if( removeCircuits)
        await this.removeCircuitsWithoutCommandCenter();
    }
    catch (error)
    {
      console.error(error);
      this._toastrService.error(error.message, "Error");
    }
    finally
    {
      const data = {
        layer: this.layer,
        mode:  this.mode
      };

      this.clear();
      await super.hide();
      this.whenClosing.emit(data);
    }
  }

  public async hide():Promise<void>
  {
    await this.removeCircuitsWithoutCommandCenter();
    this.clear();
    this._shepherdService.tourObject = null;
    await super.hide();
  }

  private async removeCircuitsWithoutCommandCenter():Promise<void>
  {
    try
    {
      const circuitIdsWithoutCm = this.templates["circuitos"]
                                    .filter((circuit:Circuito) => ! circuit.centro_mando)
                                    .map((circuit:Circuito) => circuit.id_circuito);

      if( circuitIdsWithoutCm.length)
      {
        this._spinnerService.updateText("Removiendo circuitos...");
        this._spinnerService.show();


        await this._projectsService.consultarApi({
          "funcion": "web_eliminar_circuitos",
          "proyecto": this.project.nombre,
          "modulo": this.layer.modulo,
          "grupo": this.layer.grupo,
          "id_circuitos": circuitIdsWithoutCm
        });
      }
    }
    catch (error)
    {
      throw error;
    }
    finally
    {
      this._spinnerService.hide();
      this._spinnerService.cleanText();
    }
  }

  private clear():void
  {
    this.data.element.remove();
    this.data = null;

    this.sections = [];
    this.templates = {};
    this.attributes = [];

    this.showSpinner = false;
    this.managingCircuit = false;
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
        _buttons = _buttons.slice(2);
      
      if( i === (stepsLength - 1)  )
      {
        const lastBtnIndex = _buttons.length - 1;
        _buttons[lastBtnIndex] = {..._buttons[lastBtnIndex]}; // El ultimo boton (más a la derecha) siempre sera el de avanzar / finalizar.
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
        beforeShowPromise: step.beforeShowPromise ?? null,
        when: step.event
      };

      _steps.push(_step);
    }

    this._shepherdService.addSteps(_steps);
  }

  private buildTourSteps():any[]
  {   
    // solo puede haber una seccion desplegada.
    const openSection = this.sections.find(section => ! section.collapsed);
    const onCancelOrCompleteTourClosure = () => openSection.collapsed = false;

    const steps = [];

    steps.push(

      {
        element: `cm-sections`,
        labelPosition: "left",
        content: `
        Un centro de mando se compone de varias secciones.
        `,
        event: {
          "before-show": () => {

            if( openSection )
            {
              openSection.collapsed = true;
              this._shepherdService.tourObject.once("complete", onCancelOrCompleteTourClosure);
              this._shepherdService.tourObject.once("cancel", onCancelOrCompleteTourClosure);
            }
          }
        }
      },
      {
        element: `collapse-btn`,
        selectorPrefix: ".",
        labelPosition: "left",
        content: `
        Para <b>mostrar / ocultar</b> el contenido de una sección hacer
        click sobre su <b>título</b> o en <i class="fas fa-chevron-up"></i> / <i class="fas fa-chevron-down"></i>.
        `
      }
    );

    if( this.mode !== "details" )
    {
      steps.push(
        {
          element: `save-btn`,
          labelPosition: "top",
          content: `
          Una vez que se configuren las secciones, hacer click en 
          <span class="badge bg-info text-white">${this.commandCenterId ? "Actualizar" : "Guardar"}</span>
          para ${this.commandCenterId ? "actualizar" : "guardar"} el centro de mando.
          `
        }
      );
    }

    steps.push(
      {
        element: `cancel-btn`,
        labelPosition: "top",
        content: `
        Para volver a la herramienta previamente abierta hacer click en 
        ${this.mode !== "details" ? `<span class="badge-outline-info">Cancelar</span>` : 
        `<span class="badge bg-info text-white">Aceptar</span>`}.
        `
      }
    );

    return steps;
  }

  public showSectionTour(section:DropdownSection):void
  {
    const sections = {
      "centro_mando":           this.SeccionInformacionPrincipal,
      "circuitos":              this.SeccionCircuitos,
      "protecciones_generales": this.SeccionProteccionesGenerales,
      "protecciones_maniobra":  this.SeccionProteccionesManiobra,
      "elementos_maniobra":     this.SeccionElementosManiobra,
      "caja_proteccion":        this.SeccionCajaDeProteccion,
      "puesta_tierra":          this.SeccionPuestaATierra,
      "otros":                  this.SeccionOtros
    };

    sections[section.key].showTour();
  }
}
