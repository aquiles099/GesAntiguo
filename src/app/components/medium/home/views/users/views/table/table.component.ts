import { Component, ViewChild, AfterContentInit } from '@angular/core';
import { getRandomInt } from '../../../../../../../shared/helpers';
import { User } from '../../../../../../../interfaces/user';
import { SpinnerService } from '../../../../../../../services/spinner.service';
import { ToastrService } from 'ngx-toastr';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { ObjectUtility } from '../../../../../../../shared/object-utility';
import { BaseDatatableComponent } from '../../../../../../shared/base-datatable/base-datatable.component';
import { CompanyService } from '../../../../../../../services/medium/administration/company.service';
import { UserService } from '../../../../../../../services/medium/administration/user.service';
import { AuthenticationService } from '../../../../../../../services/authentication.service';

@Component({
  templateUrl: './table.component.html',
  styleUrls: [
    './table.component.css',
    '../../../../../../../../themes/styles/default-view.scss'
  ]
})
export class TableComponent extends BaseDatatableComponent implements AfterContentInit
{
  public users:any[] = [];
  public totalAdmins:number = 0;
  
  @ViewChild(ModalDirective)
  public confirmationModal: ModalDirective;

  public userToDelete:any;

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
    private _toastrService:ToastrService,
    private _companyService:CompanyService,
    private _userService:UserService,
    private _authenticationService:AuthenticationService
  ) { 
    super();

    this.setOptions({
      order: [[1,'asc']],
      columns: [
        {searchable: false, orderable: false },
        {searchable: true, orderable: true },
        {searchable: true, orderable: true },
        {searchable: true, orderable: true },
        {searchable: false, orderable: false },
      ]
    });
  }

  get authenticatedUserData():any 
  {
    return this._authenticationService.authenticatedUserData;
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
      
      this.users = (await this._companyService.getUsersOfAutenticatedUserCompany()).records;

      this.users.forEach(
        user => user["colorIndex"] = getRandomInt(this.badgeColors.length)
      );

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

  public ngAfterViewInit(): void
  {
    this.dtTrigger.next();
  }

  public getUserNameInitials(fullName: string): string {
    return fullName.split(" ").map(name => name[0]?.toUpperCase()).join("");
  }


  public async setUserToDeleteAndShowConfirmationModal(user:any):Promise<void>
  {
    try
    {
      this._spinnerService.show();

      this.userToDelete = user;

      this.confirmationModal.show();

    }
    catch (error)
    {
      this._toastrService.error(error.message, "Error");
    }
    finally
    {
      this._spinnerService.hide()
    }
  }

  public onHideConfirmationModal():void
  {
    this.userToDelete  = null;
  }

  public async deleteUser():Promise<void>
  {
    try
    {
      let id = this.userToDelete.id;

      this.confirmationModal.hide();

      this._spinnerService.updateText("Eliminando usuario...");
      this._spinnerService.show();

      await this._userService.delete(id);

      this.users = this.users.filter(user => user.id !== id);

      this.userToDelete = null; 

      this.renderer();

      this._toastrService.success("Usuario eliminado.","Exito!");
    }
    catch (error)
    {
      this._toastrService.error(error.message, "Error");
    }
    finally
    {
      this._spinnerService.hide()
      this._spinnerService.cleanText();
    }
  }
}
