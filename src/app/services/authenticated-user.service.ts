import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { User as UserInterface } from '../interfaces/user';
import { User } from '../models/user';
import { ObjectUtility } from '../shared/object-utility';

@Injectable({
  providedIn: 'root'
})
export class AuthenticatedUserService
{
  private userSubject:BehaviorSubject<User>;
  public userObservable:Observable<User>;

  constructor()
  {
    this.userSubject = new BehaviorSubject(null);
    this.userObservable = this.userSubject.asObservable();
    this.initiate();
  }

  private initiate():void
  {
    if( localStorage.getItem("user") )
    {
      const user = new User(JSON.parse(localStorage.getItem("user")));
      this.userSubject.next(user);
    }
  }

  get isLoggedIn():boolean
  {
    return this.user !== null; 
  }

  get user():User
  {
    return this.userSubject.getValue();
  }

  public next(data:UserInterface):void
  {  
    if(data)
    {
      const user = new User(data);
      this.userSubject.next(user);
      this.saveOnLocalStorage(data);
    }
    else
    {
      this.userSubject.next(null);
    }
  }

  private saveOnLocalStorage(data:UserInterface):void
  {
    localStorage.clear();
    localStorage.setItem("user", JSON.stringify(data));
  }

  public async loadUserInLocalStorage():Promise<void>
  {
    return new Promise(resolve => {

      const user = JSON.parse(localStorage.getItem("user"));

      if( user && ObjectUtility.hasNoNullValues(user) )
        this.next(user);

      resolve();
    });
  }

  public clear():void
  {
    this.next(null);
    localStorage.clear();
    sessionStorage.clear();
  }
}
