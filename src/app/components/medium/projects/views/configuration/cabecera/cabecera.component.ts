import { Component, OnInit } from '@angular/core';
import { User } from 'src/app/models/user';
import { fadeInOnEnterAnimation, fadeOutOnLeaveAnimation } from 'angular-animations';
import { Router } from '@angular/router';
import { ShepherdService } from 'angular-shepherd';
import { Project } from 'src/app/interfaces/project';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { AuthenticatedUserService } from 'src/app/services/authenticated-user.service';
import { ProjectService } from '../../../../../../services/unic/project.service';
import { ProjectsService } from 'src/app/services/unic/projects.service';

@Component({
  selector: 'cabecera-de-mapa',
  templateUrl: './cabecera.component.html',
  styleUrls: ['./cabecera.component.css'],
  animations:[
    fadeInOnEnterAnimation({duration: 250}),
    fadeOutOnLeaveAnimation({duration: 250})
  ]
})
export class CabeceraComponent implements OnInit
{
  public logoutWindowIsVisible: boolean = false;
  public itsOnTheLogoutWindow: boolean = false;

  public projects:Project[] = [];

  public project:Project;

  constructor(
    private _authenticationService:AuthenticationService,
    private _authenticatedUserService:AuthenticatedUserService,
    private _projectService:ProjectService,
    private _projectsService:ProjectsService,
    private _router:Router,
    private _shepherdService:ShepherdService
  )
  {}

  get user():User
  {
    return this._authenticatedUserService.user;
  }

  get tourIsActive():boolean
  {
    return this._shepherdService.isActive;
  }

  public async ngOnInit():Promise<void>
  {
    this.projects = this._projectsService.get();
    this.project = this._projectService.project;
  }

  public async changeProject(id:number):Promise<void>
  {    
    try
    {
      this._projectService.clear();
  
      let url = this._router.url.includes("configuracion") ? 
      `/medium/proyectos/${id}/configuracion` :
      `/medium/proyectos/${id}/mapa`;
  
      await this._router.navigateByUrl(url);

      this.project = this.projects.find(project => project.id_proyecto === id);
    }
    finally
    {

    }
  }

  public logout(): void
  {
    this._authenticationService.logout();
  }

  public showLogoutWindow():void 
  {
    this.logoutWindowIsVisible = true;
  }

  public hideLogoutWindowAutomatically():void 
  {
    setTimeout(() => {

      if( ! this.itsOnTheLogoutWindow )
        this.hideLogoutWindow();

    }, 3000);
  }

  public overTheLogoutWindow():void 
  {
    this.itsOnTheLogoutWindow = true;
  }

  public hideLogoutWindow():void 
  {
    this.logoutWindowIsVisible = false;
    this.itsOnTheLogoutWindow = false;
  }
}
