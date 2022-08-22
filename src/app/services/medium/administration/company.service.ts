import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CrudService } from './crud-service';
import { AuthenticationService } from '../../authentication.service';

@Injectable()
export class CompanyService extends CrudService
{
  constructor(
    protected httpClient: HttpClient,
    protected _authenticationService: AuthenticationService
  )
  {
    super(
      httpClient,
      _authenticationService,
      "empresas"
    );
  }
  
  public async getUsersOfAutenticatedUserCompany():Promise<any>
  {
    try
    {
      let headers = this._authenticationService.getBasicAuthenticationHeader()

      return ( 
        await this.httpClient.get<any>(`${this.baseUrl}/usuarios`,{
          headers
        }).toPromise()
      ).data;
    
    }
    catch (error)
    {
      console.error(error.message);
      throw error;
    }
  }   
  
  public async getUsers(id:number):Promise<any>
  {
    try
    {
      let headers = this._authenticationService.getBasicAuthenticationHeader()

      return ( 
        await this.httpClient.get<any>(`${this.baseUrl}/${id}/usuarios`,{
          headers
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
