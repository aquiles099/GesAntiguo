import { Component, OnInit, AfterContentInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SpinnerService } from '../../../../../../services/spinner.service';
import { ProvinceService } from '../../../../../../services/medium/administration/province.service';
import { CompanyService } from '../../../../../../services/medium/administration/company.service';
import { ToastrService } from 'ngx-toastr';
import { AuthenticationService } from '../../../../../../services/authentication.service';
import { FormHelper } from '../../../../../../models/form-helper';

@Component({
  selector: 'company-tab',
  templateUrl: './company-tab.component.html',
  styleUrls: [
    './company-tab.component.css',
    '../../../../../../../themes/styles/default-view.scss'
  ]})
export class CompanyTabComponent extends FormHelper implements OnInit, AfterContentInit {

  public company:any;
  
  public selectedImageSrc:string = "assets/images/logo-image.svg";
  
  public loadingFormData:boolean = false;
  public provinces:any[] = [];
  public municipalities:Array<any> = [];
  public users:any[] = [];

  constructor(
    private route:ActivatedRoute,
    private router:Router,
    private _spinnerService:SpinnerService,
    private _authenticationService:AuthenticationService,
    private _provinceService:ProvinceService,
    private _companyService:CompanyService,
    protected _toastrService:ToastrService,
  )
  {
    super(
      _toastrService
    );
    
    this.form = new FormGroup({
      name: new FormControl(null, Validators.required),
      cif: new FormControl(null, [Validators.required, Validators.minLength(10), Validators.maxLength(10)]),
      image: new FormControl(null),
      province_id: new FormControl(null, Validators.required),
      municipality_id: new FormControl(null, Validators.required),
      is_active: new FormControl(null, Validators.required),
      user_ids: new FormControl(null, Validators.required)
    });
  }

  public ngOnInit(): void 
  {    
    this.company = this._authenticationService.authenticatedUserData.company;

    const formData = Object.assign(
      {}, 
      this.company,
      {
        "province_id": this.company.municipality.province.provincia,
        "user_ids": this.company.administrators.map(admin => admin.id)
      }
    );
    
    this.form.patchValue(formData);

    this.selectedImageSrc = this.company.image_path; 
  }
 
  public async  ngAfterContentInit():Promise<void> 
  {
    await this.loadProvincesAndCompanyUsers();
    await this.onChangeProvinceSelector(this.company.municipality.province);
    this.form.patchValue({"municipality_id": this.company.municipality_id});
  }

  private async loadProvincesAndCompanyUsers():Promise<void>
  {
    try
    {
      this.loadingFormData = true;

      this.provinces = await this._provinceService.all();

      this.users = (await this._companyService.getUsersOfAutenticatedUserCompany()).records;

      // insertar el usuario autenticado en el listado devuelto por backend.
      // api no lo devuelve.
      this.users.push(this._authenticationService.authenticatedUserData);

      this.loadingFormData = false;
    }
    catch (error)
    {
      this.router.navigateByUrl("..",{relativeTo: this.route});
    }
    finally
    {
      this.loadingFormData = false;
    }
  }

  public async onChangeProvinceSelector(province:{provincia:number, name:string}):Promise<void>
  {
    try {
      
      this.loadingFormData = true;

      this.municipalities = [];

      this.form.patchValue({'municipality_id': null});
            
      this.municipalities = await this._provinceService.getMunicipalitiesByProvince(province.provincia);

    }
    catch (error)
    {
      this._toastrService.error(error.message, "Error");
    }
    finally
    {
      this.loadingFormData = false;
    }
  }

  public async onSubmit(form:HTMLFormElement):Promise<void>
  {
    try
    {      
      this._spinnerService.updateText("Actualizando empresa...");
      this._spinnerService.show();

      const formData = new FormData(form);

      formData.append("municipality_id", this.getFormValue("municipality_id"));
      
      this.getFormValue("user_ids").forEach((id,i) => formData.append(`user_ids[${i}]`, id));
      
      this._authenticationService.authenticatedUserData.company = await this._companyService.update(
        this.company.id, formData
      )
        
      this._toastrService.success("Empresa actualizada.","Exito!");

      this.form.patchValue({image: null});

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
