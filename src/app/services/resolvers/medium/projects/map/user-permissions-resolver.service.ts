import { Injectable } from '@angular/core';
import { Resolve, Router, RouterStateSnapshot, ActivatedRouteSnapshot } from '@angular/router';
import { ApiService } from '../../../../api.service';
import { ToastrService } from 'ngx-toastr';

@Injectable()
export class UserPermissionsResolverService implements Resolve<Promise<any>>{

  constructor(
    private _apiService:ApiService,
    private _toastrService:ToastrService,
    private router:Router
  ) { }

  public async resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot):Promise<any>
  {
    try
    {
      const projectId = route.params["id"];

      return (await  this._apiService.postWithAuthentication({
        funcion: 'web_obtener_permisos_de_usuario_autenticado',
        proyecto_id: projectId
      })).datos;

    }
    catch(error)
    {
      this.router.navigateByUrl("/medium");
      this._toastrService.error(error.message, "Error");
    }
  }
}
