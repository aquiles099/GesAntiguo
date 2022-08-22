import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, Router } from '@angular/router';
import { CommandCenter } from '../../../../../../../../interfaces/medium/tellink/command-center';
import { ToastrService } from 'ngx-toastr';
import { TellinkApiService } from '../../../../../../../medium/tellink-api.service';

@Injectable()
export class DetailsResolverService implements Resolve<Promise<CommandCenter>>
{
  constructor(
    private _tellinkApiService:TellinkApiService,
    private _toastrService:ToastrService,
    private router:Router
  ) { }

  public async resolve(route:ActivatedRouteSnapshot):Promise<any>
  {
    try
    {
      const id = route.params["id"];
      return await this._tellinkApiService.findOperation(id);
    }
    catch(error)
    {
      let redirectionRoute = this.router.url;
      await this.router.navigateByUrl("medium/home/error-interno");
      await this.router.navigateByUrl( redirectionRoute );
      this._toastrService.error(error.message, "Error");
    }
  }
}
