import { Component, ViewChild, OnDestroy, AfterViewInit, AfterContentInit } from '@angular/core';
import { DataTableDirective } from 'angular-datatables';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-base-datatable',
  template: ``,
  styleUrls: ['./base-datatable.component.css']
})
export class BaseDatatableComponent implements AfterViewInit, OnDestroy
{
  @ViewChild(DataTableDirective, {static: false})
  public dtElement: DataTableDirective;

  public dtOptions: any = {
    stripeClasses: [],
    pagingType: 'full_numbers',
    lengthMenu: [ [10, 25, 50, -1], [10, 25, 50, "Todos"] ],
    pageLength: 10,
    scrollY: '60vh',
    scrollX: true,
    scrollCollapse: true,
    order: [[0,'asc']],
    columns: [],
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
      emptyTable: "No hay registros disponibles",
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

  public dtTrigger: Subject<any> = new Subject(); 

  constructor()
  {
  }
  
  public setOptions(options:any): void
  {
    Object.assign(this.dtOptions, options);
  }

  public ngAfterViewInit(): void
  {
    this.dtTrigger.next();
  }
 
  public filterTableElements(event):void
  {
    this.dtElement.dtInstance.then((dtInstance: DataTables.Api) => {
      dtInstance.search(event.target.value.trim());
      dtInstance.draw();
    });
  }
  
  public renderer():void
  {
    this.dtElement.dtInstance.then((dtInstance: DataTables.Api) => {
      dtInstance.destroy();
      this.dtTrigger.next();
     });
  }

  public ngOnDestroy():void
  {   
    this.dtTrigger.unsubscribe();
  }

}
