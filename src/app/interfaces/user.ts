export interface User
{
    readonly administrador: boolean;
    readonly administrador_empresa: boolean;
    readonly clave_sesion: string;
    readonly empresa: string;
    readonly id_empresa: number;
    readonly id_plugin: number;
    readonly nombre_usuario: string;
    readonly apellido: string;
    readonly apellidos?: string;
    readonly email: string;
    readonly plugin: string;
    readonly usuario: string;
    readonly gmao: boolean;
    readonly icono_empresa: string;
    readonly telemedida: boolean;
}
