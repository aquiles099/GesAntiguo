import { Injectable } from '@angular/core';
import { CrudService } from './crud-service';
import { HttpClient } from '@angular/common/http';
import { AuthenticationService } from '../../authentication.service';

@Injectable()
export class ProfileService extends CrudService
{
  constructor(
    protected httpClient: HttpClient,
    protected _authenticationService: AuthenticationService
  )
  {
    super(
      httpClient,
      _authenticationService,
      "perfil"
    );
  }

  public async updateUser(id:number, data:FormData):Promise<any>
  {
    try
    {
      return ( 
        await this.httpClient.post<any>(`${this.baseUrl}/${id}/actualizar-datos-de-usuario`,
        data,
        {
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
