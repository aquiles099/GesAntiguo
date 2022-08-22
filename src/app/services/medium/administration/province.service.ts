import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CrudService } from './crud-service';
import { AuthenticationService } from '../../authentication.service';

@Injectable()
export class ProvinceService extends CrudService
{
  constructor(
    protected httpClient: HttpClient,
    protected _authenticationService: AuthenticationService
  )
  {
    super(
      httpClient,
      _authenticationService,
      "provincias"
    );
  }

  public async getMunicipalitiesByProvince(id:number):Promise<any[]>
  {
    try
    {
      return ( 
        await this.httpClient.get<any>(`${this.baseUrl}/${id}/municipios`, {
          headers: this._authenticationService.getBasicAuthenticationHeader()
        }).toPromise()
      ).data;
    
    }
    catch (error)
    {
      console.error(error.message);
      throw error;
    }
  }
}
