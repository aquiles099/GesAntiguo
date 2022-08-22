import LeafletWms from 'leaflet.wms';
import { TipoGeometriaWKT } from './medium/mapa/Modulo';
export interface Project
{
    readonly bd_proyecto: string;
    readonly nombre: string;
    readonly id_proyecto: number;
    favorito: boolean;
    readonly proyecto_activo: boolean,
    readonly ultimo_acceso: string;
    readonly icono: string;
    readonly url_base: string;
    readonly url_osm: string;
    readonly proyeccion:number;
    usuarios: Array<Usuario>;
    modulos: Array<_Modulo>;
}

interface _Modulo {
    readonly modulo:string;
    readonly icono_modulo: string;
    usuarios: Array<Usuario>
}

interface Usuario {
    readonly usuario: string;
    readonly nombre: string;
    readonly apellidos: string;
}

export interface InformacionDeModulos
{
    modulos: InformacionDeModulo[],
    estilos: {[estructuraDeCapa:string]:string},
}

export interface InformacionDeModulo
{
    modulo: string;
    icono: string;
    modulo_formateado: string,
    dic_modulo: {[nombreDeGrupo:string]:string[]},
    capas_formateadas: {[nombreDeCapa:string]:string},
    grupos_formateados: {[nombreDeCapa:string]:string},
    tipos_geometria: {[nombreDeCapa:string]:TipoGeometriaWKT}
}

export interface ConfiguracionDeProyecto
{
    bbox: number[];
    datos_municipio: DatosMunicipio;
    geoserver: DatosGeoserver;
    icono: string;
    modulos: Modulo[];
    nombre: string;
}

export interface DatosMunicipio
{
    geometria: string;
    municipio: number;
    provincia: string;
    nombre: string;
    nombre_proj4: string;
    nombre_proyeccion: string;
    proyeccion: number;
}

interface DatosGeoserver
{
    layer: string;
    ruta: string;
}

interface Modulo extends Entidad
{
    grupos: Grupo[];
    icono: string;
}

interface Grupo extends Entidad
{
    capas: Capa[];
}

interface Capa extends Entidad
{
    tipo_geometria: "POINT"|"LINESTRING"|"POLYGON"|"MULTILINESTRING"|"MULTIPOLYGON",
    activo:boolean;
    configurado:boolean;
    capaWms:LeafletWms;
}

interface Entidad
{
    id: number;
    nombre: string;
    nombre_formateado: string;
}