import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { TellinkApiService } from '../../../../../../../../../../../../../services/medium/tellink-api.service';
import { Contract } from '../../../../../../../../../../../../../interfaces/medium/tellink/contract';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { esLocale}  from 'ngx-bootstrap/locale';
import { BsLocaleService } from 'ngx-bootstrap/datepicker';
import { defineLocale } from 'ngx-bootstrap/chronos';
import { SpinnerService } from '../../../../../../../../../../../../../services/spinner.service';
import { Project, ConfiguracionDeProyecto } from '../../../../../../../../../../../../../interfaces/project';
import LeafletWms from 'leaflet.wms';
import { ProjectMapComponent } from '../../../../../../../../../../../../shared/project-map/project-map.component';
import { TileLayer } from 'leaflet';
import { ProjectService } from 'src/app/services/unic/project.service';
import { PerformanceProfile } from '../../../../../../../../../../../../../interfaces/medium/tellink/performance-profile';
import { AlarmProfile } from 'src/app/interfaces/medium/tellink/alarm-profile';
import { ApiService } from 'src/app/services/api.service';
import { GeoJSONHelper } from '../../../../../../../../../../../../../models/geojson-helper';
import { fadeInOnEnterAnimation, fadeOutOnLeaveAnimation } from 'angular-animations';
import { Router } from '@angular/router';
import { CommandCenter } from '../../../../../../../../../../../../../interfaces/medium/tellink/command-center';
defineLocale('es', esLocale);

@Component({
  templateUrl: './create.component.html',
  styleUrls: [
    '../../../../../../../../../../../../../../themes/styles/default-view.scss',
    './create.component.css',
  ],
  animations: [
    fadeInOnEnterAnimation({duration: 250}),
    fadeOutOnLeaveAnimation({duration: 250})
  ]
})
export class CreateComponent implements OnInit, AfterViewInit
{
  public form:FormGroup;

  public numberOfInputs:Array<void> = Array(8);
  
  public numberOfOutputs:Array<void> = Array(3);
    
  public projectLayerStyles:any;

  public loadingContractData:boolean = false;
  public commandCenterNames:{[attribute:string]:string|number}[] = []; 
  public performanceProfiles:Array<PerformanceProfile> = []; 
  public alarmProfiles:Array<AlarmProfile> = []; 
  
  private highlightedElementsLayer:TileLayer.WMS;

  @ViewChild(ProjectMapComponent)
  public ProjectMap:ProjectMapComponent;

