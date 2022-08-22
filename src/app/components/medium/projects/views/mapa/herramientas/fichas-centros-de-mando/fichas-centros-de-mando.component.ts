import { Component, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { Map, TileLayer } from 'leaflet';
import { HideableSectionComponent } from '../../../../../../shared/hideable-section/hideable-section.component';
import { ToastrService } from 'ngx-toastr';
import { ProjectService } from '../../../../../../../services/unic/project.service';
import { SpinnerService } from '../../../../../../../services/spinner.service';
import { ProjectLayersService } from 'src/app/services/medium/project-layers.service';
import { Project } from '../../../../../../../interfaces/project';
import { GeneradorFichasCentrosDeMandoComponent } from './generador-fichas-centros-de-mando/generador-fichas-centros-de-mando.component';
import { ShepherdService } from 'angular-shepherd';
import { toggleFullscreen } from '../../../../../../../shared/helpers';
import LeafletWms from 'leaflet.wms';
import { ApiService } from '../../../../../../../services/api.service';

@Component({
  selector: 'herramienta-fichas-centros-de-mando',
  templateUrl: './fichas-centros-de-mando.component.html',
  styleUrls: ['./fichas-centros-de-mando.component.css','../../../../../../../../themes/styles/map-tool-bar.scss']
})
export class FichasCentrosDeMandoComponent extends HideableSectionComponent
{
  @Input()
  public map:Map;

  @Output()
  public toggleSectionVisibility:EventEmitter<void> = new EventEmitter;

  public commandCenters:string[] = [];
  public selectedCms:string[] = [];
  
  public commandCentersLayer:TileLayer;
  private highlightedElementsLayer:TileLayer.WMS;

  @ViewChild(GeneradorFichasCentrosDeMandoComponent)
  public GeneradorFichasCentrosDeMando:GeneradorFichasCentrosDeMandoComponent;

  constructor(
    private _toastrService:ToastrService,
    private _projectService:ProjectService,
    private _apiService:ApiService,
    private _projectLayersService:ProjectLayersService,
    private _spinnerService:SpinnerService,
    private _shepherdService:ShepherdService
  )
  {
    super();
  }

  get project():Project
  {
    return this._projectService.project;
  }

  get thereAreSelectedCms():boolean
  {
    return this.selectedCms.length > 0;
  }
 
  get allCmsAreSelected():boolean
  {
    return this.selectedCms.length === this.commandCenters.length;
  }
 
  get tourIsActive():boolean
  {
    return this._shepherdService.isActive;
  }

  public async show():Promise<void>
  {
    try
    {
      this._spinnerService.show();

      this.commandCenters = (await this._apiService.postWithAuthentication({
          funcion: "web_fichas_cm_lista_cm",
          proyecto: this.project.bd_proyecto,
          modulo: "gissmart_energy",
          grupo: "gestlighting",
          capa: "centro_mando"
      })).datos.lista;

      this.createAndProjectHighlightLayer();

      this._projectLayersService
          .obtenerCapas()
          .forEach(capa => {

            if( ! capa.filtro_capa.includes("centro_mando") )
              this.map.removeLayer(capa.capaWms);
            
            if( capa.filtro_capa.includes("centro_mando") )
              this.commandCentersLayer = capa.capaWms;  

          });

      await super.show();

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

  private createAndProjectHighlightLayer():void
  {
    const baseUrl = this.project.url_base.split('wms?')[0] + "wms?";

    this.highlightedElementsLayer = new LeafletWms.overlay(baseUrl, ({
      layers: "gissmart_energy_gestlighting_centro_mando",
      styles: "buffer_linea",
      className: "informacion_seleccionado",
      format: 'image/png',
      crossOrigin: true,
      transparent: true,
      opacity: 1,
      maxNativeZoom: 22,
      maxZoom: 22,
      tiled: false,
      cql_filter: null,
      env: "buffer:30",
    } as any));

    this.map.addLayer(this.highlightedElementsLayer);

    this.highlightedElementsLayer.bringToBack();
  }

  public async selectAllCms():Promise<void>
  {
    this.selectedCms = [...this.commandCenters];
    this.updateHiglightedElementsLayer();
  }

  public async unselectAllCms():Promise<void>
  {
    this.selectedCms = [];
    this.updateHiglightedElementsLayer();
  }

  public cmIsSelected(cm:string):boolean
  {
    return this.selectedCms.includes(cm);
  }

  public updateSelectedCms(cm):void
  {
    this.cmIsSelected(cm) ?
    this.selectedCms = this.selectedCms.filter(_cm => _cm !== cm) :
    this.selectedCms.push(cm);

    this.updateHiglightedElementsLayer();
  }

  private updateHiglightedElementsLayer():void
  {
    if( this.selectedCms.length )
    {
      let cms = this.selectedCms.map(cm => `'${cm}'`);
      (this.highlightedElementsLayer.wmsParams as any).cql_filter = `descripcion IN (${cms.join(", ")})`;
    }
    else
    {
      (this.highlightedElementsLayer.wmsParams as any).cql_filter = "id_centro_mando='????'";
    }  
    
    this.highlightedElementsLayer.setParams(({fake: Date.now()} as any));
  }

  public toggleSectionVisibilityEvent():void
  {
    this.toggleSectionVisibility.emit();
  }

  public async hide():Promise<void>
  {
    this.clear();

    this._projectLayersService
        .obtenerCapas()
        .forEach(capa => {

          if( ! this.map.hasLayer( capa.capaWms ) )
            this.map.addLayer(capa.capaWms);

        });

    this._shepherdService.tourObject = null;

    await super.hide();  
  }

  private clear():void
  {    
    this.commandCenters = [];
    this.selectedCms = [];

    if( this.highlightedElementsLayer )
    {
      this.map.removeLayer( this.highlightedElementsLayer );
      this.highlightedElementsLayer = null;
    }

    this.commandCentersLayer = null;
  }

   /* TOUR */

   public showTour():void
   {
     if( this.tourIsActive )
       return;
 
     this.buildTour();
 
     const removeMapRefDiv = () => {
       const mapRefDiv = document.getElementById("mapRefDiv");
       
       if( mapRefDiv )
         mapRefDiv.remove();
     }
 
     this._shepherdService.tourObject.on("cancel", removeMapRefDiv);
 
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
           element: `#${step.element}`, 
           on: step.labelPosition
         },
         buttons: _buttons,
         title: `PASO ${i + 1}`,
         text: step.content,
         when: step.event ?? null
       };
 
       _steps.push(_step);
     }
 
     this._shepherdService.addSteps(_steps);
   }
 
   private buildTourSteps():any[]
   {
     const mapRefDiv = document.createElement("DIV");
 
     mapRefDiv.style.left = "2.5%";
     mapRefDiv.style.right = "32.5%";
     mapRefDiv.style.top = "0%";
     mapRefDiv.style.bottom = "0%";
     mapRefDiv.style.width = "40%";
     mapRefDiv.style.height = "50%";
     mapRefDiv.style.margin = "auto";
     mapRefDiv.style.border = "1px solid red";
     mapRefDiv.style.zIndex = "1200";
     mapRefDiv.style.position = "fixed";
     mapRefDiv.id = "mapRefDiv";
 
     const steps = [
       {
         element: `command-centers-listing`,
         labelPosition: "left",
         content: 'Seleccionar uno o varios centros de mando haciendo click sobre el nombre o la casilla correspondiente.'
       },
       {
         element: `select-all-cms-btn`,
         labelPosition: "top",
         content: 'Puede <b>seleccionar / deseleccionar</b> todos los elementos con este botón.'
       },
       {
         element: `generate-sheets-btn`,
         labelPosition: "top",
         content: 'Una vez que se hayan seleccionado los elementos hacer click en <span class="badge bg-info text-white">Generar</span> para generar las fichas.',
         event: {
          "before-show": () => mapRefDiv.remove()
        }
       },
       {
         element: `mapRefDiv`,
         labelPosition: "right",
         hasMedia: true,
         content: `
         La construcción de fichas puede demorarse según el número de elementos seleccionados. 
         Podrá ver el estado en la pantalla de espera.
         <br><br>
         <div class='lds-ellipsis'><div></div><div></div><div></div><div></div></div>
         <img onload="this.classList.remove('hide'); this.previousElementSibling.style.display = 'none';" 
         class="hide step-media w-100 h-auto" src="assets/images/medium/tours/herramientas/fichas-centro-mando/4-pantalla-de-espera.png">
         `,
         event: {
           "before-show": () => document.querySelector("body").appendChild(mapRefDiv)
         }
       },
       {
        element: `sheets-per-command-centers-tool`,
        labelPosition: "left-start",
        hasMedia: true,
        content: `
        Una vez que el documento PDF sea generado se descargará automaticamente.
        Puede usar el índice del documento haciendo <b>click sobre la línea</b>.
        <br><br>
        <div style="display: none">Error al cargar video.</div>
         <video onerror="this.classList.add('hide'); this.previousElementSibling.style.display = 'block';" 
               class="step-media" loop autoplay muted>
           <source src="assets/images/medium/tours/herramientas/fichas-centro-mando/5-indice-pdf.mp4" type="video/mp4">
           Tu navegador no soporta videos.
         </video> 
        `,
        event: {
          "before-show": () => mapRefDiv.remove()
        }
      }
     ];
      
     return steps;
   }
}