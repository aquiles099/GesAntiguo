import { Component} from '@angular/core';
import { AuthenticatedUserService } from '../../../../../services/authenticated-user.service';
import { User } from '../../../../../models/user';

@Component({
  templateUrl: './profile-configuration.component.html',
  styleUrls: [
    './profile-configuration.component.css',
    '../../../../../../themes/styles/default-view.scss'
  ]})
export class ProfileConfigurationComponent
{
 
  constructor(
    private _authenticatedUserService:AuthenticatedUserService
  )
  {

  }

  get authenticatedUser():User
  {
    return this._authenticatedUserService.user;
  }

}
