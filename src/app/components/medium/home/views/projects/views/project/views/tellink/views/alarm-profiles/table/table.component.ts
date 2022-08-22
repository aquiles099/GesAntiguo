import { Component, OnInit, AfterContentInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { TellinkApiService } from '../../../../../../../../../../../../services/medium/tellink-api.service';
import Swal from 'sweetalert2';
import { AlarmProfile } from '../../../../../../../../../../../../interfaces/medium/tellink/alarm-profile';
import { BaseDatatableComponent } from '../../../../../../../../../../../shared/base-datatable/base-datatable.component';
import { Contract } from '../../../../../../../../../../../../interfaces/medium/tellink/contract';
import { showPreconfirmMessage } from 'src/app/shared/helpers';

@Component({
  templateUrl: './table.component.html',
  styleUrls: [
    '../../../../../../../../../../../../../themes/styles/default-view.scss',
    './table.component.css'
  ]
})
export class TableComponent extends BaseDatatableComponent implements OnInit, AfterContentInit
{
  public alarmProfiles:AlarmProfile[] = [];

  public showSpinner:boolean = false;

  public selectedContractId:number = null;

  constructor(
    private _toastrService:ToastrService,
    private _tellinkApiService:TellinkApiService
  )
  {
    super();
    
    this.setOptions({
      order: [[1,'desc']],
      columns: [
        {searchable: true, orderable: true },
        {searchable: true, orderable: true },
        {searchable: true, orderable: true, type: "date" },
        {searchable: false, orderable: false },
      ]
    });
  }

  get userContracts():Contract[]
  {
    return this._tellinkApiService.userContracts;
  }

  public ngOnInit(): void {
    this.selectedContractId = this._tellinkApiService.selectedContract.id; 
  }
 
  public ngAfterContentInit():void
  {
    // se ejecuta antes de que la tabla sea un datatable pero igual funciona/
    this.reloadTable();
  }
 
  public onChangeContractSelector(contract:Contract):void
  {
    this._tellinkApiService.setContract(contract);
    this.reloadTable();
  }

  public async reloadTable():Promise<void>
  { 
    try
    {
      this.showSpinner = true;
      
      this.alarmProfiles = await this._tellinkApiService.getAlarmProfilesByContract();
      
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

  public async deleteAlarmProfile(alarm:AlarmProfile):Promise<void>
  {
    try
    {
      const userResponse = await showPreconfirmMessage(
        "¿Eliminar perfil de alarma?",
        "Esta acción no es reversible."
      );

      if( userResponse.isConfirmed )
      {

        await this._tellinkApiService.deleteAlarmProfile( alarm.id );

        this.reloadTable();

        this._toastrService.success("Perfil de alarma eliminado.","Exito!");
      }
    }
    catch(error)
    {
      this._toastrService.error(error.message,"Error");
    }
    finally
    {
    }
  }

  public profileHasPendingState(profile:AlarmProfile):boolean
  {
    return profile.status_flag === 0 || profile.status_flag === 3;
  }

  public async showInfo(profile:AlarmProfile):Promise<void>
  {
    let title =  "Procesando registro / operación ...";
    let message =  "Por favor, espere un momento y actualize la tabla.";

    if( profile.status_flag === 3 )
    {
      title = "Orden de borrado emitida";
      message = "Debe desasociar todos los centros de mando que usen este perfil de alarma para acompletar la acción de borrado." ;
    }
    
    Swal.fire({
      icon: 'info',
      title: title,
      html: message,
      showConfirmButton: true,
      confirmButtonText: "OK",
      heightAuto: false
    });
  }
  
}
