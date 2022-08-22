import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { ApiService } from '../../../../api.service';
import { ToastrService } from 'ngx-toastr';
import { ProjectService } from '../../../../unic/project.service';

@Injectable()
export class DetailsResolverService implements Resolve<Promise<any>>
{
  constructor(
    private _apiService:ApiService,
    private _toastrService:ToastrService,
    private _projectService:ProjectService,
    private router:Router
  ) { }

  public async resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot):Promise<any>
  {
    let project = this._projectService.project;

    try
    {
      const details = (await  this._apiService.postWithAuthentication({
        funcion: 'web_informacion_proyecto',
        proyecto: project.nombre
      })).datos;
            
      return { project, details };
    }
    catch(error) 
    {
      await this.router.navigateByUrl(`/medium/home/proyectos/${project.id_proyecto}`);
      this._toastrService.error(error.message, "Error");
    }
  }
}
