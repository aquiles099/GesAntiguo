import { Component, OnInit, ViewChild, ElementRef, OnDestroy, AfterContentInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SpinnerService } from '../../../../../../../services/spinner.service';
import { ProvinceService } from '../../../../../../../services/medium/administration/province.service';
import { CompanyService } from '../../../../../../../services/medium/administration/company.service';
import { ToastrService } from 'ngx-toastr';
import { toggleFullscreen, getFileContent } from 'src/app/shared/helpers';
import { checkIfTheFileExtensionIsCorrect } from '../../../../../../../shared/helpers';
import { Subscription } from 'rxjs';

@Component({
  templateUrl: './edit.component.html',
  styleUrls: [
    './edit.component.css',
    '../../../../../../../../themes/styles/default-view.scss'
  ]
})
export class EditComponent implements OnInit, AfterContentInit, OnDestroy {

  public company:any;

  public routeDataSubscription:Subscription;

  public form:FormGroup;
  
  public companyLogoImgSrc:string = null;
  
  public provinces:any[] = [];
  public municipalities:Array<any> = [];
  public loadingProvinces:boolean = false;
  public loadingMunicipalities:boolean = false;

  public users:any[] = [];

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
      image: new FormControl(null),
      province_id: new FormControl(null, Validators.required),
      municipality_id: new FormControl(null, Validators.required),
      is_active: new FormControl(null, Validators.required),
      user_ids: new FormControl(null, Validators.required),
      users_per_project: new FormControl(null),
      installers_per_project: new FormControl(null),
      max_users_number: new FormControl(null),
    });
  }

  public ngOnInit(): void 
  {
    this.routeDataSubscription = this.route.data.subscribe(_data => {

      let {company, users} = _data.data;

      this.users = users.records;
      this.company = company;

      const formData = Object.assign(
        {}, 
        company,
        {
          "province_id": company.municipality.province.provincia,
          "user_ids": company.administrators.map(admin => admin.id)
        }
      );
      
      this.form.patchValue(formData);

      this.companyLogoImgSrc = company.image_path; 
      
    });
  }
 
  public async  ngAfterContentInit():Promise<void> 
  {
    await this.loadProvinces();
    await this.onChangeProvinceSelector(this.company.municipality.province);
    this.form.patchValue({"municipality_id": this.company.municipality_id});
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

  public getFormValue(controlName:string):any
  {
    return this.form.get(controlName).value;
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

      await this._companyService.update(this.company.id, formData);

      this._toastrService.success("Empresa actualizada.","Exito!");

      this.router.navigate(["/medium/home/empresas"]);
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

  public ngOnDestroy(): void
  {
    this.routeDataSubscription.unsubscribe();
  }
}
