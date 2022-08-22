import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { MantenimientoPreventivoRoutingModule } from './mantenimiento-preventivo-routing.module';
import { MantenimientoPreventivoComponent } from './mantenimiento-preventivo.component';
import { TablaComponent } from './views/tabla/tabla.component';
import { NuevoComponent } from './views/nuevo/nuevo.component';
import { VerComponent } from './views/ver/ver.component';
import { MapaLeaftMantVerComponent } from './views/mapa-leaft-mant-ver/mapa-leaft-mant-ver.component';
import { MapaLeaftAmpliarComponent } from './views/mapa-leaft-ampliar/mapa-leaft-ampliar.component';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';

@NgModule({
  declarations: [MantenimientoPreventivoComponent, TablaComponent, NuevoComponent, VerComponent, MapaLeaftMantVerComponent, MapaLeaftAmpliarComponent],
  imports: [
    SharedModule,
    NgxDaterangepickerMd.forRoot(),
    MantenimientoPreventivoRoutingModule
  ]
})
export class MantenimientoPreventivoModule { }
