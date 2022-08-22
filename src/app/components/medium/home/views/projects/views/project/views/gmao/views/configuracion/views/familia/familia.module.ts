import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { FamiliaRoutingModule } from './familia-routing.module';
import { FamiliaComponent } from './familia.component';
import { TablaComponent } from './views/tabla/tabla.component';
import { NuevoComponent } from './views/nuevo/nuevo.component';


@NgModule({
  declarations: [FamiliaComponent, TablaComponent, NuevoComponent],
  imports: [
    SharedModule,
    FamiliaRoutingModule
  ]
})
export class FamiliaModule { }
