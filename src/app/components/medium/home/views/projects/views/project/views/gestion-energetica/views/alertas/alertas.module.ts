import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { AlertasRoutingModule } from './alertas-routing.module';
import { AlertasComponent } from './alertas.component';
import { TablaComponent } from './views/tabla/tabla.component';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { ChartModule } from 'angular-highcharts';

@NgModule({
  declarations: [AlertasComponent, TablaComponent],
  imports: [
    SharedModule,
    NgxDaterangepickerMd.forRoot(),
    ChartModule,
    AlertasRoutingModule
  ]
})
export class AlertasModule { }
