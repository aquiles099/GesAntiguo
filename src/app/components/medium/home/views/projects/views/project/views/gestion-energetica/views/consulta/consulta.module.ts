import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { ConsultaRoutingModule } from './consulta-routing.module';
import { ConsultaComponent } from './consulta.component';
import { TablaComponent } from './views/tabla/tabla.component';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { ChartModule } from 'angular-highcharts';

@NgModule({
  declarations: [ConsultaComponent, TablaComponent],
  imports: [
    SharedModule,
    ConsultaRoutingModule,
    NgxDaterangepickerMd.forRoot(),
    ChartModule
  ]
})
export class ConsultaModule { }
