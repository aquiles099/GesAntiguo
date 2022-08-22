import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { TipoMantenimientoPreventivoRoutingModule } from './tipo-mantenimiento-preventivo-routing.module';
import { TipoMantenimientoPreventivoComponent } from './tipo-mantenimiento-preventivo.component';
import { TablaComponent } from './views/tabla/tabla.component';
import { NuevoComponent } from './views/nuevo/nuevo.component';
import { VerComponent } from './views/ver/ver.component';


@NgModule({
  declarations: [TipoMantenimientoPreventivoComponent, TablaComponent, NuevoComponent, VerComponent],
  imports: [
    SharedModule,
    TipoMantenimientoPreventivoRoutingModule
  ]
})
export class TipoMantenimientoPreventivoModule { }
