import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { MarcaRoutingModule } from './marca-routing.module';
import { MarcaComponent } from './marca.component';
import { TablaComponent } from './views/tabla/tabla.component';
import { NuevoComponent } from './views/nuevo/nuevo.component';


@NgModule({
  declarations: [MarcaComponent, TablaComponent, NuevoComponent],
  imports: [
    SharedModule,
    MarcaRoutingModule
  ]
})
export class MarcaModule { }
