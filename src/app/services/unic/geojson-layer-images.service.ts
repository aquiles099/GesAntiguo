import { Injectable } from '@angular/core';
import { IDBBuilderObject, _IDBObjectStore, IDBObjectStoreIndex } from '../../interfaces/idb/idb-builder-object';
import { ProjectService } from './project.service';
import { IDBManager } from '../../models/unic/idb-manager';
import { ProjectsService } from './projects.service';
import { FisotecDbService } from './fisotec-db.service';

export interface LayerImageGallery
{
  readonly layer_id:number;
  features: Array<FeatureImageCollection>
}

export interface FeatureImageCollection
{
  id:number;
  images:Array<FeatureImage>
}

export interface FeatureImage
{
  file_name:string;
  upload_date:string;
  src:string;
}

@Injectable({
  providedIn: "root"
})
export class GeojsonLayerImagesService extends IDBManager
{
  constructor(
      private _fisotecDbService:FisotecDbService,
      private _projectsService:ProjectsService,
      private _projectService:ProjectService
  )
  {
    super();
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
  
      const dbData = await this._fisotecDbService.findRecord("databases", "geojson-layer-feature-images");
  
      dbData.last_version++;
  
      const request:IDBOpenDBRequest = window.indexedDB.open("geojson-layer-feature-images", dbData.last_version);
  
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
        name: "geojson-layer-feature-images",
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
        name: "geojson-layer-feature-images",
        version: 1,
        objectStores: []
    };

    for(const project of this._projectsService.get())
    {
      schema.objectStores.push(
        {
          name: `project_id_${project.id_proyecto}`,
          options: {
            keyPath: "layer_id"
          }
        }
      );
    }

    return schema;
  }

  public async all():Promise<LayerImageGallery[]>
  {
    return await this.allRecords(`project_id_${this._projectService.project.id_proyecto}`);
  }

  public async save(gallery:LayerImageGallery):Promise<void>
  {
    await this.addRecord(`project_id_${this._projectService.project.id_proyecto}`, gallery);
  }

  public async find(layerId:number):Promise<LayerImageGallery>
  { 
    return await this.findRecord(`project_id_${this._projectService.project.id_proyecto}`, layerId);
  }

  public async update(updatedGallery:LayerImageGallery):Promise<void>
  {
    await this.updateRecord(`project_id_${this._projectService.project.id_proyecto}`, updatedGallery);
  }
 
  public async delete(layerId:number):Promise<void>
  {
    await this.deleteRecord(`project_id_${this._projectService.project.id_proyecto}`, layerId);
  }
}
