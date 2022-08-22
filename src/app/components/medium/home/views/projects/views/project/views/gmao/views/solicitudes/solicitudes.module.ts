import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { SolicitudesRoutingModule } from './solicitudes-routing.module';
import { TablaComponent } from './views/tabla/tabla.component';
import { SolicitudesComponent } from './solicitudes.component';
import { NuevoComponent } from './views/nuevo/nuevo.component';
import { MapaLeaftComponent } from './views/mapa-leaft/mapa-leaft.component';
import { VerComponent } from './views/ver/ver.component';

@NgModule({
  declarations: [    
    SolicitudesComponent,
    TablaComponent,
    NuevoComponent,
    MapaLeaftComponent,
    VerComponent
  ],
  imports: [
    SharedModule,
    SolicitudesRoutingModule
  ]
})
export class SolicitudesModule { }
