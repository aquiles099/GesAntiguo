import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CrudService } from './crud-service';
import { AuthenticationService } from '../../authentication.service';

@Injectable()
export class PermissionManagementService extends CrudService {

  constructor(
    protected httpClient: HttpClient,
    protected _authenticationService: AuthenticationService
  ) {
    super(
      httpClient,
      _authenticationService,
      "proyectos"
    );
  }

  public async getDataForPermissionsManagement(id:number): Promise<any> {
    try {
      let headers = this._authenticationService.getBasicAuthenticationHeader()

      return (
        await this.httpClient.get<any>(`${this.baseUrl}/${id}/gestion-de-permisos`, {
          headers
        }).toPromise()
      ).data;

    }
    catch (error) {
      console.error(error.message);
      throw error;
    }
  }

}
