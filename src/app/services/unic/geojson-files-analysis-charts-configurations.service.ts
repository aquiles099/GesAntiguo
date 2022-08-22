import { Injectable } from '@angular/core';
import { IDBBuilderObject, _IDBObjectStore, IDBObjectStoreIndex } from '../../interfaces/idb/idb-builder-object';
import { BehaviorSubject, Observable } from 'rxjs';
import { ProjectService } from './project.service';
import { AnalysisConfiguration } from '../../interfaces/analysis/analysis-chart-configuration';
import { IDBManager } from '../../models/unic/idb-manager';
import { ProjectsService } from './projects.service';
import { FisotecDbService } from './fisotec-db.service';

@Injectable({
  providedIn: "root"
})
export class GeojsonFilesAnalysisChartsConfigurationsService extends IDBManager
{
  private configurationsSubject:BehaviorSubject<AnalysisConfiguration[]>;
  public configuration$:Observable<AnalysisConfiguration[]>;

  constructor(
    private _fisotecDbService:FisotecDbService,
    private _projectService:ProjectService,
    private _projectsService:ProjectsService
  )
  {
    super();

    this.configurationsSubject = new BehaviorSubject([]);
    
    this.configuration$ = this.configurationsSubject.asObservable();
  }

  private next(configs:Array<AnalysisConfiguration>):void
  {
    this.configurationsSubject.next(configs);
  }
 
  public get():Array<AnalysisConfiguration>
  {
    return this.configurationsSubject.getValue();
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
        this.db.close();
        
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
  
      const dbData = await this._fisotecDbService.findRecord("databases", "geojson-files-analysis-configurations");
  
      dbData.last_version++;
  
      const request:IDBOpenDBRequest = window.indexedDB.open("geojson-files-analysis-configurations", dbData.last_version);
  
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
        name: "geojson-files-analysis-configurations",
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
        name: "geojson-files-analysis-configurations",
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

  public async load():Promise<void>
  {
    const configurations = await this.allRecords(`project_id_${this._projectService.project.id_proyecto}`);

    this.next(configurations);

    // console.log( await navigator.storage.estimate());
  }

  public async save(configuration:AnalysisConfiguration):Promise<void>
  {    
    await this.addRecord(`project_id_${this._projectService.project.id_proyecto}`, configuration);

    this.next([...this.get(), configuration]);
  }

  public async find(name:string):Promise<AnalysisConfiguration>
  { 
    try
    {
      const configuration = this.get().find(configuration => configuration.name === name );

      if( ! configuration )
        throw new Error("Archivo no existe.");

      return configuration;
    } 
    catch(error)
    {
      throw error;
    }
  }

  public async update(updatedconfiguration:|AnalysisConfiguration):Promise<void>
  {
    await this.updateRecord(`project_id_${this._projectService.project.id_proyecto}`, updatedconfiguration);

    const configurations = await this.allRecords(`project_id_${this._projectService.project.id_proyecto}`);

    this.next(configurations);
  }
 
  public async delete(name:string):Promise<void>
  {
    await this.deleteRecord(`project_id_${this._projectService.project.id_proyecto}`, name);

    const configurations = this.get().filter(configuration => configuration.name !== name);

    this.next(configurations);
  }

}
