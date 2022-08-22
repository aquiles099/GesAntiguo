import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { AlmacenesRoutingModule } from './almacenes-routing.module';
import { AlmacenesComponent } from './almacenes.component';
import { TablaComponent } from './views/tabla/tabla.component';
import { NuevoComponent } from './views/nuevo/nuevo.component';

@NgModule({
  declarations: [AlmacenesComponent,
  TablaComponent,
  NuevoComponent],
  imports: [
    SharedModule,
    AlmacenesRoutingModule
  ]
})
export class AlmacenesModule { }
