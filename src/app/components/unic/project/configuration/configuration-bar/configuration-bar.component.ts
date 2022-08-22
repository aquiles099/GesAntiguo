import { Component, Input, ViewChild, AfterViewInit, ChangeDetectorRef, HostListener, OnInit, OnDestroy } from '@angular/core';
import { showPreconfirmMessage, delayExecution } from '../../../../../shared/helpers';
import { ToastrService } from 'ngx-toastr';
import { SpinnerService } from '../../../../../services/spinner.service';
import { GeojsonFilesService } from '../../../../../services/unic/geojson-files.service';
import { HideableSectionComponent } from '../../../shared/hideable-section/hideable-section.component';
import { ProjectionSetupSectionComponent } from './projection-setup-section/projection-setup-section.component';
import { Map } from 'leaflet';
import { Router } from '@angular/router';
import { GeoJSONLayer } from 'src/app/models/unic/geojson/geojson-layer';
import { Subscription } from 'rxjs';
import { GeojsonFilesAnalysisChartsConfigurationsService } from '../../../../../services/unic/geojson-files-analysis-charts-configurations.service';
import { GeojsonLayerImagesService } from '../../../../../services/unic/geojson-layer-images.service';
import { TabsetComponent } from 'ngx-bootstrap/tabs';
import { ProjectService } from '../../../../../services/unic/project.service';
import { GEOMETRY_TYPES, GeometryType } from '../../../../../interfaces/geojson/i-geojson-file';
import { Modulo } from '../../../../../interfaces/medium/mapa/Modulo';

export interface LayerInfo
{
  id:number;
  name:string;
  geometry:GeometryType;
  moduleName:string;
} 
@Component({
  selector: 'configuration-bar',
  templateUrl: './configuration-bar.component.html',
  styleUrls: ['./configuration-bar.component.css']
})
export class ConfigurationBarComponent extends HideableSectionComponent implements OnInit, AfterViewInit, OnDestroy
{
  public isCollapsed:boolean = false;
  
  @Input()
  public map:Map;

  @Input()
  public projections:any;

  public modules:any[] = [];

  private geojsonLayers:Array<GeoJSONLayer> = [];
  private geojsonLayersSubscription:Subscription;
  
  private newLayersIds:Set<number> = new Set;
  private modifiedLayersIds:Set<number> = new Set;
  private deletedLayerFiles:Set<string> = new Set;

  public layerIdsEnabled:Set<number> = new Set;

  private _thereWereChanges:boolean = false;

  @ViewChild(ProjectionSetupSectionComponent)
  public ProjectionSetupSection:ProjectionSetupSectionComponent;

  @ViewChild('tabset', { static: false }) 
  public tabset: TabsetComponent;

  public selectedTabId:number = 0;
  
  constructor(
  private _toastr:ToastrService,
  private _spinnerService:SpinnerService,
  private _projectService:ProjectService,
  private _geojsonFilesService:GeojsonFilesService,
  private _geojsonLayerImagesService:GeojsonLayerImagesService,
  private _analysisChartsConfigurationsService:GeojsonFilesAnalysisChartsConfigurationsService,
  private _router:Router,
  private changeDetector:ChangeDetectorRef
  )
  {
    super();
    this._isVisible = true;
  }
    
  @Input() 
  set formatedModules(modules:Modulo[])
  {
    this.modules = modules.map(module => {

      const capas = module.grupos.reduce((layers, group) => {
        layers.push(...group.capas);
        return layers;
      }, []);

      return {
        name: module.nombre,
        layers: capas.map(layerInfo => {
          return {
            id: layerInfo.id,
            name: layerInfo.nombre,
            geometry: GEOMETRY_TYPES.find(type => type.toLowerCase() === layerInfo.tipo_geometria.toLowerCase()),
            moduleName: module.nombre
          }
        })
      }
      
    });
  }

  get fileNames():Array<string>
  {
    return this.geojsonLayers.map(fileLayer => fileLayer.fileName);
  }
  
  get thereWereChanges():boolean
  {
    return this._thereWereChanges;
  }

  get onSmallScreen():boolean
  {
    const screenWidth = (window as any).visualViewport ? (window as any).visualViewport.width : window.screen.width;
    return screenWidth <= 576; 
  }

  public async ngOnInit():Promise<void>
  {
    this.geojsonLayersSubscription = this._geojsonFilesService.file$.subscribe(files => {

      if( this.map )
      {      
        this.geojsonLayers = files.map(file => new GeoJSONLayer(file, {filter: false, categorization: false}));
        
        this.geojsonLayers.filter(fileLayer => fileLayer.enabled).forEach(filelayer => this.map.addLayer(filelayer.layer));
        
        this.layerIdsEnabled =  new Set( files.filter(file => file.enabled).map(file => file.layerId) );

        this.geojsonLayersSubscription.unsubscribe();
      }

    });
  }

