import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { DispositivosRoutingModule } from './dispositivos-routing.module';
import { DispositivosComponent } from './dispositivos.component';
import { TablaComponent } from './views/tabla/tabla.component';
import { NuevoComponent } from './views/nuevo/nuevo.component';
import { VerComponent } from './views/ver/ver.component';

@NgModule({
  declarations: [DispositivosComponent, TablaComponent, NuevoComponent, VerComponent],
  imports: [
    SharedModule,
    DispositivosRoutingModule
  ]
})
export class DispositivosModule { }
