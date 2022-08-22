import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CrudService } from './crud-service';
import { AuthenticationService } from '../../authentication.service';

@Injectable()
export class UserService extends CrudService
{
  constructor(
    protected httpClient: HttpClient,
    protected _authenticationService: AuthenticationService
  )
  {
    super(
      httpClient,
      _authenticationService,
      "usuarios"
    );
  }
}
