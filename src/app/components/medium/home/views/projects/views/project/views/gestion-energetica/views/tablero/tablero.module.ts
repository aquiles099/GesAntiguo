import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { TableroRoutingModule } from './tablero-routing.module';
import { TableroComponent } from './tablero.component';
import { TablaComponent } from './views/tabla/tabla.component';
import { NuevoComponent } from './views/nuevo/nuevo.component';
@NgModule({
  declarations: [TableroComponent, TablaComponent, NuevoComponent],
  imports: [
    SharedModule,
    TableroRoutingModule
  ]
})
export class TableroModule { }
