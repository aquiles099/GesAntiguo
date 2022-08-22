import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { TipoInventarioRoutingModule } from './tipo-inventario-routing.module';
import { TipoInventarioComponent } from './tipo-inventario.component';
import { TablaComponent } from './views/tabla/tabla.component';
import { NuevoComponent } from './views/nuevo/nuevo.component';
import { VerComponent } from './views/ver/ver.component';


@NgModule({
  declarations: [TipoInventarioComponent, TablaComponent, NuevoComponent, VerComponent],
  imports: [
    SharedModule,
    TipoInventarioRoutingModule
  ]
})
export class TipoInventarioModule { }
