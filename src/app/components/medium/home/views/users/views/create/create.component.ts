import { Component} from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { SpinnerService } from '../../../../../../../services/spinner.service';
import { ToastrService } from 'ngx-toastr';
import { UserService } from '../../../../../../../services/medium/administration/user.service';

@Component({
  templateUrl: './create.component.html',
  styleUrls: [
    './create.component.css',
    '../../../../../../../../themes/styles/default-view.scss'
  ]})
export class CreateComponent
{
  public form:FormGroup;

  constructor(
    private _spinnerService:SpinnerService,
    private _toastrService:ToastrService,
    private _userService:UserService
  )
  {
    this.form = new FormGroup({
      nombre: new FormControl(null, Validators.required),
      apellidos: new FormControl(null, Validators.required),
      nif: new FormControl(null, [Validators.required]),
      id_usuario: new FormControl(null, [Validators.required]),
      email: new FormControl(null, Validators.email),
      clave: new FormControl(null, Validators.required)
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
      this._spinnerService.updateText("Creando usuario...");
      this._spinnerService.show();

      await this._userService.store(this.form.value);

      this._toastrService.success("Usuario registrado.","Exito!");

      this.form.reset();
      
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

}
