import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { SpinnerService } from '../../../../../../../services/spinner.service';
import { ToastrService } from 'ngx-toastr';
import { UserService } from '../../../../../../../services/medium/administration/user.service';

@Component({
  templateUrl: './edit.component.html',
  styleUrls: [
    './edit.component.css',
    '../../../../../../../../themes/styles/default-view.scss'
  ]})
export class EditComponent implements OnInit, OnDestroy
{
  private routeDataSubscription:Subscription;

  public form:FormGroup;

  public user:any;

  constructor(
    private route:ActivatedRoute,
    private _spinnerService:SpinnerService,
    private _toastrService:ToastrService,
    private _userService:UserService,
    private router:Router
  )
  {
    this.form = new FormGroup({
      nombre: new FormControl(null, Validators.required),
      apellidos: new FormControl(null, Validators.required),
      nif: new FormControl(null, [Validators.required]),
      email: new FormControl(null, Validators.email),
      id_usuario: new FormControl(null, Validators.required),
      activo: new FormControl(null, Validators.required)
    });
  }

  public ngOnInit(): void 
  {
    this.routeDataSubscription = this.route.data.subscribe(data => {
  
      this.user = data.user;

      this.form.patchValue(data.user);
      this.form.patchValue({'activo': data.user.activo === true ? "on" : "off"});
      
    });
  }

  public togglePasswordVisibility(passwordField:HTMLInputElement):void
  {
    passwordField.type = passwordField.type === "password" ? "text" : "password";
  }

  public async onSubmit():Promise<void>
  {
    try
    {
      this._spinnerService.updateText("Actualizando usuario...");
      this._spinnerService.show();

      const data = this.form.value;

      data["activo"] = data["activo"] === "on"; 

      await this._userService.update(this.user.id, data);

      this._toastrService.success("Usuario actualizado.","Exito!");

      this.router.navigate(["../.."],{relativeTo: this.route});
    }
    catch(errorReponse)
    { 

      let html = "<ul class='m-0 p-0'>";

      (Object.values(errorReponse.error.errors)[0] as string[]).forEach(_error => {

        html += "<li>"+ _error +"</li>"

      });
      
      this._toastrService.error(html,"Error");
    }
    finally
    {
      this._spinnerService.cleanText();
      this._spinnerService.hide();
    }
  }

  public ngOnDestroy():void
  {
    this.routeDataSubscription.unsubscribe();
  }

}
