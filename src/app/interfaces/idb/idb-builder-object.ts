export interface IDBBuilderObject
{
    readonly name:string;
    version:number;
    objectStores: Array<_IDBObjectStore>
}

export interface _IDBObjectStore
{
    readonly name:string;
    options?:IDBObjectStoreParameters
    indexes?:Array<IDBObjectStoreIndex>
}

export interface IDBObjectStoreIndex
{
    readonly name:string;
    readonly keyPath:string;
    options?:IDBIndexParameters
}
