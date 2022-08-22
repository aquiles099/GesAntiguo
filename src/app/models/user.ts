import {User as UserInterface} from "../interfaces/user";

interface AdminPermissions
{
    administrador:boolean;
    administrador_division:boolean;
    administrador_empresa:boolean;
}

interface ProjectPermissions
{
    "proyecto-id":number;
    "tipo-permiso": string;
    "gestion-energetica": boolean
    "gmao": boolean
    "tellink": boolean
    "uvax": boolean
}

export class User
{   
    public administrador: boolean;
    public administrador_empresa: boolean;
    public clave_sesion: string;
    public empresa: string;
    public id_empresa: number;
    public id_plugin: number;
    public nombre_usuario: string;
    public apellido: string;
    public email: string;
    public plugin: string;
    public usuario: string;
    public gmao: boolean;
    public icono_empresa: string;
    public telemedida: boolean;

    private adminPermissions:AdminPermissions = null;
    private projectPermissions:ProjectPermissions = null;

    constructor(data:UserInterface)
    {
        this.administrador = data.administrador;
        this.administrador_empresa = data.administrador_empresa;
        this.clave_sesion = data.clave_sesion;
        this.empresa = data.empresa;
        this.id_empresa = data.id_empresa;
        this.id_plugin = data.id_plugin;
        this.nombre_usuario = data.nombre_usuario;
        this.apellido = data.apellido;
        this.email = data.email;
        this.plugin = data.plugin;
        this.usuario = data.usuario;
        this.gmao = data.gmao;
        this.icono_empresa = data.icono_empresa;
        this.telemedida = data.telemedida;
    }

    get fullName():string
    {
        return `${this.nombre_usuario} ${this.apellido}`;
    }
    
    get fullNameInitials():string
    {
        return this.nombre_usuario.trim().split(" ")[0][0].toUpperCase() +
                this.apellido.trim().split(" ")[0][0].toUpperCase();
    }
    
    get pluginName():string
    {
        let name = "";

        switch(true)
        {
            case this.plugin === "SMART-GIS UNIC":
                name = "UNIC";
                break;

            case this.plugin === "Desarrollo":
                name = "MEDIUM";
                break;
        }

        return name;
    }
    
    public setAdminPermissions(permissions:AdminPermissions):void
    {
        this.adminPermissions = permissions;
    }
    
    get isAdmin():boolean
    {
        return this.isSuperAdmin || this.isCompanyAdmin;
    }

    get isSuperAdmin():boolean
    {
        return this.adminPermissions?.administrador;
    }
   
    get isDivisionAdmin():boolean
    {
        return this.adminPermissions?.administrador_division;
    }
  
    get isCompanyAdmin():boolean
    {
        return this.adminPermissions?.administrador_empresa;
    }
   
    public setProjectPermissions(permissions:ProjectPermissions):void
    {
        this.projectPermissions = permissions;
    }

    get permissionInProject():string
    {
        return this.hasProjectPermissions ? this.projectPermissions["tipo-permiso"] : null;
    }

    get hasProjectPermissions():boolean
    {
        return this.projectPermissions !== null;
    }
   
    get permissionProjectId():number
    {
        return this.hasProjectPermissions ? this.projectPermissions["proyecto-id"] : null;
    }
    
    public hasAccessToTheModule(module:string):boolean
    {
        return this.projectPermissions[module];
    }
}