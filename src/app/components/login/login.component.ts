import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, Validators } from '@angular/forms';
import { Md5 } from 'ts-md5';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthenticatedUserService } from '../../services/authenticated-user.service';
import { ApiService } from '../../services/api.service';

@Component({
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit
{
  public form: FormGroup;
  private md5: Md5;

  public sendingForm:boolean = false;
  
  constructor(
    private router: Router,
    private _authenticatedUserService: AuthenticatedUserService,
    private _apiService:ApiService,
  )
  {
    this.form = new FormGroup({
      user: new FormControl(null, [Validators.required]),
      password: new FormControl(null, [Validators.required]),
    });
  }

  get userField():AbstractControl
  {
    return this.form.get("user");
  }

  get passwordField():AbstractControl
  {
    return this.form.get("password");
  }

  public ngOnInit(): void
  {
    sessionStorage.clear();
    localStorage.clear();
    this.md5 = new Md5();
  }

  public async onSubmit():Promise<void>
  {
    try
    {
      if (this.form.valid)
      {
        this.sendingForm = true;

        const response = await this._apiService.post({
          funcion: 'web_iniciar_sesion_gis_smart',
          clave_plugin: environment.pluginKey,
          clave_sesion: '',
          plugin: 'GIS SMART',
          tipo: 'web',
          usuario: this.form.get('user').value,
          contrasenia: this.md5
            .appendStr(this.form.get('password').value)
            .end(),
        }); 

        this._authenticatedUserService.next(response.datos);

        if (response.datos.plugin === "SMART-GIS UNIC")
        {
          await this.router.navigate(['unic']);
        }
        else
        {
          // smell
          sessionStorage.setItem('plugin', response.datos.plugin);
          sessionStorage.setItem('apellido', response.datos.apellido);
          sessionStorage.setItem('email', response.datos.email);
          sessionStorage.setItem('id_plugin', response.datos.id_plugin);
          sessionStorage.setItem('empresa', response.datos.empresa);
          sessionStorage.setItem('id_empresa', response.datos.id_empresa);
          sessionStorage.setItem('usuario', this.form.get('user').value);
          sessionStorage.setItem('nombre_usuario', response.datos.nombre_usuario);
          sessionStorage.setItem('tipoAdministrador', response.datos.administrador);
          sessionStorage.setItem('administradorEmpresa', response.datos.administrador_empresa);
          sessionStorage.setItem('clave_sesion', response.datos.clave_sesion);
          sessionStorage.setItem('iconEmpresa', response.datos.icono_empresa);

          await this.router.navigate(['medium']);
        }

        Swal.fire({
          icon: 'success',
          title: `Bienvenido ${response.datos.nombre_usuario}`,
          showConfirmButton: false,
          timer: 1500,
          heightAuto: false
        });
      }
    }
    catch(error)
    {
      Swal.fire({
        title: 'Ups...',
        text: error.message,
        icon: 'error',
        confirmButtonText: 'OK',
        heightAuto: false
      });

      this.md5 = new Md5();
    }
    finally
    {
      this.sendingForm = false;
    }
  }

  public passwordRecovery():void
  {
    Swal.fire({
      title: 'Advertencia',
      text: 'Por favor, póngase en contacto con el administrador de la página web.',
      icon: 'warning',
      confirmButtonText: 'OK',
      heightAuto: false
    });
  }

  public togglePasswordVisibility(passwordField:HTMLInputElement):void
  {
    passwordField.type = passwordField.type === "password" ? "text" : "password";
  }
}
