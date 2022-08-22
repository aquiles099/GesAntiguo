import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { MapService } from './map.service';
import { GeoJSONLayer } from '../../models/unic/geojson/geojson-layer';
import { GeojsonFilesService } from './geojson-files.service';
import { GeoJSONFile } from '../../models/unic/geojson/geojson-file';
import { IGeoJSONFile } from '../../interfaces/geojson/i-geojson-file';
import { map } from 'rxjs/operators';
import { Layer } from 'leaflet';

@Injectable({
  providedIn: "root"
})
export class GeojsonLayersService
{
  private persistentMode:boolean = true;

  private fileLayersSubject:BehaviorSubject<GeoJSONLayer[]>;
  public fileLayer$:Observable<GeoJSONLayer[]>;
  public enabledFileLayer$:Observable<GeoJSONLayer[]>;

  constructor(
    private _mapService:MapService,
    public geojsonFilesService:GeojsonFilesService
  )
  {
    this.fileLayersSubject = new BehaviorSubject([]);
    
    this.fileLayer$ = this.fileLayersSubject.asObservable();

    this.enabledFileLayer$ = this.fileLayersSubject.asObservable().pipe(
      map(fileLayers => fileLayers.filter( fileLayer => fileLayer.enabled))
    );
  }

  public next(fileLayers:Array<GeoJSONLayer>):void
  {
    this.fileLayersSubject.next(fileLayers);
  }

  public enablePersistentMode():void
  {
    this.persistentMode = true;
  }
  
  public disablePersistentMode():void
  {
    this.persistentMode = false;
  }
  
  public get():Array<GeoJSONLayer>
  {
    return this.fileLayersSubject.getValue();
  }

  public getEnabled():Array<GeoJSONLayer>
  {
    return this.get().filter(layer => layer.enabled);
  }
  
  public getPerModule(name:string, layerState?:"enabled"|"projected"):Array<GeoJSONLayer>
  {
    let fileLayers;

    switch(layerState)
    {
      case "enabled":
        fileLayers = this.getEnabled();
        break;
      case "projected":
        fileLayers = this.getProjected();
        break;
      default:
        fileLayers = this.get();
        break;
    }

    return fileLayers.filter(layer => layer.file.module_name === name);
  }

  public getEnabledPerModule(name:string):Array<GeoJSONLayer>
  {
    return this.getEnabled().filter(layer => layer.file.module_name === name);
  }

  public getProjected():Array<GeoJSONLayer>
  {
    return this.getEnabled().filter(fileLayer => fileLayer.isProjected);
  }

  public getUnprojected():Array<GeoJSONLayer>
  {
    return this.getEnabled().filter(fileLayer => ! fileLayer.isProjected);
  }

  public async loadExistingLayers():Promise<void>
  {
    await this.geojsonFilesService.load();

    this.disablePersistentMode();

    const layers = [];

    this.next(layers);
    
    for( let file of this.geojsonFilesService.get() )
    {
      let fileLayer = new GeoJSONLayer(file);
      
      layers.push(fileLayer);

      if(file.isProjected)
        this.project(fileLayer);
    }
    
    this.next(layers);

    this.enablePersistentMode();
  }

  public async create(files:IGeoJSONFile|GeoJSONFile|Array<IGeoJSONFile|GeoJSONFile>):Promise<GeoJSONFile[]>
  {
    files = Array.isArray(files) ? files : [files];

    if(this.persistentMode)
      await this.geojsonFilesService.save(files);
    
    const newLayers = [];
    
    for (const file of files)
    {
      const newLayer = new GeoJSONLayer(file);
              
      newLayers.push(newLayer);
    }

    this.next([...this.get(), ...newLayers]);

    return newLayers;
  }
  
  public async projectAll():Promise<void>
  {
    for(let fileLayer of this.getUnprojected())
    {      
      await this.project(fileLayer);
    }
  }  

  public async project(fileLayer:string|GeoJSONLayer):Promise<void>
  {
    fileLayer = fileLayer instanceof GeoJSONLayer ? fileLayer : this.find(fileLayer);

    if( this._mapService.map.hasLayer(fileLayer.layer) )
      this._mapService.map.removeLayer(fileLayer.layer);

    this._mapService.map.addLayer(fileLayer.layer);
    
    if( this.persistentMode )
    {
      fileLayer.setStatus = "projected";
      await this.update(fileLayer);
    }
  }

