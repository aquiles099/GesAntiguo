import { Injectable } from '@angular/core';
import { TellinkApiService } from '../../../../../medium/tellink-api.service';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ProjectService } from 'src/app/services/unic/project.service';

@Injectable()
export class LoginResolverService implements Resolve<Promise<void>>
{
  constructor(
    private _tellinkApiService:TellinkApiService,
    private router:Router,
    private _toastrService:ToastrService,
    private _projectService:ProjectService
  ) { }

  public async resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot):Promise<void>
  {
    try
    {
      if( ! this._tellinkApiService.isLoggedIn )
        await this._tellinkApiService.login();
    }
    catch(error)
    {
      this.router.navigateByUrl(`/medium/home/proyectos/${this._projectService.project.id_proyecto}`);
      this._toastrService.error(error.message, "Error");
    }
  }
}
