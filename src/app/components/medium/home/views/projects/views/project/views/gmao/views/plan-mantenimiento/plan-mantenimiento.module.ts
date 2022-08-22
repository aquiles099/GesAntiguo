import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { PlanMantenimientoRoutingModule } from './plan-mantenimiento-routing.module';
import { PlanMantenimientoComponent } from './plan-mantenimiento.component';
import { TablaComponent } from './views/tabla/tabla.component';
import { VerComponent } from './views/ver/ver.component';


@NgModule({
  declarations: [PlanMantenimientoComponent, TablaComponent, VerComponent],
  imports: [
    SharedModule,
    PlanMantenimientoRoutingModule
  ]
})
export class PlanMantenimientoModule { }
