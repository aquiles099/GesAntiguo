import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { AuthenticationService } from '../authentication.service';
import { ToastrService } from 'ngx-toastr';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { SpinnerService } from '../spinner.service';

@Injectable({
  providedIn: "root"
})
export class AuthenticatedUserDataResolverService implements Resolve<Promise<void>>
{
  constructor(
    private _authenticationService:AuthenticationService,
    private _toastrService:ToastrService,
    private _spinnerService:SpinnerService,
    private http:HttpClient
  ) { }

  public async resolve(route: ActivatedRouteSnapshot): Promise<void>
  { 
    try
    {     
      if( this._authenticationService.authenticatedUser.pluginName !== "UNIC" )
      {
        this._authenticationService.authenticatedUserData = (
          await this.http.get<any>(`${environment.administrationApi}/usuario-autenticado`, {
              headers: this._authenticationService.getBasicAuthenticationHeader()
          }).toPromise()
        ).data;
      }

    }
    catch(error)
    {
      this._authenticationService.logout();
      this._toastrService.error("Datos de usuario autenticado no han podido ser cargados.","Error");
      this._spinnerService.hide();
    }
  }
}
