import { Component, OnInit, OnDestroy } from '@angular/core';
import { TellinkApiService } from '../../../../../../../../../../../../services/medium/tellink-api.service';
import { Contract } from '../../../../../../../../../../../../interfaces/medium/tellink/contract';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { SpinnerService } from '../../../../../../../../../../../../services/spinner.service';
import { Router, ActivatedRoute } from '@angular/router';
import { AlarmProfile } from '../../../../../../../../../../../../interfaces/medium/tellink/alarm-profile';
import { Subscription } from 'rxjs';

@Component({
  templateUrl: './edit.component.html',
  styleUrls: [
    '../../../../../../../../../../../../../themes/styles/default-view.scss',
    './edit.component.css',
  ]
})
export class EditComponent implements OnInit, OnDestroy
{
  public alarmProfile:AlarmProfile;

  public form:FormGroup;

  public notificationReceiversNumber:Array<void> = Array(3);

  public numberOfInputs:Array<void> = Array(8);
  
  public numberOfOutputs:Array<void> = Array(3);

  public numberOfPhases:Array<void> = Array(3);

  public alarmStatesWithSending:{key:string, value:number}[]  = [
    {key: "Deshabilitado", value: 0},
    {key: "Registrar, no enviar", value: 1},
    {key: "Registrar y enviar", value: 2}
  ];

  public alarmStates:{key:string, value:number}[]  = [
    {key: "Deshabilitado", value: 0},
    {key: "Registrar, no enviar", value: 1}
  ];

  public routeDataSubscription:Subscription;

