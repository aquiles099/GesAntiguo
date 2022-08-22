import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { GmaoRoutingModule } from './gmao-routing.module';
import { GmaoComponent } from './gmao.component';
import { EstadisticasComponent } from './views/estadisticas/estadisticas.component';
import { OrdenesTrabajoComponent } from './views/ordenes-trabajo/ordenes-trabajo.component';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { ChartModule } from 'angular-highcharts';

@NgModule({
  declarations: [
    GmaoComponent,
    EstadisticasComponent,
    OrdenesTrabajoComponent,
  ],
  imports: [
    // este es un modulo compartido que hace muchas importaciones,
    // revisarlo en caso de que falte alguna que se necesita usar en el modulo presente.
    SharedModule,
    GmaoRoutingModule,
    NgxDaterangepickerMd,
    ChartModule
  ]
})
export class GmaoModule { }
