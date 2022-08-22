import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ApiService } from '../../../api.service';
import { AuthenticatedUserService } from '../../../authenticated-user.service';

@Injectable()
export class UserPermissionsInProjectResolverService implements Resolve<Promise<void>>
{
  constructor(
    private _authenticatedUserService:AuthenticatedUserService,
    private _apiService:ApiService,
    private router:Router,
    private _toastrService:ToastrService,
  ) { }

  public async resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot):Promise<void>
  {
    try
    {
      let permissions = null;

      if( 
        ! this._authenticatedUserService.user.hasProjectPermissions ||
        this._authenticatedUserService.user.permissionProjectId != route.params["id"] 
        )
      {
        permissions = (await this._apiService.post({
          "herramienta": "web",
          "id_proyecto": route.params["id"],
          "token": this._authenticatedUserService.user.clave_sesion
        }, "permisos/usuario-proyecto.py")).datos;
  
        Object.assign(permissions,{"proyecto-id": route.params["id"]});
        
        this._authenticatedUserService.user.setProjectPermissions(permissions);
      }
      
      return permissions;
    }
    catch(error)
    {
      this._toastrService.error(error.message, "Error");
      this.router.navigateByUrl(`/medium/home`);
    }
  }
}
