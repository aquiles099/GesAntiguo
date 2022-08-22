import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/shared/shared.module';
import { ModelosRoutingModule } from './modelos-routing.module';
import { ModelosComponent } from './modelos.component';
import { TablaComponent } from './views/tabla/tabla.component';
import { NuevoComponent } from './views/nuevo/nuevo.component';


@NgModule({
  declarations: [ModelosComponent, TablaComponent, NuevoComponent],
  imports: [
    SharedModule,
    ModelosRoutingModule
  ]
})
export class ModelosModule { }
