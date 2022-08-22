import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { ApiService } from '../../../../api.service';
import { ProjectsService } from '../../../../unic/projects.service';
import { ToastrService } from 'ngx-toastr';

@Injectable()
export class DetailsResolverService implements Resolve<Promise<any>>
{
  constructor(
    private _projectsService:ProjectsService,
    private _apiService:ApiService,
    private _toastrService:ToastrService,
    private router:Router
  ) { }

  public async resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot):Promise<any>
  {
    try
    {
      const projectId = route.params["id"];

      const project = this._projectsService.get().find(project => project.id_proyecto == projectId);
      
      if( ! project )
        throw new Error("El proyecto no ha podido ser ubicado.");

      const adittionalInfo = (await  this._apiService.postWithAuthentication({
        funcion: 'web_configurar_proyecto_informacion',
        id_proyecto: project.id_proyecto
      })).datos;

      return { project, adittionalInfo };
    }
    catch(error)
    {
      this.router.navigateByUrl("/unic");
      this._toastrService.error(error.message, "Error");
    }
  }
}
