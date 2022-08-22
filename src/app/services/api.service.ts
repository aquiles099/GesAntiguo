import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { AuthenticatedUserService } from './authenticated-user.service';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiService
{
  private headers = new HttpHeaders({
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
  });

  private paramsFormatter:(data:{[key:string]:string|number}) => string = 
  params =>  'datos='+ encodeURIComponent( JSON.stringify(params) );

  constructor(
    private http: HttpClient,
    private _authenticatedUserService:AuthenticatedUserService
  )
  {
  }

  private getRequiredParams(options = {
    business: false
  }):Object
  {
    let params = {
      tipo: "web",
      usuario: this._authenticatedUserService.user.usuario,
      clave_sesion: this._authenticatedUserService.user.clave_sesion,
      plugin: this._authenticatedUserService.user.plugin
    };

    if( options.business )
      Object.assign(params, {id_empresa: this._authenticatedUserService.user.id_empresa});
        
    return params;
  };

  private getRequiredParamsForNewApi():Object
  {
    let params = {
      herramienta: "web",
      token: this._authenticatedUserService.user.clave_sesion
    };

    return params;
  };

  public async postNewApi(url:string, data:Object, authentication:boolean = true): Promise<any>
  {
    if( authentication )
      Object.assign(data, this.getRequiredParamsForNewApi());

    return this._post(data, url);
  }

  public async post(data:any, url?:string): Promise<any>
  {
    return this._post(data, url);
  }

  public async postWithAuthentication(data:object, adittionalOptions?:any): Promise<any>
  {
    const _data = this.getRequiredParams(adittionalOptions);

    Object.assign(_data, data);

    return this._post(_data);
  }

  private async _post(data:any, url?:string):Promise<any>
  {
    const apiUrl = url ? `${environment.baseUrl}${environment.apiFolder}/${url}` : environment.apiUrl;

    return this.http
      .post<any>(apiUrl, this.paramsFormatter(data), {headers: this.headers})
      .pipe(
        map(data => {
          
          if( data.error)
          {
            const error = new Error(data.msg_error);
            console.error(error);
            throw error;
          }
          return data;
        })
      )
      .toPromise();
  }
}
