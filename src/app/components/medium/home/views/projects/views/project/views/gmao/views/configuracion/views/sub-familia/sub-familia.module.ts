import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { SubFamiliaRoutingModule } from './sub-familia-routing.module';
import { SubFamiliaComponent } from './sub-familia.component';
import { TablaComponent } from './views/tabla/tabla.component';
import { NuevoComponent } from './views/nuevo/nuevo.component';

@NgModule({
  declarations: [SubFamiliaComponent, 
  TablaComponent, 
  NuevoComponent],
  imports: [
    SharedModule,
    SubFamiliaRoutingModule
  ]
})
export class SubFamiliaModule { }
