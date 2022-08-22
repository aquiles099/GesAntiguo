import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { Operation } from 'src/app/interfaces/medium/tellink/operation';

@Component({
  templateUrl: './details.component.html',
  styleUrls: [
    '../../../../../../../../../../../../../../../../../../themes/styles/default-view.scss',
    './details.component.css',
  ]
})
export class DetailsComponent implements OnInit, OnDestroy
{
  public form:FormGroup;
    
  private routeDataSubscription:Subscription;

  constructor(
    public route:ActivatedRoute
  )
  {
  }


  public ngOnInit():void 
  {
    this.routeDataSubscription = this.route.data.subscribe(data => {
            
      const operation:Operation = data.operation;

      this.form = new FormGroup({
        type: new FormControl( operation.type ?? "ninguna"),
        status_flag: new FormControl( operation.status_flag ?? "ninguna"),
        date: new FormControl( operation.date ?? "ninguna"),
        digital_output_number: new FormControl( operation.digital_output_number ?? "ninguna"),
        text: new FormControl( operation.text ?? "ninguna"),
        voltage1: new FormControl( operation.voltage1 ?? "ninguna"),
        voltage2: new FormControl( operation.voltage2 ?? "ninguna"),
        voltage3: new FormControl( operation.voltage3 ?? "ninguna"),
        current1: new FormControl( operation.current1 ?? "ninguna"),
        current2: new FormControl( operation.current2 ?? "ninguna"),
        current3: new FormControl( operation.current3 ?? "ninguna"),
        active_power: new FormControl( operation.active_power?? "ninguna"),
        reactive_power: new FormControl( operation.reactive_power?? "ninguna"),
        apparent_power: new FormControl( operation.apparent_power?? "ninguna"),
        power_factor: new FormControl( operation.power_factor?? "ninguna"),
        absolute_active_energy: new FormControl( operation.absolute_active_energy?? "ninguna"),
        absolute_reactive_energy: new FormControl( operation.absolute_reactive_energy?? "ninguna"),
        user: new FormControl( operation.user?? "ninguna"),
      });

      this.form.disable();

    });

  }

  public ngOnDestroy(): void
  {
    this.routeDataSubscription.unsubscribe();
  }
}

