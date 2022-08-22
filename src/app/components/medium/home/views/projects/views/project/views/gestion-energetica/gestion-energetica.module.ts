import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { GestionEnergeticaRoutingModule } from './gestion-energetica-routing.module';
import { GestionEnergeticaComponent } from './gestion-energetica.component';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { ChartModule } from 'angular-highcharts';

@NgModule({
  declarations: [GestionEnergeticaComponent],
  imports: [
    SharedModule,
    GestionEnergeticaRoutingModule,
    NgxSkeletonLoaderModule,
    NgxDaterangepickerMd,
    ChartModule
  ]
})
export class GestionEnergeticaModule { }
