import { Component, OnInit, ViewChild, AfterViewInit, AfterContentInit } from '@angular/core';
import { DataTableDirective } from 'angular-datatables';
import { Subject, Subscription } from 'rxjs';
import { TellinkApiService } from '../../../../../../../../../../../../../services/medium/tellink-api.service';
import { Contract } from '../../../../../../../../../../../../../interfaces/medium/tellink/contract';
import { CommandCenter } from 'src/app/interfaces/medium/tellink/command-center';
import { SpinnerService } from '../../../../../../../../../../../../../services/spinner.service';
import { showPreconfirmMessage } from 'src/app/shared/helpers';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectService } from 'src/app/services/unic/project.service';
import { Project, ConfiguracionDeProyecto } from '../../../../../../../../../../../../../interfaces/project';
import { TileLayer } from 'leaflet';
import { ProjectMapComponent } from '../../../../../../../../../../../../shared/project-map/project-map.component';
import LeafletWms from 'leaflet.wms';
import { ModalDirective } from 'ngx-bootstrap/modal';
import Swal from 'sweetalert2';

@Component({
  templateUrl: './table.component.html',
  styleUrls: [
    '../../../../../../../../../../../../../../themes/styles/default-view.scss',
    './table.component.css'
  ]
})
export class TableComponent implements OnInit, AfterContentInit, AfterViewInit
{
  public commandCenters:CommandCenter[] = [];

  public showSpinner:boolean = false; 

  @ViewChild(DataTableDirective, {static: false})
  public dtElement: DataTableDirective;

  public dtOptions: any = {}; 
  public dtTrigger: Subject<any> = new Subject(); 

  public selectedContractId:number = null;

  public projectLayerStyles:any;

  private highlightedElementsLayer:TileLayer.WMS;

  public cmLocatedInMap:CommandCenter;

  @ViewChild(ProjectMapComponent)
  public ProjectMap:ProjectMapComponent;

  @ViewChild(ModalDirective)
  public actionsModal: ModalDirective;

  public actionRoutes:any[] = [];


  constructor(
    private _tellinkApiService:TellinkApiService,
    private _spinnerService:SpinnerService,
    private _toastrService:ToastrService,
    private _projectService:ProjectService,
  )
  {
    this.setOnlyCmLayerStyle();
  }

  get userContracts():Contract[]
  {
    return this._tellinkApiService.userContracts;
  }

  get project():Project
  {
    return this._projectService.project;
  }
  
  get projectConfiguration():ConfiguracionDeProyecto
  {
    return this._projectService.configuration;
  }

  private setOnlyCmLayerStyle():void
  {
    let commandCenterslayerStyle = {};

    for(let key of Object.keys( this._projectService.layerStyles ))
    {
      if( key.includes("centro_mando") )
      {
        commandCenterslayerStyle[key] = this._projectService.layerStyles[key];
        break;
      }
    } 
    
    // solo se necesita el estilo de la capa de centros de mando
    // para proyectarla.
    this.projectLayerStyles = commandCenterslayerStyle;
  }
 
  public async ngOnInit(): Promise<void>
  {
    this.buildDataTableOptions();
    this.selectedContractId = this._tellinkApiService.selectedContract.id;
  }

  public ngAfterViewInit(): void
  {
    this.dtTrigger.next();
    this.addHighlightLayerInProjectMap();
  }

  public ngAfterContentInit(): void
  {
    this.reloadRecordsAndHighlightedElementsLayer();
  }

  private addHighlightLayerInProjectMap():void
  {
    const baseUrl = this.project.url_base.split('wms?')[0] + "wms?";

    const layerStructure = Object.keys( this.projectLayerStyles )[0];

    this.highlightedElementsLayer = new LeafletWms.overlay(baseUrl, ({
      layers: layerStructure.split("#").join("_"),
      styles: "buffer_linea",
      className: "informacion_seleccionado",
      format: 'image/png',
      crossOrigin: true,
      transparent: true,
      opacity: 1,
      maxNativeZoom: 22,
      maxZoom: 22,
      tiled: false,
      cql_filter: null,
      env: "buffer:30",
    } as any));

    this.ProjectMap.map.addLayer( this.highlightedElementsLayer );

    this.highlightedElementsLayer.bringToBack();

    this.updateHiglightedElementsLayer();
  }
  
