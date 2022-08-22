import { Injectable } from '@angular/core';
import { AuthenticatedUserService } from './authenticated-user.service';
import { Router } from '@angular/router';
import { ProjectsService } from './unic/projects.service';
import { User } from '../models/user';
import { ProjectService } from './unic/project.service';
import { HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService
{
  
  // PROVISIONAL
  private usersWithRestrictedPermissions:string[] = [
    "vpardo",
    "tmontesinos",
    "yzaragoza@monrabal.net"
  ]; 

  public authenticatedUserData:any;
  
  constructor(
    private _authenticatedUserService: AuthenticatedUserService,
    private _projectsService:ProjectsService,
    private _projectService:ProjectService,
    private router:Router
  ) { }

  // PROVISIONAL
  get authenticatedUsersHasRestrictedPermissions():boolean
  {
    return this.usersWithRestrictedPermissions.includes( this._authenticatedUserService.user.usuario );
  }

  get authenticatedUser():User
  {
    return this._authenticatedUserService.user;
  }
 
  public getBasicAuthenticationHeader():HttpHeaders
  {
    return new HttpHeaders({
      "Authorization": `Basic ${btoa(
        this.authenticatedUser.usuario + ":" +
        this.authenticatedUser.clave_sesion
      )}`
    });
  }
 
  public async logout():Promise<boolean>
  {    
    try{

      // borrar listado de proyectos de usuario autenticado.
      this._projectsService.clear();
      // borrar ultimo proyecto cargado.
      this._projectService.clear();
      // borrar usuario autenticado.
      this._authenticatedUserService.clear();

      return this.router.navigateByUrl("login");
    }
    catch(error)
    {
      throw error;
    }
  }

}
