import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { CompanyService } from '../../../../medium/administration/company.service';

@Injectable()
export class DetailsResolverService {

  constructor(
    private _companyService:CompanyService,
    private _toastrService:ToastrService,
    private router:Router
  ) { }

  public async resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot):Promise<any>
  {
    try
    {
      const id = route.params["id"];      
      return await this._companyService.find(id);
    }
    catch(error)
    {
      this.router.navigateByUrl("/medium");
      this._toastrService.error(error.message, "Error");
    }
  }
  
}