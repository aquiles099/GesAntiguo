import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { DataTableDirective } from 'angular-datatables';
import { Subject } from 'rxjs';
import { UvaxApiService } from '../../../../../../services/medium/uvax-api.service';

@Component({
  templateUrl: './devices.component.html',
  styleUrls: ['./devices.component.css']
})
export class DevicesComponent implements OnInit, AfterViewInit
{

  public devices:{[key:string]:string}[] = [];

  @ViewChild(DataTableDirective, {static: false})
  public dtElement: DataTableDirective;

  public dtOptions: any = {}; 
  public dtTrigger: Subject<any> = new Subject(); 
  
  constructor(
    private _uvaxApiService:UvaxApiService
  )
  {
    
  }

  public ngOnInit(): void
  {
    this._uvaxApiService.login();
    this.buildDataTableOptions([]);
  }
 
  public ngAfterViewInit(): void
  {
    this.dtTrigger.next();
  }

  public buildDataTableOptions(data:Array<any>):void
  {
    this.dtTrigger = new Subject(); 

    this.dtOptions = {
      stripeClasses: [],
      pagingType: 'full_numbers',
      pageLength: 10,
      scrollY: true,
      scrollX: true,
      scrollCollapse: true,
      data: data,
      order: [[1,'desc']],
      serverSide: false,
      processing: true,
      columns: [
        {searchable: true, orderable: true},
        {searchable: true, orderable: true},
        {searchable: true, orderable: true},
        {searchable: true, orderable: true, type: "date"},
        {searchable: false, orderable: false},
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
        emptyTable: "No hay datos disponibles en la tabla",
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

}
