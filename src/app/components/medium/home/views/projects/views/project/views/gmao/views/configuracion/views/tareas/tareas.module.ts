import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { TareasRoutingModule } from './tareas-routing.module';
import { TareasComponent } from './tareas.component';
import { TablaComponent } from './views/tabla/tabla.component';
import { NuevoComponent } from './views/nuevo/nuevo.component';
import { VerComponent } from './views/ver/ver.component';


@NgModule({
  declarations: [TareasComponent, TablaComponent, NuevoComponent, VerComponent],
  imports: [
    SharedModule,
    TareasRoutingModule
  ]
})
export class TareasModule { }
