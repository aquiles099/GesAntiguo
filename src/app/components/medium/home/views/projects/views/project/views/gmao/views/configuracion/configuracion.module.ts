import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { ConfiguracionRoutingModule } from './configuracion-routing.module';
import { ConfiguracionComponent } from './configuracion.component';


@NgModule({
  declarations: [ConfiguracionComponent],
  imports: [
    SharedModule,
    ConfiguracionRoutingModule
  ]
})
export class ConfiguracionModule { }
