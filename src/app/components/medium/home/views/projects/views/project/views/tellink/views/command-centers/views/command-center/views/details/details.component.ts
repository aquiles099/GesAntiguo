import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { Project, ConfiguracionDeProyecto } from '../../../../../../../../../../../../../../../interfaces/project';
import LeafletWms from 'leaflet.wms';
import { ProjectMapComponent } from '../../../../../../../../../../../../../../shared/project-map/project-map.component';
import { TileLayer } from 'leaflet';
import { ProjectService } from 'src/app/services/unic/project.service';
import { PerformanceProfile } from '../../../../../../../../../../../../../../../interfaces/medium/tellink/performance-profile';
import { AlarmProfile } from 'src/app/interfaces/medium/tellink/alarm-profile';
import { CommandCenter } from 'src/app/interfaces/medium/tellink/command-center';
import { TellinkApiService } from '../../../../../../../../../../../../../../../services/medium/tellink-api.service';

@Component({
  templateUrl: './details.component.html',
  styleUrls: [
    '../../../../../../../../../../../../../../../../themes/styles/default-view.scss',
    './details.component.css',
  ]
})
export class DetailsComponent implements OnInit, AfterViewInit, OnDestroy
{
  public form:FormGroup;

  public numberOfInputs:Array<void> = Array(8);
  
  public numberOfOutputs:Array<void> = Array(3);
    
  private routeDataSubscription:Subscription;

  public projectLayerStyles:any;

  public performanceProfiles:Array<PerformanceProfile> = []; 
  public alarmProfiles:Array<AlarmProfile> = []; 
  
  private highlightedElementsLayer:TileLayer.WMS;

  @ViewChild(ProjectMapComponent)
  public ProjectMap:ProjectMapComponent;

  public cm:CommandCenter;

  constructor(
    private _tellinkApiService:TellinkApiService,
    private _toastrService:ToastrService,
    private _projectService:ProjectService,
    public route:ActivatedRoute
  )
  {
  }

  get project():Project
  {
    return this._projectService.project;
  }

  get projectConfiguration():ConfiguracionDeProyecto
  {
    return this._projectService.configuration;
  }

  public async ngOnInit():Promise<void> 
  {
    this.routeDataSubscription = this.route.parent.data.subscribe(data => {
            
      this.cm = data.cm;

      this.buildForm();
      
      this.setPerformanceAndAlarmProfiles();

    });

    this.setOnlyCmLayerStyle();
  }

  private buildForm():void
  {
    this.form = new FormGroup({
      // configuracion basica
      // contract_name
      contract_name: new FormControl(this.cm.contract_name),
      // name
      name: new FormControl(this.cm.name),
      // descripcion
      description: new FormControl(this.cm.description),
      // direccion
      address: new FormControl(this.cm.address),
      // latitud (en proyeccion de proyecto)
      latitude: new FormControl(this.cm.latitude),
      // longitud (en proyeccion de proyecto)
      longitude: new FormControl(this.cm.longitude),
      // version
      panel_version: new FormControl(this.cm.panel_version),
      // tiene GPS
      automatic_gps: new FormControl(this.cm.automatic_gps),
      // Telegestion
      // numero de serie analizador
      counter_address: new FormControl(this.cm.counter_address),
      // direccion de enlace
      link_address: new FormControl(this.cm.link_address),
      // punto de medida
      measure_point: new FormControl(1),
      // numero de circuitos de alumbrado
      number_of_circuits: new FormControl(this.cm.number_of_circuits),
      // Perfil de salida 1
      on_off_schedule1_profile_id: new FormControl(this.cm.on_off_schedule1_profile_id),
      // Perfil de salida 2
      on_off_schedule2_profile_id: new FormControl(this.cm.on_off_schedule2_profile_id),
      // Perfil de salida 3
      on_off_schedule3_profile_id: new FormControl(this.cm.on_off_schedule3_profile_id),
      // Perfil de alarmas
      alarm_profile_id: new FormControl(this.cm.alarm_profile_id),
      // configuracion avanzada
      // CUPS
      supply_code: new FormControl(this.cm.supply_code),
      // contador
      electric_counter: new FormControl(this.cm.electric_counter),
      // puerto
      tcp_port: new FormControl(this.cm.tcp_port),
      // IP
      ip: new FormControl(this.cm.ip),
      // SIM proveedor
      provider_sim: new FormControl(this.cm.provider_sim),
      // SIM Nº de Serie
      serial_number_sim: new FormControl(this.cm.serial_number_sim),
      // Nº de Serie UCC
      serial_number_ucc: new FormControl(this.cm.serial_number_ucc),
      // fecha de inicio (actual por defecto)
      automatic_start_date: new FormControl( new Date( this.cm.automatic_start_date) ),
      // Proceso Automático*
      automatic: new FormControl(Boolean(this.cm.automatic).toString()),
    });

    // entradas N
    for( let i = 0; i < this.numberOfInputs.length; i++ )
      this.form.addControl(`input${(i + 1)}_name`, new FormControl(this.cm[`input${(i + 1)}_name`]))

    // salidas N 
    for( let i = 0; i < this.numberOfOutputs.length; i++ )
      this.form.addControl(`output${(i + 1)}_name`, new FormControl(this.cm[`output${(i + 1)}_name`]))

    this.form.disable();
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
 
  public async setPerformanceAndAlarmProfiles():Promise<void>
  {
   try
   {
      this.performanceProfiles = await this._tellinkApiService.getPerformanceProfilesByContract(this.cm.contract_id);
      this.performanceProfiles.unshift(({id: 0, name: "Ninguno"} as any));
      
      this.alarmProfiles = await this._tellinkApiService.getAlarmProfilesByContract(this.cm.contract_id);
      this.alarmProfiles.unshift(({id: 0, name: "Ninguno"} as any));

      // Tanto en perfiles de actuacion como de alarmas, la opcion "Ninguno" tiene
      // valor 0. Valor 0 significa que no esta en uso la salida o alarma. 
   }
   catch (error)
   {
      this._toastrService.error(error.message,"Error");  
   }
  }

  public ngAfterViewInit(): void
  {
    this.addHighlightLayerInProjectMap();

    this.updateMapMarkerPosition();
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
    (this.highlightedElementsLayer.wmsParams as any).cql_filter = `descripcion IN ('${this.form.get("name").value}')`;
    this.highlightedElementsLayer.setParams(({fake: Date.now()} as any));
  }

  public getFormValue(controlName:string):any
  {
    return this.form.get(controlName).value;
  }

  public updateMapMarkerPosition():void
  {
    const lat = Number.parseFloat( this.form.get("latitude").value ),
          lng = Number.parseFloat( this.form.get("longitude").value );

    this.ProjectMap.updateMapMarkerPosition({lat, lng});
  }

  public ngOnDestroy(): void
  {
    this.routeDataSubscription.unsubscribe();
  }
}

