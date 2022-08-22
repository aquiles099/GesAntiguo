import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { SpinnerService } from '../../../../../../services/spinner.service';
import { ToastrService } from 'ngx-toastr';
import { ProfileService } from '../../../../../../services/medium/administration/profile.service';
import swal from 'sweetalert2';
import { AuthenticationService } from '../../../../../../services/authentication.service';
import { FormHelper } from '../../../../../../models/form-helper';

@Component({
  selector: 'user-tab',
  templateUrl: './user-tab.component.html',
  styleUrls: [
    './user-tab.component.css',
    '../../../../../../../themes/styles/default-view.scss'
  ]
})
export class UserTabComponent extends FormHelper implements OnInit
{
  constructor(
    private _spinnerService:SpinnerService,
    protected _toastrService:ToastrService,
    private _authenticationService:AuthenticationService,
    private _profileService:ProfileService
  )
  {
    super(
      _toastrService
    );

    this.form = new FormGroup({
      nombre: new FormControl(null, Validators.required),
      apellidos: new FormControl(null, Validators.required),
      nif: new FormControl(null, [Validators.required, Validators.minLength(10), Validators.maxLength(10)]),
      id_usuario: new FormControl(null, [Validators.required, Validators.minLength(4)]),
      email: new FormControl(null, Validators.email),
      nueva_clave: new FormControl(null, [Validators.minLength(8)]),
      nueva_clave_confirmation: new FormControl(null, [Validators.minLength(8)]),
      image: new FormControl(null)
    });
  }

  public ngOnInit(): void
  {
    this.form.patchValue(this._authenticationService.authenticatedUserData); 

    this.selectedImageSrc = this._authenticationService.authenticatedUserData.image_path ?? "assets/images/profile-image.svg";
  }
  
  public async onSubmit(form:HTMLFormElement):Promise<void>
  {
    try
    {
      const data = new FormData(form);

      let userResponse;

      if( data.get("nueva_clave") )
      {
        userResponse = await swal.fire({
          title: 'Por favor, coloque su contraseña actual:',
          input: 'password',
          inputAttributes: {
            autocapitalize: 'off',
            placeholder: "contraseña"
          },
          showCancelButton: true,
          confirmButtonText: 'Aceptar',
          cancelButtonText: 'Cancelar',
          showLoaderOnConfirm: true,
          inputValidator: value => ! value ? 'Introduzca su contraseña' : null
        });

        if( userResponse.isConfirmed ) 
          data.append("clave_actual", userResponse.value) 
        else
          return;
      }
      
      this._spinnerService.updateText("Actualizando datos...");
      this._spinnerService.show();
      
      this._authenticationService.authenticatedUserData = await this._profileService.updateUser(
          this._authenticationService.authenticatedUserData.id,
          data
      );

      this._toastrService.success("Datos actualizados.","Exito!");

      this.form.patchValue({
        nueva_clave: null,
        nueva_clave_confirmation: null,
        image: null
      });
      
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
