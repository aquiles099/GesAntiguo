import { Injectable } from '@angular/core';
import { UvaxApiService } from '../../../../../medium/uvax-api.service';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot, Router } from '@angular/router';

@Injectable()
export class LoginResolverService implements Resolve<Promise<void>>
{
  constructor(
    private _uvaxApiService:UvaxApiService,
    private router:Router
  ) { }

  public async resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot):Promise<void>
  {
    const findProjectInRoute = (_route:ActivatedRouteSnapshot) => _route.data["project"] || findProjectInRoute(_route.parent);

    let project = findProjectInRoute(route);
    
    try
    {
      if( ! this._uvaxApiService.isLoggedIn )
        await this._uvaxApiService.login();
    }
    catch(error)
    {
      this.router.navigateByUrl(`/medium/home/proyectos/${project.id_proyecto}/acciones`);
    }
  }
}