  public ngAfterViewInit():void
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

  public async returnFromTheProjectionSettingsSection(fileLayer?:GeoJSONLayer):Promise<void>
  {
    try 
    {
      this._spinnerService.updateText("Cargando capas...");
      this._spinnerService.show();

      await delayExecution(250);

      if( fileLayer )
      {
        const fileLayerExistedInListing = this.geojsonLayers.some(_fileLayer => _fileLayer.layerId === fileLayer.layerId );

        this.updateFileLayersAfterFileUpload(fileLayer);

        if( fileLayerExistedInListing )
        {
          if( this.layerIdsEnabled.has(fileLayer.layerId) )
            fileLayer.setStatus = "projected";

          if( ! this.newLayersIds.has(fileLayer.layerId) )
            this.modifiedLayersIds.add(fileLayer.layerId);

          const layerIndex = this.geojsonLayers.findIndex(_fileLayer => _fileLayer.layerId === fileLayer.layerId);

          this.geojsonLayers[layerIndex] = fileLayer;
        }

        this._thereWereChanges = true;
      }

      // reproyectar capas habilitadas nuevamente en el mapa.
      this.geojsonLayers.filter(fileLayer => fileLayer.enabled ).forEach( file => this.map.addLayer(file.layer) );
      
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

  private async updateFileLayersAfterFileUpload(fileLayer:GeoJSONLayer):Promise<void>
  {
    if( this.layerHasFileAdded(fileLayer.layerId) )
    {
      const layerIndex = this.geojsonLayers.findIndex(_fileLayer => _fileLayer.layerId === fileLayer.layerId);

      const deletedFileLayer = this.geojsonLayers.splice(layerIndex, 1, fileLayer)[0];

      this.map.removeLayer( deletedFileLayer.layer );

      //se debe verificar si el archivo existe en la base de datos. Si existe se añade a los "archivos por eliminar".
      try {

        const file = this._geojsonFilesService.find( deletedFileLayer.fileName );
        
        if(file)
          this.deletedLayerFiles.add( deletedFileLayer.fileName );

      } catch (error) {}

      this.newLayersIds.add( fileLayer.layerId );
    }
    else
    {
      this.geojsonLayers.push(fileLayer)
      this.newLayersIds.add( fileLayer.layerId );
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
      multilinestring:"multi-línea",
      multipolygon:"multi-polígono"
    };

    return types[selected.toLowerCase()] || "desconocido";
  }

  public findLayer(id:number):GeoJSONLayer
  {
    return this.geojsonLayers.find(fileLayer => fileLayer.file.layerId === id);
  }

  public layerHasFileAdded(id:number):boolean
  {
    return this.geojsonLayers.some(fileLayer => fileLayer.file.layerId === id);
  }

  public async showProjectionSetupSection(layerInfo:LayerInfo, event?:any):Promise<void>
  {
    try
    {
      await super.hide();

      await this.ProjectionSetupSection.show();

      event ?
      await this.ProjectionSetupSection.onSelectLayerFile(event, layerInfo) :
      await this.ProjectionSetupSection.setFileLayerAndProject( this.findLayer(layerInfo.id) );

    }
    catch (error)
    {
      await this.ProjectionSetupSection.hide();
      
      await super.show();

      this._spinnerService.updateText("Cargando capas...");
      this._spinnerService.show();

      this.tabset.tabs[ this.selectedTabId ].active = true;

      // reproyectar capas habilitadas nuevamente en el mapa.
      this.geojsonLayers.filter(fileLayer => fileLayer.enabled ).forEach( file => this.map.addLayer(file.layer) );

      this._spinnerService.hide();
      this._spinnerService.cleanText();

      this.map.flyToBounds((this._projectService.bbox as any) ,{ duration: 0.5});
    }
   
  }

  public async toggleLayerState(layerId:number):Promise<void>
  {
    try
    {
      const enabled = this.layerIdsEnabled.has(layerId);

      enabled ? 
      this.layerIdsEnabled.delete(layerId) :
      this.layerIdsEnabled.add(layerId) ;
  
      if( this.layerHasFileAdded(layerId) )
      {
        this._spinnerService.updateText(
          enabled ? "Removiendo capa de archivo..." : "Proyectando capa de archivo..."
        );

        this._spinnerService.show();

        await delayExecution(250);

        const fileLayer = this.findLayer(layerId);
  
        if(enabled)
        {
          this.map.removeLayer( fileLayer.layer );
          fileLayer.file.enabled = false;
          fileLayer.setStatus = "unprojected";
        }
        else
        {
          this.map.addLayer( fileLayer.layer );
          fileLayer.file.enabled = true;
          fileLayer.setStatus = "projected";
        }

        this.modifiedLayersIds.add( fileLayer.layerId );

        this._thereWereChanges = true;
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

  public layerIsEnabled(id:number):boolean
  {
    return this.layerIdsEnabled.has(id);
  }

  public async deleteGeojsonFile(layerId:number):Promise<void>
  {    
    const fileLayer = this.findLayer(layerId);

    const userResponse = await showPreconfirmMessage(
      `¿Eliminar archivo de capa "${fileLayer.layerName}"?`,
      "Esta acción no es reversible."
    );

    if( userResponse.isConfirmed )
    {
      this._spinnerService.updateText("Removiendo capa de archivo...");

      this._spinnerService.show();

      await delayExecution(250);

      this.map.removeLayer( fileLayer.layer );

      this.geojsonLayers = this.geojsonLayers.filter(fileLayer => fileLayer.layerId !== layerId);

      this._toastr.success("Archivo eliminado.","Exito!");

      this._spinnerService.hide();
      this._spinnerService.cleanText(); 

      this._thereWereChanges = true;

      if( this.newLayersIds.has( fileLayer.layerId ) )
      {
        this.newLayersIds.delete(fileLayer.layerId);
      }
      else
      {
        this.deletedLayerFiles.add(fileLayer.fileName);
  
        if( this.modifiedLayersIds.has(fileLayer.layerId) )
          this.modifiedLayersIds.delete(fileLayer.layerId);
      }

    }
  }

  public async saveChanges():Promise<void>
  {
    try
    {
      const userResponse = await showPreconfirmMessage(
        `¿Salvar cambios?`,
        "La configuración del proyecto sera actualizada.",
        "question",
        "Si, guardar",
        "No, cancelar"
      );
  
      if( userResponse.isConfirmed )
      {
        this._spinnerService.updateText("Guardando configuración...");
        this._spinnerService.show();
  
        await delayExecution(250);

        await this.deleteFiles();
        await this.saveFiles();
        await this.updateFiles();
        await this.updateAnalisisConfigurations();

        this._thereWereChanges = false;
          
        await this._router.navigateByUrl("/unic/home");
  
        this._toastr.success("Archivo configurado.","Exito!");
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

  private async deleteFiles():Promise<void>
  {
    if( this.deletedLayerFiles.size )
    {
      for( const fileName of this.deletedLayerFiles)
      {
        const file = this._geojsonFilesService.find(fileName);
        await this.removeLayerImageGallery(file.layerId);
        await this._geojsonFilesService.delete(fileName);
      }
    } 
  }
  
  private async saveFiles():Promise<void>
  {
    if( this.newLayersIds.size )
    {
      const filesToSave = this.geojsonLayers
                              .filter(fileLayer => this.newLayersIds.has( fileLayer.layerId ))
                              .map(fileLayer => fileLayer.file );

      await this._geojsonFilesService.save( filesToSave );
    }
  }

  private async updateFiles():Promise<void>
  {
    if( this.modifiedLayersIds.size )
    {
      const filesToUpdate = this.geojsonLayers
                              .filter(fileLayer => this.modifiedLayersIds.has( fileLayer.layerId ))
                              .map(fileLayer => fileLayer.file );

      for( const file of filesToUpdate)
      {
        await this.removeLayerImageGallery(file.layerId);
        await this._geojsonFilesService.update(file);
      }

    }
  }

  private async removeLayerImageGallery(layerId:number):Promise<void>
  {
    const layerImageGallery = await this._geojsonLayerImagesService.find(layerId);

    if( layerImageGallery )
      await this._geojsonLayerImagesService.delete(layerId);
  }

  private async updateAnalisisConfigurations():Promise<void>
  {
    try
    {
      const files = this._geojsonFilesService.get();

      const analysisConfigurations = this._analysisChartsConfigurationsService.get();

      for( let analysisConfig of analysisConfigurations)
      {
        analysisConfig.configurations = analysisConfig.configurations.filter(config => {
          
          for(const file of files)
          {
            if( config.layerId === file.layerId )
              return file.featureProperties.includes(config.info);
          }

          return false;
        });

        analysisConfig.configurations.length ?
        await this._analysisChartsConfigurationsService.update(analysisConfig) :
        await this._analysisChartsConfigurationsService.delete(analysisConfig.name);
      }

    }
    catch (error) 
    {
      throw error;
    }
  }

  public ngOnDestroy():void
  {
    if( this.geojsonLayersSubscription )
      this.geojsonLayersSubscription.unsubscribe();
  }

}
