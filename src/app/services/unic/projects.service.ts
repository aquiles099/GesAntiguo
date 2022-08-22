import { Injectable } from '@angular/core';
import { AnalysisConfiguration } from '../../interfaces/analysis/analysis-chart-configuration';
import { BehaviorSubject, Observable } from 'rxjs';
import { Project } from '../../interfaces/project';
import { ApiService } from '../api.service';

@Injectable({
  providedIn: "root"
})
export class ProjectsService
{

  private projectsSubject:BehaviorSubject<Project[]>;
  public project$:Observable<Project[]>;

  private _isStarted:boolean = false;

  constructor(
    private _apiService:ApiService
  )
  {
    this.projectsSubject = new BehaviorSubject([]);
    this.project$ = this.projectsSubject.asObservable();
  }

  get isStarted():boolean
  {
    return this._isStarted;
  }

  get numberOfActiveProjects():number
  {
    return this.get()
              .filter(project => project.proyecto_activo)
              .length;
  }

  get numberOfFavoriteActiveProjects():number
  {
    return this.get()
              .filter(project => project.proyecto_activo && project.favorito)
              .length;
  }

  public next(projects:Project[]):void
  {
    this.projectsSubject.next(projects);

    if(! this._isStarted)
      this._isStarted = true;
  }

  public clear():void
  {
    this.next([]);
    this._isStarted = false;
  }

  public get():Project[]
  {
    return this.projectsSubject.getValue();
  }

  public async loadProjects():Promise<void>
  {
    const projects = (await this.all()).datos.proyectos;
    this.next(projects);
  }

  public all():Promise<any>
  {
    return this._apiService.postWithAuthentication({
      funcion: "web_home_proyectos"
    });
  }

  public getNewProjectInfo(): Promise<any>
  {    
    return this._apiService.postWithAuthentication({
      funcion: "web_nuevo_proyecto_informacion",
    });
  }

  public async delete(project:Project):Promise<void>
  {
    await this._apiService.postWithAuthentication({
      "funcion": "web_eliminar_proyecto",
      "id_proyecto": project.id_proyecto,
      "nombre_proyecto": project.nombre
    });

    const projects = this.get().filter(_project => _project.id_proyecto !== project.id_proyecto);
    
    this.next(projects);
  }
  
  public getMunicipalities(provinceCode:string): Promise<any>
  {    
    return this._apiService.postWithAuthentication({
      funcion: "web_nuevo_proyecto_municipios",
      provincia: provinceCode
    });
  }
  
  public async create(data:FormData): Promise<Project>
  {    
    const newProject = (await this._apiService.postWithAuthentication({
      funcion: "web_nuevo_proyecto_crear",
      nombre: data.get("name"),
      municipio: data.get("municipality"),
      grupos: data.getAll("groups[]") ?? [],
      extension: data.get("iconExtension"),
      icono: data.get("icon") 
    }) ).datos.proyecto;
    
    this.next([...this.get(), newProject]);

    return newProject;
  }

  public getAvailableProjections(id:number):Promise<any>
  {    
    return this._apiService.postWithAuthentication({
      funcion: "web_configurar_proyecto_proyeccion",
      id_proyecto: id
    });
  }

  public getProjectConfigurationInfo(id:number):Promise<any>
  {    
    return this._apiService.postWithAuthentication({
      funcion: "web_configurar_proyecto_informacion",
      id_proyecto: id
    });
  }

  /* ANALYSIS */

  public async getAnalisysChartsOptions(): Promise<any>
  {
    return this._apiService.postWithAuthentication({
      funcion: "informacion_analisis"
    });
  }
  
  public async getAnalisysConfigurationsList(projectId:number): Promise<any>
  {
    return this._apiService.postWithAuthentication({
      "funcion": "web_lista_configuracion_grafico",
      "proyecto": projectId 
    });
  }
 
  public async updateAnalisysConfigurationsList(projectId:number, configurations:Array<AnalysisConfiguration>): Promise<any>
  {
    return this._apiService.postWithAuthentication({
      "funcion": "web_actualizar_configuracion_grafico",
      "proyecto": projectId,
      "configuracion": configurations
    });
  }
  
  public async getAnalisysChartsData(data:object): Promise<any>
  {
    let _data = Object.assign({"funcion": "datos_analisis"}, data);

    return this._apiService.postWithAuthentication(_data);
  }

  /*  */

  public async consultarApi(data:object): Promise<any>
  {
    return this._apiService.postWithAuthentication(data);
  }
}
