import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { ConcentradoresRoutingModule } from './concentradores-routing.module';
import { ConcentradoresComponent } from './concentradores.component';
import { TablaComponent } from './views/tabla/tabla.component';
import { NuevoComponent } from './views/nuevo/nuevo.component';
import { VerComponent } from './views/ver/ver.component';


@NgModule({
  declarations: [ConcentradoresComponent, TablaComponent, NuevoComponent, VerComponent],
  imports: [
    SharedModule,
    ConcentradoresRoutingModule
  ]
})
export class ConcentradoresModule { }
