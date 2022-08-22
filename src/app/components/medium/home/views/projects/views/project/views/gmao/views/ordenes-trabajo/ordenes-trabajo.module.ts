import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { OrdenesTrabajoRoutingModule } from './ordenes-trabajo-routing.module';
import { TablaComponent } from './views/tabla/tabla.component';
import { NuevoComponent } from './views/nuevo/nuevo.component';
import { VerComponent } from './views/ver/ver.component';
import { MapaLeaftComponent } from './views/mapa-leaft/mapa-leaft.component';


@NgModule({
  declarations: [
  TablaComponent, 
  NuevoComponent, 
  VerComponent, 
  MapaLeaftComponent
  ],
  imports: [
    SharedModule,
    OrdenesTrabajoRoutingModule
  ]
})
export class OrdenesTrabajoModule { }
