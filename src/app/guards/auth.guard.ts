import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree
} from '@angular/router';
import { Observable } from 'rxjs';
import { AuthenticatedUserService } from '../services/authenticated-user.service';
import { AuthenticationService } from '../services/authentication.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate
{

  constructor(
    private _authenticatedUserService:AuthenticatedUserService,
    private _authenticationService:AuthenticationService     
  ){}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {

    const userIsAuthenticated = this.checkIfTheUserIsAuthenticated();

    if ( ! userIsAuthenticated )
      this._authenticationService.logout();

    return userIsAuthenticated;
  }

  private checkIfTheUserIsAuthenticated():boolean
  {
    return sessionStorage.getItem('usuario') !== null || this._authenticatedUserService.isLoggedIn;
  }
}
