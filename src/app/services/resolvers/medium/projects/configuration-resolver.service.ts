import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ApiService } from '../../../api.service';

@Injectable()
export class ConfigurationResolverService implements Resolve<Promise<any>>
{
  constructor(
    private _apiService:ApiService,
    private _toastrService:ToastrService,
    private router:Router
  ) { }

  public async resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot):Promise<any>
  {
    let projectId = route.parent.params["id"];

    try
    {      
      return (await this._apiService.postWithAuthentication({
        funcion: "web_configurar_proyecto_proyeccion",
        id_proyecto: projectId
      })).datos.capas;
    }
    catch(error)
    {
      await this.router.navigateByUrl("/medium/home/error-interno");
      await this.router.navigateByUrl(`/medium/home/proyectos/${projectId}/acciones`);
      this._toastrService.error(error.message, "Error");
    }
  }
}