  public updateHiglightedElementsLayer():void
  {
    const commandCenterNames = this.commandCenters.filter(cm => ! cm.status_flag).map(cm => `'${cm.name}'`);

    (this.highlightedElementsLayer.wmsParams as any).cql_filter = `descripcion IN (${commandCenterNames.join(", ")})`;
    this.highlightedElementsLayer.setParams(({fake: Date.now()} as any));
  }

  public buildDataTableOptions():void
  {
    this.dtOptions = {
      stripeClasses: [],
      pagingType: 'full_numbers',
      lengthMenu: [ [10, 25, 50, -1], [10, 25, 50, "Todos"] ],
      pageLength: 10,
      scrollY: '50vh',
      scrollX: true,
      scrollCollapse: true,
      order: [[0,'asc']],
      columns: [
        {searchable: true, orderable: true, width: "33%" },
        {searchable: true, orderable: true, type: "date", width: "33%" },
        {searchable: false, orderable: false, width: "33%" },
      ],
      buttons: [],
      autoWidth: false,
      dom: 'Brt<"row m-0 justify-content-center"<"col-10"i><"col-10"p>>',
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

  public onChangeContractSelector(contract:Contract):void
  {
    this._tellinkApiService.setContract(contract);
    this.reloadRecordsAndHighlightedElementsLayer();
  }

  public async reloadRecordsAndHighlightedElementsLayer():Promise<void>
  {
    try
    {
      this.showSpinner = true;
            
      this.commandCenters = await this._tellinkApiService.getCmsByProvince( this._projectService.province );
      
      this.rerenderTable();

      this.updateHiglightedElementsLayer();

    }
    catch(error)
    {
      this._toastrService.error(error.message,"Error");
    }
    finally
    {
      this.showSpinner = false;
    }
  }

  public rerenderTable(): void
  { 
    this.dtElement.dtInstance.then((dtInstance: DataTables.Api) => {
     dtInstance.destroy();
     this.dtTrigger.next();
    });
  }

  public async showCmInMap(cm:CommandCenter):Promise<void>
  {
    try
    {  
      const latLng = {
        lat: Number.parseFloat(cm.latitude),
        lng: Number.parseFloat(cm.longitude)
      };
  
      this.ProjectMap.updateMapMarkerPosition(latLng);

      this.cmLocatedInMap = cm;
    }
    catch (error)
    {
     this._toastrService.error("El centro de mando no ha podido ser localizado. <br> Intente configurar la ubicación del mismo.", "Error"); 
    }
  }

  public showActionsModal(cm:CommandCenter):void
  {
    this.actionRoutes = [
      {
        title: "Detalles",
        iconSrc: "assets/icons/visualizar.svg",
        path: `${cm.id}`
      }
    ];

    if( ! cm.status_flag )
    {
      this.actionRoutes.push(
        {
          title: "Editar",
          iconSrc: "assets/icons/SVG/EDITAR.svg",
          path: `${cm.id}/editar`
        },
        {
          title: "Actuaciones",
          iconSrc: "assets/icons/SVG/CONFIGURAR.svg",
          path: `${cm.id}/actuaciones`
        },
        {
          title: "Medidas",
          iconSrc: "assets/icons/SVG/GRAFICA.svg",
          path: `${cm.id}/medidas`
        },
        {
          title: "Alarmas recibidas",
          iconSrc: "assets/icons/SVG/INCIDENCIA.svg",
          path: `${cm.id}/alarmas-recibidas`
        },
      );
    }

    this.actionsModal.show();
  }
  
  public async deleteCm(cm:CommandCenter):Promise<void>
  {
    try
    {
      const userResponse = await showPreconfirmMessage(
        "¿Eliminar centro de mando?",
        "Esta acción no es reversible."
      );

      if( userResponse.isConfirmed )
      {
        this._spinnerService.show();

        await this._tellinkApiService.deleteCm( cm.id );

        this.reloadRecordsAndHighlightedElementsLayer();

        this._toastrService.success("Centro de mando eliminado.","Exito!");
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
  }
}
