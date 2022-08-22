import { Component } from '@angular/core';
import { SeccionBaseComponent } from '../seccion-base/seccion-base.component';

@Component({
  selector: 'seccion-otros',
  templateUrl: './seccion-otros.component.html',
  styleUrls: [
    './seccion-otros.component.css',
    '../gestion-centro-de-mando.component.css'
  ]
})
export class SeccionOtrosComponent extends SeccionBaseComponent
{
  // atributos: 
  // fecha_instalacion.
  // tension.
  // horas_dia.
  // horas_ahorro.
  // observaciones.

  constructor()
  {
    super();
  }
}

