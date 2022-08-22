import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { TiposIncidenciasOrdenesRoutingModule } from './tipos-incidencias-ordenes-routing.module';
import { TiposIncidenciasOrdenesComponent } from './tipos-incidencias-ordenes.component';
import { TablaComponent } from './views/tabla/tabla.component';
import { NuevoComponent } from './views/nuevo/nuevo.component';
import { VerComponent } from './views/ver/ver.component';


@NgModule({
  declarations: [TiposIncidenciasOrdenesComponent, TablaComponent, NuevoComponent, VerComponent],
  imports: [
    SharedModule,
    TiposIncidenciasOrdenesRoutingModule
  ]
})
export class TiposIncidenciasOrdenesModule { }
