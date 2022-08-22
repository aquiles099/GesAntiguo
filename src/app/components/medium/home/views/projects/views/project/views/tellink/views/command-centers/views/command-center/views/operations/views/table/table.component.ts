import { Component, OnInit, ViewChild, OnDestroy, AfterContentInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommandCenter } from '../../../../../../../../../../../../../../../../../interfaces/medium/tellink/command-center';
import { Operation } from '../../../../../../../../../../../../../../../../../interfaces/medium/tellink/operation';
import { DataTableDirective } from 'angular-datatables';
import { Subject, Subscription } from 'rxjs';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { SpinnerService } from '../../../../../../../../../../../../../../../../../services/spinner.service';
import { ToastrService } from 'ngx-toastr';
import { TellinkApiService } from '../../../../../../../../../../../../../../../../../services/medium/tellink-api.service';
import Swal from 'sweetalert2';

@Component({
  templateUrl: './table.component.html',
  styleUrls: [
    '../../../../../../../../../../../../../../../../../../themes/styles/default-view.scss',
    './table.component.css'
  ]
})
export class TableComponent implements OnInit, AfterContentInit, OnDestroy {

  public cm:CommandCenter = null;
  public operations:Operation[] = [];

  public showSpinner:boolean = false;

  @ViewChild(DataTableDirective, {static: false})
  public dtElement: DataTableDirective;

  public dtOptions: any = {}; 
  public dtTrigger: Subject<any> = new Subject(); 

  public form:{[key:string]:string|number} = {
    id: null,
    type: null,
    status_digital_output: null
  };

  public operationTypes:{label:string, value:number}[] = [
    {label: "Consultar estado", value: 1},
    {label: "Apagar salida", value: 2},
    {label: "Encender salida", value: 3}
  ];
  
  public digitalOutputNumbers:number[] = [1, 2, 3];

  @ViewChild(ModalDirective)
  public formModal: ModalDirective;

  private routeDataSubscription:Subscription;

  constructor(
    private route:ActivatedRoute,
    private _spinnerService:SpinnerService,
    private _toastrService:ToastrService,
    private _tellinkApiService:TellinkApiService
  )
  {
  }

  public ngOnInit(): void 
  {
    this.buildDataTableOptions();

    this.routeDataSubscription = this.route.parent.parent.data.subscribe(
      data => this.cm = data.cm
    );
  }
  
  public ngAfterContentInit(): void
  {
    this.reloadTable();
  }

  public ngAfterViewInit(): void
  {
    this.dtTrigger.next();
  }

  public buildDataTableOptions():void
  {
    this.dtOptions = {
      stripeClasses: [],
      pagingType: 'full_numbers',
      lengthMenu: [ [10, 25, 50, -1], [10, 25, 50, "Todos"] ],
      pageLength: 10,
      scrollY: '60vh',
      scrollX: true,
      scrollCollapse: true,
      order: [[3,'asc']],
      columns: [
        {searchable: true, orderable: true },
        {searchable: true, orderable: true },
        {searchable: true, orderable: true },
        {searchable: true, orderable: true, type: "date" },
        {searchable: true, orderable: true },
        {searchable: false, orderable: false },
      ],
      buttons: [],
      autoWidth: false,
      dom: 'Brtip',
      language: {
        processing: "Procesando...",
        search: "Buscar:",
        lengthMenu: "Mostrar _MENU_ elementos",
        info: "Mostrando desde _START_ al _END_ de _TOTAL_ elementos",
        infoEmpty: "Mostrando ningún elemento.",
        infoFiltered: "(filtrado _MAX_ elementos total)",
        infoPostFix: "",
        loadingRecords: "Cargando registros...",
        zeroRecords: "No se encontraron registros",
        emptyTable: "No hay centros de mando registrados",
        paginate: {
          first: "Primero",
          previous: "Anterior",
          next: "Siguiente",
          last: "Último"
        },
        aria: {
          sortAscending: ": Activar para ordenar la tabla en orden ascendente",
          sortDescending: ": Activar para ordenar la tabla en orden descendente"
        }
      }
    };
  }
 
  public filterTableElements(event):void
  {
    this.dtElement.dtInstance.then((dtInstance: DataTables.Api) => {
      dtInstance.search(event.target.value.trim());
      dtInstance.draw();
    });
  }

  public async toggleStatesOfOutputs(state:"on"|"off"):Promise<void>
  {
    try
    {
      let message = state === "on" ? 
      "Encendiendo salidas..." : "Apagando salidas...";

      this._spinnerService.updateText( message );
      this._spinnerService.show();

      let data = {
        type: state === "on" ? 3 : 2,
        panel_id: this.cm.id,
        digital_output_number: null
      };

      const promises = this.digitalOutputNumbers.map(n => {
      
        data.digital_output_number = n;

        return this._tellinkApiService.createOperation(data);
      
      });

      await (Promise as any).all(promises);

      message = state === "on" ? 
      "Salidas encendidas" : "Salidas apagadas";

      this._toastrService.success(message);

      this.reloadTable();

    } 
    catch (error)
    {
      this._toastrService.error(error.message, "Error");
    }
    finally
    {
      this._spinnerService.hide();
      this._spinnerService.cleanText();
    }
  }

  public async showFormForEdit(operation:Operation):Promise<void>
  {
    this.form.id = operation.id;
    this.form.type = operation.type;
    this.form.digital_output_number = operation.digital_output_number;

    this.formModal.show();
  }

  public async onSubmit():Promise<void>
  {
    try
    {
      this._spinnerService.updateText((this.form.id ? "Editando" : "Creando") + " actuación...");
      this._spinnerService.show();

      if( this.form.id )
      {
        await this._tellinkApiService.updateOperation((this.form.id as number), {
          type: (this.form.type as number),
          panel_id: this.cm.id,
          digital_output_number: (this.form.digital_output_number as number)
        });
      }
      else
      {
        await this._tellinkApiService.createOperation({
          type: (this.form.type as number),
          panel_id: this.cm.id,
          digital_output_number: (this.form.digital_output_number as number)
        });
      }

      this._toastrService.success("Actuación " + (this.form.id ? "editada" : "creada"),"Exito!");

      this.reloadTable();

    } 
    catch (error)
    {
      this._toastrService.error(error.message, "Error");
    }
    finally
    {
      this.formModal.hide();

      this._spinnerService.hide();
      this._spinnerService.cleanText();
    }
  }
  
  public async reloadTable():Promise<void>
  { 
    try
    {
      this.showSpinner = true;

      this.operations = await this._tellinkApiService.getLastTenOperationsFromACm(this.cm.id);

      this.dtElement.dtInstance.then((dtInstance: DataTables.Api) => {
        dtInstance.destroy();
        this.dtTrigger.next();
       });
   
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

  public async showInfo():Promise<void>
  {
    Swal.fire({
      icon: 'info',
      title: "Procesando registro / operación ...",
      html: "Por favor, espere un momento y actualize la tabla.",
      showConfirmButton: true,
      confirmButtonText: "OK",
      heightAuto: false
    });
  }

  public ngOnDestroy():void
  {   
    this.dtTrigger.unsubscribe();
    this.routeDataSubscription.unsubscribe();
  }
}
