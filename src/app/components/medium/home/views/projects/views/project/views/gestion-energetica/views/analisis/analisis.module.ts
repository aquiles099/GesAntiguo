import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { AnalisisRoutingModule } from './analisis-routing.module';
import { AnalisisComponent } from './analisis.component';
import { TablaComponent } from './views/tabla/tabla.component';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { ChartModule } from 'angular-highcharts';

@NgModule({
  declarations: [AnalisisComponent, TablaComponent],
  imports: [
    SharedModule,
    NgxDaterangepickerMd.forRoot(),
    ChartModule,
    AnalisisRoutingModule
  ]
})
export class AnalisisModule { }
