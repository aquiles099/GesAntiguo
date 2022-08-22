import { Component, Output, EventEmitter, Input, OnInit, OnDestroy } from '@angular/core';
import { User } from 'src/app/models/user';
import { Project } from '../../../../../interfaces/project';
import { AuthenticatedUserService } from '../../../../../services/authenticated-user.service';
import { ProjectService } from '../../../../../services/unic/project.service';
import { fadeInOnEnterAnimation, fadeOutOnLeaveAnimation } from 'angular-animations';
import { AuthenticationService } from '../../../../../services/authentication.service';
import { ProjectsService } from '../../../../../services/unic/projects.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ShepherdService } from 'angular-shepherd';

@Component({
  selector: 'map-header',
  templateUrl: './map-header.component.html',
  styleUrls: ['./map-header.component.css'],
  animations:[
    fadeInOnEnterAnimation({duration: 250}),
    fadeOutOnLeaveAnimation({duration: 250})
  ]
})
export class MapHeaderComponent implements OnInit, OnDestroy
{
  @Input()
  public exportOptionsEnabled:boolean = true;

  @Input()
  public disableButtons:boolean = false;

  @Output()
  public toggleFeaturePdfTemplateConfigurationToolVisibility:EventEmitter<string> = new EventEmitter;

  @Output()
  public togglePlanimetrySectionVisibility:EventEmitter<void> = new EventEmitter;

  @Output()
  public toggleLayerFileExportSectionVisibility:EventEmitter<void> = new EventEmitter;

  @Output()
  public showHelp:EventEmitter<void> = new EventEmitter;

  public logoutWindowIsVisible: boolean = false;
  public itsOnTheLogoutWindow: boolean = false;

  public projects:Project[] = [];

  public project:Project;
  private projectServiceSubscription:Subscription;

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
    this.projectServiceSubscription = this._projectService.projectObservable.subscribe(project => this.project = project);
  }

  public async changeProject(id:number):Promise<void>
  {
    const project = this.projects.find(project => project.id_proyecto === id);

    await this._projectService.next(project);

    let url;

    switch( this.user.pluginName )
    {
      case "UNIC":
        url = this._router.url.includes("configuracion") ? 
        `/unic/proyectos/${id}/configuracion` :
        `/unic/proyectos/${id}/mapa`;
        break;
        
      case "MEDIUM":
        url = this._router.url.includes("configuracion") ? 
        `/medium/proyectos/${id}/configuracion` :
        `/medium/proyectos/${id}/mapa`;
        break;
    }

    this._router.navigateByUrl(url);
  }

  public backToHome():void
  {
    let url;

    switch( this.user.pluginName )
    {
      case "UNIC":
        url = `/unic/home`;
        break;

      case "MEDIUM":
        url = `/medium/home/proyectos/${this.project.id_proyecto}/acciones`;
        break;
    }

    this._router.navigateByUrl(url);
  }

  public logout(): void
  {
    this._authenticationService.logout();
  }

  public toggleFeaturePdfTemplateConfigurationToolVisibilityEvent(type:"sheet"|"listing"):void
  {
    this.toggleFeaturePdfTemplateConfigurationToolVisibility.emit(type);
  }

  public togglePlanimetrySectionVisibilityEvent():void
  {
    this.togglePlanimetrySectionVisibility.emit();
  }

  public toggleLayerFileExportSectionVisibilityEvent():void
  {
    this.toggleLayerFileExportSectionVisibility.emit();
  }

  public showHelpEvent():void
  {
    this.showHelp.emit();
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

  public ngOnDestroy():void
  {
    if( this.projectServiceSubscription )
      this.projectServiceSubscription.unsubscribe();
  }
}
