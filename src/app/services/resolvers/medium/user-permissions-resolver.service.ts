import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthenticationService } from '../../authentication.service';
import { ApiService } from '../../api.service';

@Injectable({
  providedIn: "root"
})
export class UserPermissionsResolverService implements Resolve<Promise<void>>
{
  constructor(
    private _authenticationService:AuthenticationService,
    private _apiService:ApiService,
    private _toastrService:ToastrService,
  ) { }

  public async resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot):Promise<void>
  {
    try
    {
      const permissions = (await this._apiService.post({
        "herramienta": "web",
        "token": this._authenticationService.authenticatedUser.clave_sesion
      }, "permisos/usuario.py")).datos;

      this._authenticationService.authenticatedUser.setAdminPermissions(permissions);

      return permissions;
    }
    catch(error)
    {
      this._toastrService.error(error.message, "Error");
      this._authenticationService.logout();
    }
  }
}