  public async unprojectAll():Promise<void>
  {
    for(let fileLayer of this.getProjected())
    {      
      await this.unproject(fileLayer);
    }
  }

  public async unproject(fileLayer:string|GeoJSONLayer):Promise<void>
  {
    fileLayer = fileLayer instanceof GeoJSONLayer ? fileLayer : this.find(fileLayer);
    
    if( this._mapService.map.hasLayer(fileLayer.layer) )
      this._mapService.map.removeLayer(fileLayer.layer);
      
    if( this.persistentMode )
    {
      fileLayer.setStatus = "unprojected";
      await this.update(fileLayer);
    }
  }

  public find(value:string, key:string = "fileName"):GeoJSONLayer
  {
    return this.get().find(fileLayer => fileLayer[key] === value);
  }
  
  public findByLayer(layer:Layer):GeoJSONLayer
  {
    return this.get().find(fileLayer => fileLayer.layer.hasLayer(layer));
  }

  public async rebuildAndUpdate(fileLayer:string|GeoJSONLayer, newFile?:GeoJSONFile|IGeoJSONFile):Promise<void>
  {
    fileLayer = fileLayer instanceof GeoJSONLayer ? fileLayer : this.find(fileLayer);

    if( this._mapService.map.hasLayer(fileLayer.layer) )
      this._mapService.map.removeLayer(fileLayer.layer);

    newFile ?
    fileLayer.rebuild(newFile) :
    fileLayer.build();

    if( fileLayer.isProjected )
      await this.project(fileLayer);
  }
  
  public async update(fileLayer:GeoJSONLayer):Promise<void>
  {
    const fileLayers = this.get();

    const fileLayerPosition = fileLayers.findIndex(_fileLayer => _fileLayer.fileName === fileLayer.fileName);

    fileLayers[fileLayerPosition] = fileLayer;
        
    this.next(fileLayers);

    await this.geojsonFilesService.update( fileLayer.file );
  }

  public async remove(fileName:string):Promise<void>
  {
    const fileLayers = this.get();

    const deletedFileLayerPosition = fileLayers.findIndex(_fileLayer => _fileLayer.fileName === fileName);
    const deletedFileLayer = fileLayers.splice(deletedFileLayerPosition, 1)[0];

    if( this._mapService.map.hasLayer(deletedFileLayer.layer) )
      this._mapService.map.removeLayer(deletedFileLayer.layer);

    await this.geojsonFilesService.delete(fileName);

    this.next(fileLayers);
  }

  public getModulesOfEnabledLayers():string[]
  {
    return this.getEnabled().map(fileLayer => fileLayer.moduleName);
  }

  public getModulesOfProjectedLayers():string[]
  {
    return this.getEnabled().map(fileLayer => fileLayer.moduleName);
  }

  public getModuleNames(layerStatus?:"enabled"|"projected"):string[]
  {
    let repeatingModuleNames;

    switch(layerStatus)
    {
      case "enabled":
        repeatingModuleNames = this.getEnabled().map(fileLayer => fileLayer.moduleName);
        break;
      case "projected":
        repeatingModuleNames = this.getProjected().map(fileLayer => fileLayer.moduleName);
        break;
      default:
        repeatingModuleNames = this.get().map(fileLayer => fileLayer.moduleName);
        break;
    }
    
    return Array.from( new Set(repeatingModuleNames) );
  }
  
  public async toggleModuleVisibility(moduleName:string, action:"project"|"unproject"):Promise<void>
  {
    for(let fileLayer of this.getEnabledPerModule(moduleName))
    {  
      action === "project" ?
      await this.project( fileLayer) :
      await this.unproject( fileLayer);
    }
  }

  public enableLabel(fileLayer:GeoJSONLayer|string, label:string):void
  {
    fileLayer = fileLayer instanceof GeoJSONLayer ? fileLayer : this.find(fileLayer);

    this._mapService.map.removeLayer(fileLayer.layer);

    fileLayer.label = label;
    fileLayer.build();

    this._mapService.map.addLayer(fileLayer.layer);
  }

  public disableLabel(fileLayer:GeoJSONLayer|string):void
  {
    fileLayer = fileLayer instanceof GeoJSONLayer ? fileLayer : this.find(fileLayer);

    this._mapService.map.removeLayer(fileLayer.layer);

    fileLayer.label = null;
    fileLayer.build();

    this._mapService.map.addLayer(fileLayer.layer);
  }
  
}