  constructor(
    private _tellinkApiService:TellinkApiService,
    private _apiService:ApiService,
    private _toastrService:ToastrService,
    private _bsLocaleService:BsLocaleService,
    private _spinnerService:SpinnerService,
    private _projectService:ProjectService,
    private router:Router
  )
  {
    this._bsLocaleService.use('es');

    this.form = new FormGroup({
      // configuracion basica
      // contrato
      contract_id: new FormControl(null, Validators.required),
      // nombre de CM
      name: new FormControl(null, Validators.required),
      // descripcion
      description: new FormControl(null),
      // direccion
      address: new FormControl(null),
      // version
      panel_version: new FormControl(2, [Validators.min(1), Validators.max(2)]),
      // tiene GPS
      automatic_gps: new FormControl(0),
      // latitud
      latitude: new FormControl(null, Validators.required),
      // longitud
      longitude: new FormControl(null, Validators.required),
      // Telegestion
      // numero de serie analizador
      counter_address: new FormControl(null, [Validators.required, Validators.minLength(12), Validators.maxLength(12) ]),
      // direccion de enlace
      link_address: new FormControl(null, [Validators.required, Validators.minLength(2), Validators.maxLength(2)]),
      // punto de medida
      measure_point: new FormControl(1, [Validators.required, Validators.min(1)]),
      // numero de circuitos de alumbrado
      number_of_circuits: new FormControl(null),
      // Perfil de salida 1
      on_off_schedule1_profile_id: new FormControl(0, Validators.required),
      // Perfil de salida 2
      on_off_schedule2_profile_id: new FormControl(0, Validators.required),
      // Perfil de salida 3
      on_off_schedule3_profile_id: new FormControl(0, Validators.required),
      // Perfil de alarmas
      alarm_profile_id: new FormControl(0, Validators.required),
      // configuracion avanzada
      // CUPS
      supply_code: new FormControl(null),
      // contador
      electric_counter: new FormControl(null),
      // puerto
      tcp_port: new FormControl(40001, Validators.required),
      // IP
      ip: new FormControl(null, Validators.required),
      // SIM proveedor
      provider_sim: new FormControl(null),
      // SIM Nº de Serie
      serial_number_sim: new FormControl(null),
      // Nº de Serie UCC
      serial_number_ucc: new FormControl(null),
      // fecha de inicio (actual por defecto)
      automatic_start_date: new FormControl(new Date()),
      // Proceso Automático*
      automatic: new FormControl(null, Validators.required),
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
      this.form.addControl(`input${(i + 1)}_name`, new FormControl(null))

    // salidas N 
    for( let i = 0; i < this.numberOfOutputs.length; i++ )
      this.form.addControl(`output${(i + 1)}_name`, new FormControl(null))
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

  public ngOnInit():void 
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

    if( this.userContracts.length === 1 )
    {
      this.form.patchValue({contract_id: this.userContracts[0].id});
      this.onChangeContractSelector(this.userContracts[0]);
    }
  }

  public ngAfterViewInit(): void
  {
    this.addHighlightLayerInProjectMap();
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
  }

  public getFormValue(controlName:string):any
  {
    return this.form.get(controlName).value;
  }
  
  public async onChangeContractSelector(contract:Contract):Promise<void>
  {
    try
    {
      // limpiar perfiles de actuaciones y el de alarma,
      // debido a que listados son actualizados por cambio de contrato.
      this.form.patchValue({ 
        "on_off_schedule1_profile_id": 0,
        "on_off_schedule2_profile_id": 0,
        "on_off_schedule3_profile_id": 0,
        "on_off_schedule_send": 0
      });

      this.loadingContractData = true;

      this.performanceProfiles = await this._tellinkApiService.getPerformanceProfilesByContract(contract.id);
      this.performanceProfiles.unshift(({id: 0, name: "Ninguno"} as any));
      
      this.alarmProfiles = await this._tellinkApiService.getAlarmProfilesByContract(contract.id);
      this.alarmProfiles.unshift(({id: 0, name: "Ninguno"} as any));

      // Tanto en perfiles de actuacion como de alarmas, la opcion "Ninguno" tiene
      // valor 0. Valor 0 significa que no esta en uso la salida o alarma. 

      await this.setUnregisteredCommandCenter(contract.id);
    }
    catch(error)
    {
      this._toastrService.error(error.message,"Error");
    }
    finally
    {
      this.loadingContractData = false; 
    }
  }

  private async setUnregisteredCommandCenter(contractId:number):Promise<void>
  {
    try
    {
      const cmsRegisteredInTellink = await this._tellinkApiService.getCmsByProvince(this._projectService.province, contractId);

      const allCommandCenters = (await this._apiService.postNewApi(
        "proyectos/gis-smart-energy/centro-mando/lista.py", {
        "id_proyecto": this.project.id_proyecto,
        "atributos": [
            "descripcion",
            "localizacion",
            "geometria_leaflet",
            "geometria"
        ]
      })).datos;

      this.commandCenterNames = allCommandCenters.filter(cm => ! cmsRegisteredInTellink.some(_cm => _cm.name === cm['descripcion']));
      
    }
    catch (error)
    {
      throw error;  
    }
  }

  public onSelectCm(cm:{[attribute:string]:string|number}):void
  {
    let point = GeoJSONHelper.stringToGeometry((cm.geometria_leaflet as string));

    this.ProjectMap.updateMapMarkerPosition({lat: (point.coordinates[1] as number), lng: (point.coordinates[0] as number)});

    this.updateHiglightedElementsLayer();

    this.form.patchValue({
      address: cm.localizacion,
      latitude: point.coordinates[1],
      longitude: point.coordinates[0]
    });
  }

  public updateHiglightedElementsLayer(empty:boolean = false):void
  {
    (this.highlightedElementsLayer.wmsParams as any).cql_filter = empty ? '' : `descripcion IN ('${this.form.get("name").value}')`;
    this.highlightedElementsLayer.setParams(({fake: Date.now()} as any));
  }
  
  public async onSubmit():Promise<void>
  {
    try
    {
      this._spinnerService.updateText("Creando centro de mando...");
      this._spinnerService.show();

      const data = this.getFormData();

      await this._tellinkApiService.createCm(data);

      this._toastrService.success("Centro de mando creado.","Exito!");

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
    const data = this.form.value;

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

}
