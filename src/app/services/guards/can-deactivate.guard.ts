import { Injectable } from '@angular/core';
import { CanDeactivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { SpinnerService } from '../spinner.service';
import { Location } from '@angular/common';

interface CanDeactivateComponent
{
  canDeactivate: () => Promise<boolean>
}

@Injectable({
  providedIn: 'root'
})
export class CanDeactivateGuard implements CanDeactivate<CanDeactivateComponent>
{
  constructor(
    private _spinnerService:SpinnerService,
    private router:Router,
    private location:Location
  )
  {}

  public async canDeactivate(
    component: CanDeactivateComponent,
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean | UrlTree>
  {
    this._spinnerService.hide();

    const confirmation = await component.canDeactivate();

    if( ! confirmation )
    {
      const currentUrlTree = this.router.createUrlTree([], next);
      const currentUrl = currentUrlTree.toString();
      this.location.go(currentUrl);
    }

    return confirmation;
  }
  
}
