import { Component, EventEmitter, Output } from '@angular/core';
import { AuthenticationService } from '../../../../services/authentication.service';
import { AuthenticatedUserService } from '../../../../services/authenticated-user.service';
import { fadeInOnEnterAnimation, fadeOutOnLeaveAnimation } from 'angular-animations';
import { User } from 'src/app/models/user';

@Component({
  selector: 'home-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  animations:[
    fadeInOnEnterAnimation({duration: 250}),
    fadeOutOnLeaveAnimation({duration: 250})
  ]
})
export class HeaderComponent
{
  @Output()
  public toggleSideBarMenuVisibility: EventEmitter<void> = new EventEmitter;

  public logoutWindowIsVisible: boolean = false;
  public itsOnTheLogoutWindow: boolean = false;

  constructor(
    private _authenticationService: AuthenticationService,
    private _authenticatedUserService:AuthenticatedUserService
  )
  { }

  get user():User
  {
    return this._authenticatedUserService.user;
  }
  
  get userData():any
  {
    return this._authenticationService.authenticatedUserData;
  }

  get isInUnic():boolean
  {
    return this._authenticatedUserService.user.pluginName === "UNIC";
  }

  public logout(): void
  {
    this._authenticationService.logout();
  }

  public toggleSideBarMenuVisibilityEvent(): void
  {
    this.toggleSideBarMenuVisibility.emit();
  }

  public showLogoutWindow():void 
  {
    this.logoutWindowIsVisible = true;
  }

  public hideLogoutWindowAutomatically():void 
  {
    setTimeout(() => {

      if( ! this.itsOnTheLogoutWindow )
        this.hideLogoutWindow();

    }, 3000);
  }

  public overTheLogoutWindow():void 
  {
    this.itsOnTheLogoutWindow = true;
  }

  public hideLogoutWindow():void 
  {
    this.logoutWindowIsVisible = false;
    this.itsOnTheLogoutWindow = false;
  }
}
