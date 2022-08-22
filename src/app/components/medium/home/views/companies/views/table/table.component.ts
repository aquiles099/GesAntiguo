import { Component, ViewChild, AfterContentInit } from '@angular/core';
import { toggleFullscreen } from '../../../../../../../shared/helpers';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { BaseDatatableComponent } from '../../../../../../shared/base-datatable/base-datatable.component';
import { showPreconfirmMessage } from 'src/app/shared/helpers';
import { SpinnerService } from '../../../../../../../services/spinner.service';
import { CompanyService } from '../../../../../../../services/medium/administration/company.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  templateUrl: './table.component.html',
  styleUrls: [
    './table.component.css',
    '../../../../../../../../themes/styles/default-view.scss'
  ]
})
export class TableComponent extends BaseDatatableComponent implements AfterContentInit
{

  public companies:any[] = [];
  public totalCompanies:number = 0;

  @ViewChild(ModalDirective)
  public confirmationModal: ModalDirective;

  public badgeColors: string[] = [
    "#0A8A3D",
    "#6E63C8",
    "#FFF",
    "#FF5F58",
    "#288635",
    "#BDBDBD",
    "#3498db"
  ];

  public showSpinner:boolean = false;

  constructor(
    private _spinnerService:SpinnerService,
    private _companyService:CompanyService,
    private _toastrService:ToastrService
  ) {
    super();
    
    this.setOptions({
      order: [[1,'asc']],
      columns: [
        {searchable: false, orderable: false },
        {searchable: true, orderable: true },
        {searchable: true, orderable: true },
        {searchable: true, orderable: true },
        {searchable: true, orderable: true },
        {searchable: false, orderable: false },
      ]
    });
  }

  public ngAfterContentInit():void
  {
    // se ejecuta antes de que la tabla sea un datatable pero igual funciona/
    this.reloadTable();
  }
 
  public async reloadTable():Promise<void>
  { 
    try
    {
      this.showSpinner = true;
      
      this.companies = await this._companyService.all();
      this.totalCompanies = this.companies.length;

      this.renderer();
    } 
    catch (error)
    {
      this._toastrService.error(error.message, "Error");
    }
    finally
    {
      this.showSpinner = false;
    }
  }

  public toggleFullscreen(event:any):void
  {
    toggleFullscreen(event);
  }

  public async deleteCompany(id:number):Promise<void>
  {
    try
    {
      const userResponse = await showPreconfirmMessage(
        "¿Eliminar Empresa?",
        "Todos los usuarios asociados a la misma seran removidos."
      );

      if( userResponse.isConfirmed )
      {
        this._spinnerService.updateText("Eliminando empresa...");
        this._spinnerService.show();

        await this._companyService.delete( id );

        this.companies = this.companies.filter(company => company.id !== id);

        this.renderer();

        this._toastrService.success("Empresa eliminada.","Exito!");
      }
    }
    catch(error)
    {
      this._toastrService.error(error.message,"Error");
    }
    finally
    {
      this._spinnerService.hide();
      this._spinnerService.cleanText();
    }
  }
}
