import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { LocalizacionesRoutingModule } from './localizaciones-routing.module';
import { LocalizacionesComponent } from './localizaciones.component';
import { TablaComponent } from './views/tabla/tabla.component';

@NgModule({
  declarations: [LocalizacionesComponent, TablaComponent],
  imports: [
    SharedModule,
    LocalizacionesRoutingModule
  ]
})
export class LocalizacionesModule { }
