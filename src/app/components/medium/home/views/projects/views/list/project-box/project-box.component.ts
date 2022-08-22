import { Component, Input } from '@angular/core';
import { fadeInOnEnterAnimation, fadeOutOnLeaveAnimation } from 'angular-animations';
import { ToastrService } from 'ngx-toastr';
import { ShepherdService } from 'angular-shepherd';
import { getTimeDiff } from '../../../../../../../../shared/helpers';
import { ApiService } from '../../../../../../../../services/api.service';
import { Project } from '../../../../../../../../interfaces/project';
import { Router } from '@angular/router';

const ANIMATION_DURATION = 250;

@Component({
  selector: 'project-box',
  templateUrl: './project-box.component.html',
  styleUrls: ['./project-box.component.css'],
  animations: [
    fadeInOnEnterAnimation({duration: ANIMATION_DURATION}),
    fadeOutOnLeaveAnimation({duration: ANIMATION_DURATION})
  ]
})
export class ProjectBoxComponent {

  @Input()
  public project:Project;

  public badgeColors: string[] = [
    "#0A8A3D",
    "#6E63C8",
    "#FFF"
  ];

  public sendingRequest:boolean = false;

  constructor(
    private _apiService:ApiService,
    private _toastrService: ToastrService,
    private _shepherdService:ShepherdService,
    private router:Router
  ) { }

  get tourIsActive():boolean
  {
    return this._shepherdService.isActive;
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

    let label = "";

    switch( true )
    {
      case diffInHours < 1:
        const diffInMinutes = getTimeDiff( new Date(lastAccessDate), new Date, "minute");
        label = diffInMinutes < 3 ? "Hace un momento." : `Hace ${diffInMinutes} minutos.`
        break;
      case diffInHours >= 1 && diffInHours < 24:
        label = diffInHours === 1 ? `Hace una hora.` : `Hace ${diffInHours} horas.`;
        break;
      case diffInHours >= 24 && diffInHours <= 96:
        const resultInDays = getTimeDiff( new Date(lastAccessDate), new Date, "day");
        label = resultInDays === 1 ? `Hace un dia.` : `Hace ${resultInDays} dias.`;
        break;
      case diffInHours > 96:
        const date = new Date(lastAccessDate);
        label = `${date.getDate() < 10 ? "0" + date.getDate() : date.getDate()}/${(date.getMonth() < 9 ? "0" : "") + (date.getMonth() + 1)}/${date.getFullYear()}`;
        break;  
    }
    
    return label;
  }
 
  public async toggleFavoriteState():Promise<void>
  {
    try
    {  
      if( this.sendingRequest || this.tourIsActive )
        return;

      this.sendingRequest = true;

      await this._apiService.postWithAuthentication({ 
        funcion: 'web_modificar_favorito',
        favorito: ! this.project.favorito,
        proyecto: this.project.nombre
      });

      this.project.favorito = ! this.project.favorito;
    }
    catch (error)
    {
      this._toastrService.error(error.message, "Error.");
    }
    finally
    {
      this.sendingRequest = false;
    }
  }

  public goToActions():void
  {
    if( this.sendingRequest || this.tourIsActive )
      return;

    this.router.navigateByUrl(`/medium/home/proyectos/${this.project.id_proyecto}/acciones`);
  }
}
