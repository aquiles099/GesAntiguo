import { Injectable } from '@angular/core';
import { IDBBuilderObject, _IDBObjectStore, IDBObjectStoreIndex } from '../../interfaces/idb/idb-builder-object';
import { BehaviorSubject, Observable } from 'rxjs';
import { IGeoJSONFile } from '../../interfaces/geojson/i-geojson-file';
import { GeoJSONFile } from '../../models/unic/geojson/geojson-file';
import { ProjectService } from './project.service';
import { map } from 'rxjs/operators';
import { IDBManager } from '../../models/unic/idb-manager';
import { FisotecDbService } from './fisotec-db.service';
import { ProjectsService } from './projects.service';

@Injectable({
  providedIn: "root"
})
export class GeojsonFilesService extends IDBManager
{
  private filesSubject:BehaviorSubject<GeoJSONFile[]>;
  public file$:Observable<GeoJSONFile[]>;
  public enabledFile$:Observable<GeoJSONFile[]>;

  constructor(
    private _projectsService:ProjectsService, 
    private _projectService:ProjectService,
    private _fisotecDbService:FisotecDbService
  )
  {
    super();

    this.filesSubject = new BehaviorSubject([]);
    
    this.file$ = this.filesSubject.asObservable();
    
    this.enabledFile$ = this.filesSubject.asObservable().pipe(
      map(files => files.filter(file => file.enabled))
    );
  }

  public async openIDBConnection(schema?:IDBBuilderObject):Promise<void>
  { 
    try
    {
      if( this.db )
      {
        if(schema)
          schema.objectStores = schema.objectStores.filter(objectStore => ! this.db.objectStoreNames.contains(objectStore.name));
        
        this.db.close();
        this.db = null;
      }

      schema = schema ?? await this.getSchema();
  
      const dbData = await this._fisotecDbService.findRecord("databases", schema.name);
  
      if(! dbData )
      {
        await this._fisotecDbService.addRecord("databases", {
          name: schema.name,
          last_version: schema.version
        });
      }
      else
      {
        schema.version = dbData.last_version;
      }
  
      const request:IDBOpenDBRequest = window.indexedDB.open(schema.name, schema.version);
  
      await new Promise<void>( (resolve, reject) => {
        
        request.onerror = () => reject( new Error("Error de conexion con base de datos.") ); 
        
        request.onupgradeneeded = (event:any) => {
          
          const db:IDBDatabase = event.target.result;
  
          if(schema.objectStores.length)
          {
            schema.objectStores.forEach( (objectStoreParameters:_IDBObjectStore) => {
              
              let objectStore  = db.createObjectStore(objectStoreParameters.name, objectStoreParameters.options);
  
              if(objectStoreParameters.indexes && objectStoreParameters.indexes.length)
              {
                objectStoreParameters.indexes.forEach(
                  (indexOptions:IDBObjectStoreIndex) => objectStore.createIndex(indexOptions.name, indexOptions.keyPath, indexOptions.options) 
                );
              }
              
            });
          }
    
        };
  
        request.onsuccess = (event:any) => {
          this.db = event.target.result;
          resolve();
        }
    
      });
  
      const thereAreNewObjectStores = schema.objectStores.some(
        objectStore => ! this.db.objectStoreNames.contains(objectStore.name)
      );
  
      if( thereAreNewObjectStores )
      {        
        schema.version++;
  
        await this._fisotecDbService.updateRecord("databases", {
          name: schema.name,
          last_version: schema.version
        });
        
        await this.openIDBConnection(schema);
      }
    
    }
    catch (error)
    {
      throw error;  
    }
  }
  
  public async deleteObjectStoresAndReopenIDBConnection(projectIds:number[]):Promise<void>
  { 
    try
    {
      this.db.close();
  
      const dbData = await this._fisotecDbService.findRecord("databases", "geojson-layers");
  
      dbData.last_version++;
  
      const request:IDBOpenDBRequest = window.indexedDB.open("geojson-layers", dbData.last_version);
  
      await new Promise<void>( (resolve, reject) => {
        
        request.onerror = () => reject( new Error("Error de conexion con base de datos.") ); 
        
        request.onupgradeneeded = (event:any) => {
          
          const db:IDBDatabase = event.target.result;

          projectIds.forEach(id => db.deleteObjectStore(`project_id_${id}`));

        };
  
        request.onsuccess = (event:any) => {
          this.db = event.target.result;
          resolve();
        }
    
      });
  
      await this._fisotecDbService.updateRecord("databases", {
        name: "geojson-layers",
        last_version: dbData.last_version
      });
                
    }
    catch (error)
    {
      throw error;  
    }
  }
  
  private async getSchema():Promise<IDBBuilderObject>
  {
    if( ! this._projectsService.isStarted )
      await this._projectsService.loadProjects();

    const schema = {
        name: "geojson-layers",
        version: 1,
        objectStores: []
    };

    for(const project of this._projectsService.get())
    {
      schema.objectStores.push(
        {
          name: `project_id_${project.id_proyecto}`,
          options: {
            keyPath: "name"
          }
        }
      );
    }

    return schema;
  }

  private next(files:Array<IGeoJSONFile|GeoJSONFile>):void
  {
    const _files = files.map(file => file instanceof GeoJSONFile ? file : new GeoJSONFile(file));

    this.filesSubject.next(_files);
  }
 
  public get():Array<GeoJSONFile>
  {
    return this.filesSubject.getValue();
  }

  public getEnabled():Array<GeoJSONFile>
  {
    return this.filesSubject.getValue().filter(file => file.enabled);
  }

  public getProjected():Array<GeoJSONFile>
  {
    return this.getEnabled().filter(file => file.isProjected);
  }

  public async load():Promise<void>
  {
    let files = await this.allRecords(`project_id_${this._projectService.project.id_proyecto}`);

    this.next(files);

    // console.log( await navigator.storage.estimate());
  }

  public async save(files:IGeoJSONFile|GeoJSONFile|Array<IGeoJSONFile|GeoJSONFile>):Promise<void>
  {
    let _files = Array.isArray(files) ? [...files] : [files];
    
    for(let file of _files)
    {      
      await this.addRecord(`project_id_${this._projectService.project.id_proyecto}`, file);
    }

    _files.push(...this.get());
    
    this.next(_files);
  }

  public find(value:string, key:string = "name"):GeoJSONFile
  { 
    try {
      
      const file = this.get().find(file => file[key] === value );

      if(! file)
        throw new Error("Archivo no existe.");

      return file;
    } 
    catch (error)
    {
      throw error;
    }
  }

  public async update(updatedFile:IGeoJSONFile|GeoJSONFile):Promise<void>
  {
    await this.updateRecord(`project_id_${this._projectService.project.id_proyecto}`, updatedFile);

    const files = this.filesSubject.getValue();

    const updatedFileIndex = files.findIndex(file => file.name === updatedFile.name);

    (files as any)[updatedFileIndex] = updatedFile;

    this.next(files);
  }
 
  public async delete(name:string):Promise<void>
  {
    await this.deleteRecord(`project_id_${this._projectService.project.id_proyecto}`, name);

    const files = this.get().filter(file => file.name !== name);

    this.next(files);
  }
}
