import { Injectable } from '@angular/core';
import { IDBManager } from 'src/app/models/unic/idb-manager';
import { IDBBuilderObject } from '../../interfaces/idb/idb-builder-object';

@Injectable({
  providedIn: "root"
})
export class FisotecDbService extends IDBManager
{
  public schema: IDBBuilderObject = {
    name: "fisotec-databases",
    version: 1,
    objectStores: [
      {
        name: "databases",
        options: {
          keyPath: "name"
        }
      }
    ]
  };

  constructor()
  {
    super();
    this.openIDBConnection();
  }

  public async openIDBConnection(): Promise<void>
  {
    await new Promise<void>((resolve, reject) => {

      const request: IDBOpenDBRequest = window.indexedDB.open(this.schema.name, this.schema.version);

      request.onerror = () => reject(new Error("Error de conexion con base de datos."));

      request.onupgradeneeded = (event: any) => {

        const db: IDBDatabase = event.target.result;

        if (this.schema.objectStores.length) {
          this.schema.objectStores.forEach(objectStoreParameters => {

            let objectStore = db.createObjectStore(objectStoreParameters.name, objectStoreParameters.options);

            if (objectStoreParameters.indexes && objectStoreParameters.indexes.length) {
              objectStoreParameters.indexes.forEach(
                indexOptions => objectStore.createIndex(indexOptions.name, indexOptions.keyPath, indexOptions.options)
              );
            }

          });
        }

      };

      request.onsuccess = (event: any) => {
        this.db = event.target.result;
        resolve();
      };

    });

  }
}
