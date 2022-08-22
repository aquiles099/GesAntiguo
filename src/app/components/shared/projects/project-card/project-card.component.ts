import { Component, Input, EventEmitter, Output, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { ProjectService } from '../../../../services/unic/project.service';
import { fadeInOnEnterAnimation, fadeOutOnLeaveAnimation } from 'angular-animations';
import { AuthenticatedUserService } from '../../../../services/authenticated-user.service';
import { Project } from '../../../../interfaces/project';
import { ProjectsService } from '../../../../services/unic/projects.service';
import { ToastrService } from 'ngx-toastr';
import { getTimeDiff } from '../../../../shared/helpers';
import { ShepherdService } from 'angular-shepherd';
import { AuthenticationService } from '../../../../services/authentication.service';

const ANIMATION_DURATION = 250;

export interface ProjectAction
{
  name:string;
  project:Project;
}

interface ProjectOption
{
  label:string;
  iconUrl:string;
  action:string;
}

@Component({
  selector: 'project-card',
  templateUrl: './project-card.component.html',
  styleUrls: ['./project-card.component.css'],
  animations: [
    fadeInOnEnterAnimation({duration: ANIMATION_DURATION}),
    fadeOutOnLeaveAnimation({duration: ANIMATION_DURATION})
  ]
})
export class ProjectCardComponent {

  @Input()
  public project: any;

  @Output()
  public deleteProject:EventEmitter<Project> = new EventEmitter;

  @Output()
  public performProjectAction:EventEmitter<ProjectAction> = new EventEmitter;

  @ViewChild("optionsListContainer")
  public optionsListContainer:ElementRef<HTMLElement>;

  public badgeColors: string[] = [
    "#0A8A3D",
    "#6E63C8",
    "#FFF"
  ];

  public options:ProjectOption[] = [
    {
      label: "Abrir proyecto",   
      iconUrl: "assets/icons/SVG/EDITAR.svg",   
      action: "open"   
    },
    {
      label: "Informacíon de proyecto",   
      iconUrl: "assets/icons/SVG/LISTA.svg",   
      action: "details"   
    },
    {
      label: "Configurar proyecto",   
      iconUrl: "assets/icons/SVG/AJUSTES.svg",   
      action: "configuration"   
    },
    {
      label: "Configurar atributos",   
      iconUrl: "assets/icons/SVG/AJUSTES.svg",   
      action: "attributesConfiguration"   
    },
    {
      label: "Eliminar",   
      iconUrl: "assets/icons/SVG/PAPEPERA.svg",   
      action: "delete"   
    }
  ];

  public sendingRequest:boolean = false;

  constructor(
    private router: Router,
    private _projectService: ProjectService,
    private _projectsService: ProjectsService,
    private _toastrService: ToastrService,
    private _authenticatedUserService:AuthenticatedUserService,
    private _authenticationService:AuthenticationService,
    private _shepherdService:ShepherdService
  ) { }

  get tourIsActive():boolean
  {
    return this._shepherdService.isActive;
  }

  public ngOnInit():void
  {
    if (this._authenticatedUserService.user.pluginName === "MEDIUM")
    {
      this.options = [
        ...this.options.slice(0, this.options.length - 1),
        {
          label: "Gestionar permisos",   
          iconUrl: "assets/icons/SVG/AJUSTES.svg",   
          action: "permissionManagement"   
        },
        this.options[this.options.length - 1]
      ];
    }

    // PROVISIONAL
    if( this._authenticationService.authenticatedUsersHasRestrictedPermissions )
      this.options = this.options.filter(option => option.action === "open" || option.action === "details");

  }

  get inGisSmartUnic():boolean
  {
    return this._authenticatedUserService.user.pluginName === "UNIC";
  }

  get inNewHome():boolean
  {
    return this.router.url.includes("medium");
  }

  public getUserNameInitials(fullName: string): string {
    return fullName.split(" ").map(name => name[0]?.toUpperCase()).join("");
  }

  public onLoadProjectImage(imgContainer:HTMLElement, spinnerContainer:HTMLElement):void
  {
    spinnerContainer.remove();
    imgContainer.classList.remove("d-none");
  }

  public getLastAccess(lastAccessDate:string):string
  {
    const diffInHours = getTimeDiff( new Date(lastAccessDate), new Date, "hour");

    let tag = "";

    switch( true )
    {
      case diffInHours < 1:
        const diffInMinutes = getTimeDiff( new Date(lastAccessDate), new Date, "minute");
        tag = diffInMinutes < 3 ? "Hace un momento." : `Hace ${diffInMinutes} minutos.`
        break;
      case diffInHours >= 1 && diffInHours < 24:
        tag = diffInHours === 1 ? `Hace una hora.` : `Hace ${diffInHours} horas.`;
        break;
      case diffInHours >= 24 && diffInHours <= 96:
        const resultInDays = getTimeDiff( new Date(lastAccessDate), new Date, "day");
        tag = resultInDays === 1 ? `Hace un dia.` : `Hace ${resultInDays} dias.`;
        break;
      case diffInHours > 96:
        const date = new Date(lastAccessDate);
        tag = `${date.getDate() < 10 ? "0" + date.getDate() : date.getDate()}/${(date.getMonth() < 9 ? "0" : "") + (date.getMonth() + 1)}/${date.getFullYear()}`;
        break;
        
    }
    
    return tag;
  }

  public toggleOptionsListVisibility():void
  {
    if( this.tourIsActive )
      return;

    if( this.optionsListContainer.nativeElement.classList.contains('d-block') )
    {
      this.optionsListContainer.nativeElement.classList.remove('d-block');
      this.optionsListContainer.nativeElement.classList.add('d-none');
    }
    else
    {
      this.optionsListContainer.nativeElement.classList.remove('d-none');
      this.optionsListContainer.nativeElement.classList.add('d-block');
    }
  }

  public hideOptionsList():void
  {
    this.optionsListContainer?.nativeElement.classList.remove('d-block');
    this.optionsListContainer?.nativeElement.classList.add('d-none');
  }
  
  public async toggleFavoriteState(project:Project):Promise<void>
  {
    try
    {  
      if( this.sendingRequest || this.tourIsActive )
        return;

      this.sendingRequest = true;

      await this._projectsService.consultarApi({ 
        funcion: 'web_modificar_favorito',
        favorito: ! project.favorito,
        proyecto: project.nombre
      });

      project.favorito = ! project.favorito;
      this.sendingRequest = false;
    }
    catch (error)
    {
      this._toastrService.error(error.message, "Error.");
      this.sendingRequest = false;
    }
  }

  public projectActionEvent(project: Project, action: string): void
  {
    if( this.tourIsActive )
      return;

    if(action !== "delete")
      this._projectService.next(project);

    this.getActions(project)[action]();
  }

  private getActions(project:Project):{[action:string]:() => any}
  {
    let actions;

    switch( this._authenticatedUserService.user.pluginName )
    {
      case "UNIC":
        actions = {
          "open": () => this.router.navigate([`/unic/proyectos/${project.id_proyecto}/mapa`]),
          "configuration": () => this.router.navigate([`/unic/proyectos/${project.id_proyecto}/configuracion`]),
          "details": () => this.router.navigate([`/unic/home/proyectos/${project.id_proyecto}/informacion`]),
          "attributesConfiguration": () => this.router.navigate([`/unic/home/proyectos/${project.id_proyecto}/configuracion-de-atributos`]),
          "delete": () => this.performProjectAction.emit({name: "delete", project: project})
        };  
        break;
      
      case "MEDIUM":
        actions = {
          "open": () => this.router.navigate([`/medium/proyectos/${project.id_proyecto}/mapa`]),
          "configuration": () => this.router.navigate([`${this.router.url.includes("medium") ? 'medium' : '/medium'}/proyectos/${project.id_proyecto}/configuracion`]),
          "details": () => this.router.url.includes("medium") ? this.router.navigate([`/medium/proyectos/${project.id_proyecto}`]) :  this.performProjectAction.emit({name: "details", project: project}),
          "attributesConfiguration": () => this.router.url.includes("medium") ? this.router.navigate([`/medium/proyectos/${project.id_proyecto}/configuracion-de-atributos`]) :  this.performProjectAction.emit({name: "attributesConfiguration", project: project}),
          "permissionManagement": () => this.router.url.includes("medium") ? this.router.navigate([`/medium/proyectos/${project.id_proyecto}/gestion-de-permisos`]) :  this.performProjectAction.emit({name: "permissionManagement", project: project}),
          "delete": () => this.performProjectAction.emit({name: "delete", project: project})
        };  
        break;
    }

    return actions;
  }
}
