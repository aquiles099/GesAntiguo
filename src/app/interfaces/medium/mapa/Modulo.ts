import { TileLayer } from 'leaflet';
import LeafletWms from "leaflet.wms";

interface InformacionDeEntidadDeMapa
{
    nombre: string;
    nombre_formateado: string;
    proyectado: boolean;
}

export interface Modulo extends InformacionDeEntidadDeMapa
{
    grupos: Array<Grupo>;
}

export interface Grupo extends InformacionDeEntidadDeMapa
{
    capas: Array<Capa>;
}

export interface Capa extends InformacionDeEntidadDeMapa
{
    modulo:string;
    grupo:string;
    capaWms?: LeafletWms.overlay;
    filtro_capa: string;
    tipo_geometria: TipoGeometriaWKT;
    estilo_por_defecto: string;
    leyenda?: string;
    refrescar?: () => void;
    obtenerFiltro?: () => {[atributo:string]:Array<string|number>};
}

export type TipoGeometriaWKT = "POINT" | "LINESTRING" | "POLYGON" | "MULTILINESTRING" | "MULTIPOLYGON";
