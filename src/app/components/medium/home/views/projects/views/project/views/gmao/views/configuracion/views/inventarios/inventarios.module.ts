import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { InventariosRoutingModule } from './inventarios-routing.module';
import { InventariosComponent } from './inventarios.component';
import { TablaComponent } from './views/tabla/tabla.component';
import { NuevoComponent } from './views/nuevo/nuevo.component';
import { VerComponent } from './views/ver/ver.component';


@NgModule({
  declarations: [InventariosComponent, TablaComponent, NuevoComponent, VerComponent],
  imports: [
    SharedModule,
    InventariosRoutingModule
  ]
})
export class InventariosModule { }
