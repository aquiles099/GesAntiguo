import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { SpinnerService } from '../../../../../../../services/spinner.service';
import { ToastrService } from 'ngx-toastr';
import { toggleFullscreen, checkIfTheFileExtensionIsCorrect, getFileExtension } from '../../../../../../../shared/helpers';
import { getFileContent } from 'src/app/shared/helpers';
import { ProvinceService } from '../../../../../../../services/medium/administration/province.service';
import { CompanyService } from '../../../../../../../services/medium/administration/company.service';
import { ObjectUtility } from '../../../../../../../shared/object-utility';

@Component({
  templateUrl: './create.component.html',
  styleUrls: [
    './create.component.css',
    '../../../../../../../../themes/styles/default-view.scss'
  ]
})
export class CreateComponent implements OnInit
{
  public form:FormGroup;
  public companyLogoImgSrc:string = null;
  public companyLogoImgExtension :string = null;
  public provinces:any[] = [];
  public municipalities:Array<any> = [];
  public loadingProvinces:boolean = false;
  public loadingMunicipalities:boolean = false;

  @ViewChild("imageInput")
  public imageInput:ElementRef<HTMLInputElement>;

  constructor(
    private route:ActivatedRoute,
    private router:Router,
    private _spinnerService:SpinnerService,
    private _provinceService:ProvinceService,
    private _companyService:CompanyService,
    private _toastrService:ToastrService,
  )
  {
    this.form = new FormGroup({
      name: new FormControl(null, Validators.required),
      cif: new FormControl(null, Validators.required),
      image: new FormControl(null, Validators.required),
      province_id: new FormControl(null, Validators.required),
      municipality_id: new FormControl(null, Validators.required),
      users_per_project: new FormControl(null),
      installers_per_project: new FormControl(null),
      max_users_number: new FormControl(null),
      admin_1: new FormGroup({
        nombre: new FormControl(null, Validators.required),
        apellidos: new FormControl(null, Validators.required),
        nif: new FormControl(null, Validators.required),
        email: new FormControl(null, [Validators.required, Validators.email]),
        id_usuario: new FormControl(null, Validators.required),
        clave: new FormControl(null, Validators.required),
      }),
      admin_2: new FormGroup({
        nombre: new FormControl(null),
        apellidos: new FormControl(null),
        nif: new FormControl(null),
        email: new FormControl(null, Validators.email),
        id_usuario: new FormControl(null),
        clave: new FormControl(null),
      })
    });
  }

  public ngOnInit(): void 
  {
    this.loadProvinces();
  }

  private async loadProvinces():Promise<void>
  {
    try
    {
      this.loadingProvinces = true;

      this.provinces = await this._provinceService.all();

      this.loadingProvinces = false;
    }
    catch (error)
    {
      this.router.navigateByUrl("..",{relativeTo: this.route});
    }
  }

  public async onSelectCompanyLogo(event:any):Promise<void>
  {
    try {
      
      const file = event.target.files[0];
  
      if(file)
      {
        if( ! checkIfTheFileExtensionIsCorrect([file], ["jpg","jpeg","png"]) )
          throw new Error("El archivo debe ser una imagen con extensión jpg, jpeg o png");

          this.companyLogoImgSrc = await getFileContent(file, "dataURL");
          this.companyLogoImgExtension = await getFileExtension(file);
      }

    }
    catch (error)
    {
      this._toastrService.error(error.message, "Error");
      event.target.value = null;
    }
  }

  public toggleFullscreen(event:any):void
  {
      toggleFullscreen(event);
  }

  public togglePasswordVisibility(passwordField:HTMLInputElement):void
  {
    passwordField.type = passwordField.type === "password" ? "text" : "password";
  }


  public async onChangeProvinceSelector(province:{provincia:number, name:string}):Promise<void>
  {
    try {
      
      this.municipalities = [];

      this.loadingMunicipalities = true;

      this.form.patchValue({'municipality_id': null});
            
      this.municipalities = await this._provinceService.getMunicipalitiesByProvince(province.provincia);

    }
    catch (error)
    {
      this._toastrService.error(error.message, "Error");
    }
    finally
    {
      this.loadingMunicipalities = false;
    }
  }

  public async onSubmit(form:HTMLFormElement):Promise<void>
  {
    try
    {      
      this._spinnerService.updateText("Creando empresa...");
      this._spinnerService.show();

      const data = this.form.value;
      const formData = new FormData(form);
      
      formData.append("municipality_id", this.form.get("municipality_id").value);

      for(let [key, value] of Object.entries( data.admin_1 )  )
        formData.append(`administrators[0][${key}]`, (value as string|Blob) );
            
      if( ObjectUtility.hasNoNullValues(data.admin_2) )
      {
        for(let [key, value] of Object.entries( data.admin_2 )  )
          formData.append(`administrators[1][${key}]`, (value as string|Blob) );
      } 

      await this._companyService.store(formData);

      this._toastrService.success("Empresa registrada.","Exito!");

      this.form.reset();

      this.imageInput.nativeElement.value = null;

      this.companyLogoImgSrc = null;
      this.companyLogoImgExtension = null;
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
