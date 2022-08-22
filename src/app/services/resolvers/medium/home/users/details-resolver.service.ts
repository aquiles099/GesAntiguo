import { Injectable } from '@angular/core';
import { UserService } from '../../../../medium/administration/user.service';
import { ToastrService } from 'ngx-toastr';
import { Router, ActivatedRouteSnapshot } from '@angular/router';

@Injectable()
export class DetailsResolverService {

  constructor(
    private _userService:UserService,
    private _toastrService:ToastrService,
    private router:Router
  ) { }

  public async resolve(route: ActivatedRouteSnapshot):Promise<any>
  {
    try
    {
      const id = route.params["id"];

      const user = this._userService.find(id);

      return user;
    }
    catch(error)
    {
      await this.router.navigateByUrl(`/medium/home/error-interno`);
      await this.router.navigateByUrl("/medium/home/usuarios");
      this._toastrService.error(error.message, "Error");
    }
  }
}
