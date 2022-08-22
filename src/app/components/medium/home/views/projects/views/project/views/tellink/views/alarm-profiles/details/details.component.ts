import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AlarmProfile } from '../../../../../../../../../../../../interfaces/medium/tellink/alarm-profile';
import { Subscription } from 'rxjs';

@Component({
  templateUrl: './details.component.html',
  styleUrls: [
    '../../../../../../../../../../../../../themes/styles/default-view.scss',
    './details.component.css',
  ]
})
export class DetailsComponent implements OnInit, OnDestroy
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
    private route:ActivatedRoute,
    private router:Router
  )
  {
    this.form = new FormGroup({
      // Nombre
      name: new FormControl(null),
      // Contrato
      contract_name: new FormControl(null),
      // Fecha de alta
      date: new FormControl(new Date),
      // Equipo ON
      switch_on: new FormControl(1),
      // Equipo OFF
      switch_off: new FormControl(1),
      // Señal Baja de Red Móvil
      low_GSM_signal: new FormControl(1),
      // Sin datos red móvil (GPRS Off)
      no_GPRS_data: new FormControl(1),
      // Error Conex. analizador
      meter_error: new FormControl(1),
      // Alarma potencia Max relé OFF (kW) xx,xx
      max_power_rele_off: new FormControl(1),
      // Potencia Max relé OFF (kW) xx,xx
      max_power_value_rele_off: new FormControl(0.2),
      // Alarma Potencia Max relé ON (kW) xx,xx
      max_power_rele_on: new FormControl(1),
      // Potencia Max relé ON (kW) xx,xx
      max_power_value_rele_on: new FormControl(10),
      // Alarma Min. factor de potencia
      min_power_factor: new FormControl(1),
      // Min. factor de potencia
      power_factor: new FormControl(0.75),
      // Establecer Tensión Min (V) Fases 1, 2 y 3
      min_voltage_value: new FormControl(180),
      // Establecer Tensión Max (V) Fases 1, 2 y 3
      max_voltage_value: new FormControl(250),
      // Error de GPS 
      gps_error: new FormControl(0)
    });

    // Destinatarios N de notificaciones N (warning_mail_N)
    for( let i = 0; i < this.notificationReceiversNumber.length; i++ )
      this.form.addControl(`warning_mail_${(i + 1)}`, new FormControl(null, Validators.email))
   
    // entradas N ON (inputN)
    for( let i = 0; i < this.numberOfInputs.length; i++ )
      this.form.addControl(`input${(i + 1)}`, new FormControl(0, ))

    // salidas N: ON / OFF rele (on_releN)
    for( let i = 0; i < this.numberOfOutputs.length; i++ )
    {
      this.form.addControl(`on_rele${(i + 1)}`, new FormControl(1, ));
      this.form.addControl(`off_rele${(i + 1)}`, new FormControl(1, ));
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
      this.form.addControl(`min_current_rele_on_phase${(i + 1)}`, new FormControl(1));
      this.form.addControl(`min_current_value_rele_on_phase${(i + 1)}`, new FormControl(1));
      this.form.addControl(`max_current_rele_on_phase${(i + 1)}`, new FormControl(1));
      this.form.addControl(`max_current_value_rele_on_phase${(i + 1)}`, new FormControl(50));
      this.form.addControl(`max_current_rele_off_phase${(i + 1)}`, new FormControl(1));
      this.form.addControl(`max_current_value_rele_off_phase${(i + 1)}`, new FormControl(0.5));
      this.form.addControl(`min_voltage_phase${(i + 1)}`, new FormControl(1));
      this.form.addControl(`max_voltage_phase${(i + 1)}`, new FormControl(1));
    }
  }

  public ngOnInit(): void
  {
    this.routeDataSubscription = this.route.data.subscribe(data => {
            
      this.alarmProfile = data.alarmProfile;
      
      this.form.patchValue(data.alarmProfile);

      this.form.disable();

    });
  }

  public backToTable():void
  {
    let path = this.router.url.slice(0, this.router.url.indexOf( "/" + this.alarmProfile.id ) );
    this.router.navigateByUrl( path );
  }

  public ngOnDestroy(): void
  {
    this.routeDataSubscription.unsubscribe();
  }
}

