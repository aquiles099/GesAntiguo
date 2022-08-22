import { Component, Input, ViewChild, AfterViewInit, ChangeDetectorRef, HostListener, OnInit, OnDestroy, AfterContentInit } from '@angular/core';
import { showPreconfirmMessage, delayExecution } from '../../../../../../shared/helpers';
import { ToastrService } from 'ngx-toastr';
import { SpinnerService } from '../../../../../../services/spinner.service';
import { Map } from 'leaflet';
import { TabsetComponent } from 'ngx-bootstrap/tabs';
import { ProjectService } from '../../../../../../services/unic/project.service';
import { HideableSectionComponent } from '../../../../../shared/hideable-section/hideable-section.component';
import { ProjectsService } from '../../../../../../services/unic/projects.service';
import { ShepherdService } from 'angular-shepherd';
import { InformacionDeCapa } from '../configuration.component';
import { ProjectionSettingsSectionComponent } from './projection-settings-section/projection-settings-section.component';
import { Project } from '../../../../../../interfaces/project';

@Component({
  selector: 'project-configuration-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent extends HideableSectionComponent implements AfterContentInit, OnDestroy
{
  public isCollapsed:boolean = false;
  
  @Input()
  public map:Map;
  
  @Input()
  public projections:any;
  
  @Input()
  public modules:{name:string; layers:InformacionDeCapa[]}[] = [];
  
  @Input()
  private layers:Array<InformacionDeCapa> = [];
  
  @ViewChild(ProjectionSettingsSectionComponent)
  public ProjectionSettingsSection:ProjectionSettingsSectionComponent;

  @ViewChild('tabset', { static: false }) 
  public tabset: TabsetComponent;

  public selectedTabId:number = 0;

  private tourObject:any;
  
  constructor(
  private _toastr:ToastrService,
  private _spinnerService:SpinnerService,
  private _projectService:ProjectService,
  private _projectsService:ProjectsService,
  private changeDetector:ChangeDetectorRef,
  private _shepherdService:ShepherdService
  )
  {
    super();
    this._isVisible = true;
    Object.getPrototypeOf(this);
  }
    
  get onSmallScreen():boolean
  {
    const screenWidth = (window as any).visualViewport ? (window as any).visualViewport.width : window.screen.width;
    return screenWidth <= 576; 
  }

  get tourIsActive():boolean
  {
    return this._shepherdService.isActive;
  }

  get project():Project
  {
    return this._projectService.project;
  }

  public ngAfterContentInit():void
  {
    this.isCollapsed = ! this.onSmallScreen; 
    this.changeDetector.detectChanges(); 
  }

  @HostListener("window:resize")
  public onWindowResize():void
  {
    this.isCollapsed = ! this.onSmallScreen; 
  }

  public onSelectTab(event:any):void
  {
    this.selectedTabId = event.id;
  }

  public async returnFromTheProjectionSettingsSection():Promise<void>
  {
    try 
    {
      this._spinnerService.updateText("Cargando capas...");
      this._spinnerService.show();

      await delayExecution(250);

      this.layers
          .filter(layer => layer.activo )
          .forEach( layer => this.map.addLayer(layer.capaWms) );
      
      await super.show();

    } 
    catch (error)
    {
      console.error(error);
      this._toastr.error(error.message, "Error");
    }
    finally
    {
      this._spinnerService.hide();
      this._spinnerService.cleanText();
      this.tabset.tabs[ this.selectedTabId ].active = true;
      this.map.flyToBounds((this._projectService.bbox as any) ,{ duration: 0.5});
    }
  }

  public toggleCollapseState():void
  {
    this.isCollapsed = !this.isCollapsed;
  }

  public getLayerGeometryTypeLabel(selected:string):string
  {
    const types = {
      point:"Punto",
      linestring:"Línea",
      polygon:"Polígono",
      multilinestring:"Multi-línea",
      multipolygon:"Multi-polígono"
    };

    return types[selected.toLowerCase()] || "desconocido";
  }

  public async showProjectionSetupSection(layer:InformacionDeCapa, event:any):Promise<void>
  {
    try
    {
      this._spinnerService.updateText("Removiendo capas...");
      this._spinnerService.show();
      
      await delayExecution(250);
  
      this.layers
          .filter(layer => layer.activo )
          .forEach( layer => this.map.removeLayer(layer.capaWms) );

      await super.hide();
      await this.ProjectionSettingsSection.show();
      await this.ProjectionSettingsSection.onSelectLayerFile(event, layer);
    }
    catch (error)
    {
      await this.ProjectionSettingsSection.hide();
      
      await super.show();

      this._spinnerService.updateText("Cargando capas...");

      this.tabset.tabs[ this.selectedTabId ].active = true;

      // reproyectar capas habilitadas nuevamente en el mapa.
      this.layers
          .filter(layer => layer.activo )
          .forEach( layer => this.map.addLayer(layer.capaWms) );

      this.map.flyToBounds((this._projectService.bbox as any) ,{ duration: 0.5});
    }
    finally
    {
      this._spinnerService.hide();
      this._spinnerService.cleanText();
    }
  }

  public async toggleLayerState(layer:InformacionDeCapa):Promise<void>
  {
    try
    {

      this._spinnerService.updateText(
        layer.activo ? "Deshabilitando capa..." : "Habilitando capa..."
      );

      this._spinnerService.show();

      await delayExecution(250);

       const wmsLayerStyle = (await this._projectsService.consultarApi({
        "funcion": "web_activar_capa",
        "id_proyecto": this._projectService.project.id_proyecto,
        "id_capa": layer.id,
        "activar": ! layer.activo
      }) ).datos.estilo;

      if( ! layer.capaWms.wmsParams.styles)
      {
        layer.capaWms.setParams(({
          styles: wmsLayerStyle,
          fake: Date.now()
        } as any)); 
      } 

      layer.activo ?
      this.map.removeLayer( layer.capaWms ) :
      this.map.addLayer( layer.capaWms );

      layer.activo = ! layer.activo;
    } 
    catch (error) 
    {      
      console.error(error);
      this._toastr.error(error.message, "Error");
    }
    finally
    {
      this._spinnerService.hide();
      this._spinnerService.cleanText(); 
    }
  }

  public async deleteLayer(layer:InformacionDeCapa):Promise<void>
  {    
    try
    {
      const userResponse = await showPreconfirmMessage(
        `¿Eliminar archivo de capa "${layer.nombre}"?`,
        "Esta acción no es reversible."
      );
  
      if( userResponse.isConfirmed )
      {
        this._spinnerService.updateText("Removiendo capa de archivo...");
  
        this._spinnerService.show();
  
        await delayExecution(250);
  
        await this._projectsService.consultarApi({
            "funcion": "web_eliminar_capa_configuracion",
            "proyecto": this._projectService.project.nombre,
            "proyeccion": this._projectService.project.proyeccion,
            "modulo": layer.modulo,
            "grupo": layer.grupo,
            "capa": layer.nombre
        });

        layer.activo = layer.configurado = false;
        
        this.map.removeLayer( layer.capaWms );

        layer.capaWms.setParams(({
          fake: Date.now()
        } as any)); 
          
        this._toastr.success("Archivo eliminado.","Exito!");
  
        this._spinnerService.hide();
        this._spinnerService.cleanText();
      }
  
    }
    catch (error) 
    {      
      console.error(error);
      this._toastr.error(error.message, "Error");
    }
    finally
    {
      this._spinnerService.hide();
      this._spinnerService.cleanText(); 
    }
  }

  /* TOUR */

  public showTour():void
  {
    if( this.ProjectionSettingsSection.isVisible )
    {
      this.ProjectionSettingsSection.showTour();
    }
    else
    {
      const currentSelectedTab = this.selectedTabId;
      const theFirstTabIsSelected = currentSelectedTab === 0;
      
      if( ! theFirstTabIsSelected )
        this.tabset.tabs[ 0 ].active = true; // Tour solo es mostrado en la 1era tab.
  
      if( this.tourObject )
        this._shepherdService.addSteps( this.tourObject.steps );
      else
        this.buildTour();
  
      this._shepherdService.start();
  
      // Volver a mostrar tab que estaba seleccionada antes del tour.
      const reelectTab = () => this.tabset.tabs[ currentSelectedTab ].active = true;
      
      this._shepherdService.tourObject.on("complete", reelectTab);
      this._shepherdService.tourObject.on("cancel", reelectTab);
    }
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

      if( i === 0 )
      {
        _buttons = _buttons.slice(1);
      }
      
      if( i === (stepsLength - 1)  )
      {
        _buttons[1] = {..._buttons[1]};
        _buttons[1].text = 'Finalizar';
        _buttons[1].action = () => that._shepherdService.complete();
      }

      const step = steps[i];
      
      const _step = {
        id: step.element,
        attachTo: { 
          element: `${step.element === "tab-1" || step.element === "layer-1-upload-file-input" ? "." : "#"}${step.element}`, 
          on: step.labelPosition
        },
        buttons: _buttons,
        title: `PASO ${i + 1}`,
        text: step.text
      };

      _steps.push(_step);
    }

    this._shepherdService.addSteps(_steps);

    this.tourObject = this._shepherdService.tourObject;
  }

  private buildTourSteps():any[]
  {
    const firstModule = this.modules[0];
    const firstLayer = firstModule.layers[0];

    const steps = [
      {
        element: `tab-1`,
        labelPosition: "right",
        text: 'Seleccionar grupo de capas a configurar.'
      },
      {
        element: `module-1-layer-list`,
        labelPosition: "right",
        text: 'Se mostrará el listado de capas asociadas al grupo.'
      },
      {
        element: `layer-${firstLayer.id}-checkbox`,
        labelPosition: "right",
        text: 'Puede deshabilitar / habilitar una capa. Al deshabilitar una capa, esta no será mostrada en la <b>herrmienta GIS</b>.'
      },
      {
        element: `layer-${firstLayer.id}-name`,
        labelPosition: "right",
        text: 'Nombre que identifica la capa.',
      },
      {
        element: `layer-${firstLayer.id}-geometry`,
        labelPosition: "right",
        text: 'Tipo de geometría de la capa.',
      },
      {
        element: `layer-1-upload-file-input`,
        labelPosition: "left",
        text: `Debe configurar un archivo de geometrías sobre la capa. 
        La geometría del archivo debe coincidir (ver paso anterior). <br> Los formatos de archivo soportados son: 
        <br><br> 
        <ul>
          <li class="mb-1">Geojson.</li>
          <li class="mb-1">Shape (comprimido con archivos necesarios SOLO EN FORMATO ZIP).</li>
          <li class="mb-1">XLSX (geometrías deben tener atributo "GEOM").</li>
          <li class="mb-1">Kml.</li>
          <li class="mb-1">Dxf.</li>
        </ul> 
        `,
      },
      {
        element: `layer-1-upload-file-input`,
        labelPosition: "left",
        text: `Una vez cargado el archivo se mostrará la sección de configuracion de proyección.`,
      },
      {
        element: `layer-${firstLayer.id}-delete-btn`,
        labelPosition: "left",
        text: `Puede eliminar el archivo de geometrías asociado a una capa para agregarle uno nuevo o para dejar la capa sin datos.
        <br> Una capa sin datos no será mostrada en la herramienta GIS.`,
      }
    ];

    return steps;
  }

  public ngOnDestroy(): void
  {
    this._shepherdService.tourObject = null;
    this.tourObject = null;
    this.ProjectionSettingsSection.tourObject = null;  
  }
}