  constructor(
    private _tellinkApiService:TellinkApiService,
    private _toastrService:ToastrService,
    private _spinnerService:SpinnerService,
    private router:Router,
    private route:ActivatedRoute
  )
  {
    this.form = new FormGroup({
      // Nombre
      name: new FormControl(null, [Validators.required]),
      // Contrato
      contract_id: new FormControl(null, [Validators.required]),
      // Fecha de alta
      date: new FormControl(new Date, [Validators.required]),
      // Equipo ON
      switch_on: new FormControl(1, [Validators.required]),
      // Equipo OFF
      switch_off: new FormControl(1, [Validators.required]),
      // Señal Baja de Red Móvil
      low_GSM_signal: new FormControl(1, [Validators.required]),
      // Sin datos red móvil (GPRS Off)
      no_GPRS_data: new FormControl(1, [Validators.required]),
      // Error Conex. analizador
      meter_error: new FormControl(1, [Validators.required]),
      // Alarma potencia Max relé OFF (kW) xx,xx
      max_power_rele_off: new FormControl(1, [Validators.required]),
      // Potencia Max relé OFF (kW) xx,xx
      max_power_value_rele_off: new FormControl(0.2, [Validators.required, Validators.min(0), Validators.max(99)]),
      // Alarma Potencia Max relé ON (kW) xx,xx
      max_power_rele_on: new FormControl(1, [Validators.required]),
      // Potencia Max relé ON (kW) xx,xx
      max_power_value_rele_on: new FormControl(10, [Validators.required, Validators.min(0), Validators.max(99)]),
      // Alarma Min. factor de potencia
      min_power_factor: new FormControl(1, [Validators.required]),
      // Min. factor de potencia
      power_factor: new FormControl(0.75, [Validators.required, Validators.min(0.1), Validators.max(.99)]),
      // Establecer Tensión Min (V) Fases 1, 2 y 3
      min_voltage_value: new FormControl(180, [Validators.required, Validators.min(150), Validators.max(255)]),
      // Establecer Tensión Max (V) Fases 1, 2 y 3
      max_voltage_value: new FormControl(250, [Validators.required, Validators.min(150), Validators.max(255)]),
      // Error de GPS 
      gps_error: new FormControl(0, [Validators.required])
    });

    // Destinatarios N de notificaciones N (warning_mail_N)
    for( let i = 0; i < this.notificationReceiversNumber.length; i++ )
      this.form.addControl(`warning_mail_${(i + 1)}`, new FormControl(null, Validators.email))
   
    // entradas N ON (inputN)
    for( let i = 0; i < this.numberOfInputs.length; i++ )
      this.form.addControl(`input${(i + 1)}`, new FormControl(0, Validators.required))

    // salidas N: ON / OFF rele (on_releN)
    for( let i = 0; i < this.numberOfOutputs.length; i++ )
    {
      this.form.addControl(`on_rele${(i + 1)}`, new FormControl(1, Validators.required));
      this.form.addControl(`off_rele${(i + 1)}`, new FormControl(1, Validators.required));
    }
   
    // Fase N: Alarma Corriente Min con relé ON (A) xx,x (min_current_rele_on_phaseN).
    // Fase N: Corriente Min con relé ON (A) xx,x (min_current_value_rele_on_phaseN).
    // Fase N: Alarma Corriente Max con relé ON (A) xx,x. (max_current_rele_on_phaseN)
    // Fase N: Corriente Max con relé ON (A) xx,x. (max_current_value_rele_on_phaseN)
    // Fase N: Alarma Corriente Max con relé OFF (A) xx,x. (max_current_rele_off_phaseN)
    // Fase N: Corriente Max con relé OFF (A) xx,x. (max_current_value_rele_off_phaseN)
    // Fase N: Tensión Min (V). (min_voltage_phaseN)
    // Fase N: Tensión Max (V). (max_voltage_phaseN)
    for( let i = 0; i < this.numberOfPhases.length; i++ )
    {
      this.form.addControl(`min_current_rele_on_phase${(i + 1)}`, new FormControl(1, [Validators.required]));
      this.form.addControl(`min_current_value_rele_on_phase${(i + 1)}`, new FormControl(1, [Validators.required, Validators.min(0.1), Validators.max(99.9)]));
      this.form.addControl(`max_current_rele_on_phase${(i + 1)}`, new FormControl(1, [Validators.required]));
      this.form.addControl(`max_current_value_rele_on_phase${(i + 1)}`, new FormControl(50, [Validators.required, Validators.min(0.1), Validators.max(99.9)]));
      this.form.addControl(`max_current_rele_off_phase${(i + 1)}`, new FormControl(1, [Validators.required]));
      this.form.addControl(`max_current_value_rele_off_phase${(i + 1)}`, new FormControl(0.5, [Validators.required, Validators.min(0.1), Validators.max(99.9)]));
      this.form.addControl(`min_voltage_phase${(i + 1)}`, new FormControl(1, [Validators.required]));
      this.form.addControl(`max_voltage_phase${(i + 1)}`, new FormControl(1, [Validators.required]));
    }
  }

  get userContracts():Contract[]
  {
    return this._tellinkApiService.userContracts;
  }

  public ngOnInit(): void
  {
    if( this.userContracts.length === 1 )
      this.form.patchValue({"contract_id": this._tellinkApiService.selectedContract.id});

    this.routeDataSubscription = this.route.data.subscribe(data => {
            
      this.alarmProfile = data.alarmProfile;

      for( let [key, value] of Object.entries(data.alarmProfile))
      {
        if( value === "null" )
          data.alarmProfile[key] = null;
      } 
      
      this.form.patchValue(data.alarmProfile);

    });
  }

  public getFormControl(controlName:string):any
  {
    return this.form.get(controlName);
  }
  
  public async onSubmit():Promise<void>
  {
    try
    {
      this._spinnerService.updateText("Actualizando perfil de alarma...");
      this._spinnerService.show();

      await this._tellinkApiService.updateAlarmProfile( this.alarmProfile.id, this.form.value );

      this._toastrService.success("Perfil de alarma actualizado.","Exito!");

      this.router.navigate([`../..`], {relativeTo: this.route});
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

  public ngOnDestroy(): void
  {
    this.routeDataSubscription.unsubscribe();
  }
}

