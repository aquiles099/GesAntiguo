import { IDBBuilderObject, _IDBObjectStore, IDBObjectStoreIndex } from '../../interfaces/idb/idb-builder-object';
import { isset } from '../../shared/helpers';

export abstract class IDBManager
{
  public db:IDBDatabase;

  protected transactionInProgress:IDBTransaction = null; 
  
  constructor()
  {
  }

  get establishedConnection():boolean
  {
    return isset(this.db);
  }

  public abstract openIDBConnection(schema:IDBBuilderObject):Promise<void>

  public async allRecords(objectStoreName:string):Promise<Array<any>>
  {
      return new Promise(async (resolve, reject) => {

        try {

          const objectStore = await this.findObjectStore(objectStoreName),
            records = [];

          const request = objectStore.openCursor();

          request.onsuccess = (event: any) => {

            const cursor = event.target.result;

            if (cursor) {
              records.push(cursor.value);
              cursor.continue();
            }
            else {
              resolve(records);
            }
          };

          request.onerror = (event: any) => { throw event.target.transaction};

        } catch (error) {
          reject(error);
        }

      });
  }

  //
  public async addRecord(
    objectStoreName:string,
    data:any
  ):Promise<any>
  {
    return new Promise( async (resolve, reject) => {

      try {
        
        const objectStore:IDBObjectStore = await this.findObjectStore(objectStoreName,"readwrite");
          
        const request = objectStore.add(data);
    
        request.onsuccess = (event:any) => resolve(event.target.result);

        this.db.onerror = (event:any) => {throw event.target.error};

      } catch (error) {
        reject(error);
      }
              
    }); 
  }

  public async findRecord(
    objectStoreName:string,
    key:string|number
  ):Promise<any>
  {    
    return new Promise( async (resolve, reject) => {

      try {
        
        const objectStore:IDBObjectStore = await this.findObjectStore(objectStoreName);
    
        const request:IDBRequest = objectStore.get(key);
    
        request.onsuccess = (event:any) => resolve(event.target.result);
        
        this.db.onerror = (event:any) => {throw event.target.error};

      } catch (error) {
        reject(error);
      }

    });
  } 
 
  public async updateRecord(
    objectStoreName:string,
    data:any
  ):Promise<any>
  {    
    return new Promise( async (resolve, reject) => {

      try {
        
        const objectStore:IDBObjectStore = await this.findObjectStore(objectStoreName,"readwrite");
    
        const request:IDBRequest = objectStore.put(data);
        
        request.onsuccess = (event:any) => resolve(event.target.result);
        
        this.db.onerror = (event:any) => {throw event.target.error};

      } catch (error) {
        reject(error);
      }

    });
  } 

  public async deleteRecord(
    objectStoreName:string,
    key:string|number
  ):Promise<any>
  {    
    return new Promise( async (resolve, reject) => {

      try {
        
        const objectStore:IDBObjectStore = await this.findObjectStore(objectStoreName,"readwrite");
    
        const request:IDBRequest = objectStore.delete(key);
        
        request.onsuccess = (event:any) => resolve(event.target.result);
        
        this.db.onerror = (event:any) => {throw event.target.error};

      } catch (error) {
        reject(error);
      }

    });
  } 

  public async findObjectStore(
    name:string,
    mode:IDBTransactionMode = "readonly"
  ):Promise<IDBObjectStore>
  {      
      return new Promise((resolve, reject) => {

        try {

          if(! this.db.objectStoreNames.contains(name))
            throw new Error("Almacen de objetos no encontrado");
          
          this.transactionInProgress = this.db.transaction(name, mode);
       
          resolve(this.transactionInProgress.objectStore(name));

          this.db.onerror = (event:any) => {throw event.target.error};
  
        } catch (error)
        {
          reject(error);
        }

      });
  }
}