import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { esLocale}  from 'ngx-bootstrap/locale';
import { BsLocaleService } from 'ngx-bootstrap/datepicker';
import { defineLocale } from 'ngx-bootstrap/chronos';
import { SpinnerService } from '../../../../../../../../../../../../../../../services/spinner.service';
import { ActivatedRoute, Router } from '@angular/router';
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
import { fadeInOnEnterAnimation, fadeOutOnLeaveAnimation } from 'angular-animations';
defineLocale('es', esLocale);

@Component({
  templateUrl: './edit.component.html',
  styleUrls: [
    '../../../../../../../../../../../../../../../../themes/styles/default-view.scss',
    './edit.component.css',
  ],
  animations: [
    fadeInOnEnterAnimation({duration: 250}),
    fadeOutOnLeaveAnimation({duration: 250})
  ]
})
export class EditComponent implements OnInit, AfterViewInit, OnDestroy
{
  public form:FormGroup;

  public numberOfInputs:Array<void> = Array(8);
  
  public numberOfOutputs:Array<void> = Array(3);
    
  private routeDataSubscription:Subscription;

  public projectLayerStyles:any;

  public loadingContractData:boolean = false;
  public performanceProfiles:Array<PerformanceProfile> = []; 
  public alarmProfiles:Array<AlarmProfile> = []; 
  
  public enableCmManualPositioning:boolean = false;

  private highlightedElementsLayer:TileLayer.WMS;

  @ViewChild(ProjectMapComponent)
  public ProjectMap:ProjectMapComponent;

  public cm:CommandCenter;

