export interface ProteccionCentroMando
{
    cantidad:number;
    estado: string;
    id_proteccion_centro_mando?: string;
    intensidad: string;
    intensidad_nominal: string;
    intensidad_maxima: string;
    marca: string;
    observacion: string;
    polaridad: string;
    rearmable: boolean;
    subtipo: string;
    sensibilidad: string;
    tipo:string;
    tension_corte: string;
}

export interface Circuito
{
    id_circuito:string;
    centro_mando:string;
    nombre:string;
    tipo:string;
    tipo_conductor:string;
    seccion:string;
    tipo_canalizacion:string;
    manual_automatico:boolean;
    observaciones:string;
    alta:boolean;
    usuario_alta:string;
    fecha_alta:string;
    modificado:boolean;
    usuario_modificado:string;
    fecha_modificado:string;
    herramienta:string;
    temporal:string;
    protecciones?:ProteccionCircuito[];
}

export interface ProteccionCircuito
{
    cantidad:number;
    circuito: string;
    estado: string;
    id_proteccion_circuito: string;
    intensidad: string;
    marca: string;
    observacion: string;
    polaridad: string;
    rearmable: boolean;
    sensibilidad: string;
    tipo: string;
}