  constructor(
    private _tellinkApiService:TellinkApiService,
    private _toastrService:ToastrService,
    private _bsLocaleService:BsLocaleService,
    private _spinnerService:SpinnerService,
    private _projectService:ProjectService,
    private _changeDetectorRef:ChangeDetectorRef,
    private route:ActivatedRoute,
    private router:Router
  )
  {
    this._bsLocaleService.use('es');
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
      contract_name: new FormControl({value:this.cm.contract_name, disabled: true}),
      // name
      name: new FormControl({value:this.cm.name, disabled: true}),
      // descripcion
      description: new FormControl(this.cm.description),
      // direccion
      address: new FormControl(this.cm.address),
      // latitud
      latitude: new FormControl({value:this.cm.latitude, disabled: true}, Validators.required),
      // longitud
      longitude: new FormControl({value:this.cm.longitude, disabled: true}, Validators.required),
      // version
      panel_version: new FormControl(this.cm.panel_version, [Validators.min(1), Validators.max(2)]),
      // tiene GPS
      automatic_gps: new FormControl(this.cm.automatic_gps),
      // Telegestion
      // numero de serie analizador
      counter_address: new FormControl(this.cm.counter_address, [Validators.required, Validators.minLength(12), Validators.maxLength(12)]),
      // direccion de enlace
      link_address: new FormControl(this.cm.link_address, [Validators.required, Validators.minLength(2), Validators.maxLength(2)]),
      // punto de medida
      measure_point: new FormControl(this.cm.measure_point),
      // numero de circuitos de alumbrado
      number_of_circuits: new FormControl(this.cm.number_of_circuits),
      // Perfil de salida 1
      on_off_schedule1_profile_id: new FormControl(this.cm.on_off_schedule1_profile_id, Validators.required),
      // Perfil de salida 2
      on_off_schedule2_profile_id: new FormControl(this.cm.on_off_schedule2_profile_id, Validators.required),
      // Perfil de salida 3
      on_off_schedule3_profile_id: new FormControl(this.cm.on_off_schedule3_profile_id, Validators.required),
      // Perfil de alarmas
      alarm_profile_id: new FormControl(this.cm.alarm_profile_id, Validators.required),
      // configuracion avanzada
      // CUPS
      supply_code: new FormControl(this.cm.supply_code),
      // contador
      electric_counter: new FormControl(this.cm.electric_counter),
      // puerto
      tcp_port: new FormControl(this.cm.tcp_port, Validators.required),
      // IP
      ip: new FormControl(this.cm.ip, Validators.required),
      // SIM proveedor
      provider_sim: new FormControl(this.cm.provider_sim),
      // SIM Nº de Serie
      serial_number_sim: new FormControl(this.cm.serial_number_sim),
      // Nº de Serie UCC
      serial_number_ucc: new FormControl(this.cm.serial_number_ucc),
      // fecha de inicio 
      automatic_start_date: new FormControl( new Date( this.cm.automatic_start_date ) ),
      // Proceso Automático
      automatic: new FormControl(Boolean(this.cm.automatic).toString(), Validators.required),
    });

    /**
     * Campos  
     * on_off_schedule1 (activar perfil de salida 1),
     * on_off_schedule2 (activar perfil de salida 2),
     * on_off_schedule3 (activar perfil de salida 3),
     * on_off_schedule_send (enviar perfil de salida:),
     * alarm_send (enviar el perfil de alarmas) 
     * se agregan al enviar el formulario. Sus valores
     * son determinado es funcion a las salidas que se les 
     * haya seleccionado perfil de actuacion, como tambien
     * si se selecciona un pefil de alarmas.
    */

    // entradas N
    for( let i = 0; i < this.numberOfInputs.length; i++ )
      this.form.addControl(`input${(i + 1)}_name`, new FormControl(this.cm[`input${(i + 1)}_name`]))

    // salidas N 
    for( let i = 0; i < this.numberOfOutputs.length; i++ )
      this.form.addControl(`output${(i + 1)}_name`, new FormControl(this.cm[`output${(i + 1)}_name`]))
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
      this.loadingContractData = true;

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
   finally
   {
      this.loadingContractData = false;
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

  public onMapClick(latLang:{x:number, y:number}):void
  {    
    this.form.patchValue({
      "longitude": latLang.x,
      "latitude": latLang.y
    });
  }

  public toggleEnableCmManualPositioning():void
  {
    this.enableCmManualPositioning = ! this.enableCmManualPositioning;

    if( this.enableCmManualPositioning )
    {
      this.form.get("latitude").enable();
      this.form.get("longitude").enable();
    }
    else
    {
      this.form.get("latitude").disable();
      this.form.get("longitude").disable();
    }

    this._changeDetectorRef.detectChanges();
  }

  public updateMapMarkerPosition():void
  {
    const lat = Number.parseFloat( this.form.get("latitude").value ),
          lng = Number.parseFloat( this.form.get("longitude").value );

    this.ProjectMap.updateMapMarkerPosition({lat, lng});
  }

  public async onSubmit():Promise<void>
  {
    try
    {
      this._spinnerService.updateText("Actualizando centro de mando...");
      this._spinnerService.show();

      const data = this.getFormData();

      await this._tellinkApiService.updateCm(this.cm.id, data);

      this._toastrService.success("Centro de mando actualizado.","Exito!");
      
      this.router.navigate([`/medium/home/proyectos/${this.project.id_proyecto}/tellink/centros-de-mando`]);
    }
    catch (error)
    {
      this._toastrService.error(error.message,"Error");
    }
    finally
    {
      this._spinnerService.hide();
      this._spinnerService.cleanText();
    }
  }

  private getFormData():CommandCenter
  {
    try
    {
      this.form.get("latitude").enable();
      this.form.get("longitude").enable();

      const data = this.form.value;

      delete data.contract_name;
      delete data.name;

      // provincia y ubicacion se toman de la config. de proyecto.
      data["province"] = this.projectConfiguration.datos_municipio.provincia;
      data["location"] = this.projectConfiguration.datos_municipio.nombre;
      
      // estado "Activo" de una salida se determina si se selecciono un perfil de 
      // actuacion para esta.
      data["on_off_schedule1"] = Number( data["on_off_schedule1_profile_id"] !== 0);
      data["on_off_schedule2"] = Number( data["on_off_schedule2_profile_id"] !== 0);
      data["on_off_schedule3"] = Number( data["on_off_schedule3_profile_id"] !== 0);

      // estado "Activo" de "enviar perfil de salida" se determina 
      // si se selecciono un perfil de actuacion para alguna salida.
      data["on_off_schedule_send"] = Number(
        data["on_off_schedule1"]  ||
        data["on_off_schedule2"]  ||
        data["on_off_schedule3"]  
      );

      // estado "Activo" de "enviar perfil de alarma" se determina
      // si selecciono un perfil de alarma. 
      data["alarm_send"] = Number( data["alarm_profile_id"] !== 0 );
      
      // "Proceso automatico" debe ser numerico.
      data["automatic"] = Number(data["automatic"]);

      // GPS automatico solo aplica en CM version 2.
      if(data["panel_version"] === 1)   
        data["automatic_gps"] = 0;   
      else
        data["automatic_gps"] = Number( data["automatic_gps"] );   
        
      return data;
    }
    finally
    {
      if( ! this.enableCmManualPositioning )
      {
        this.form.get("latitude").disable();
        this.form.get("longitude").disable();
      }
    }
  }

  public ngOnDestroy(): void
  {
    this.routeDataSubscription.unsubscribe();
  }
}

