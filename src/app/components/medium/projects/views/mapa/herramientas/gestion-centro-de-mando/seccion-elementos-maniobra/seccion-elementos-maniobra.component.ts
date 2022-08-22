import { Component } from '@angular/core';
import { SeccionBaseComponent } from '../seccion-base/seccion-base.component';

@Component({
  selector: 'seccion-elementos-maniobra',
  templateUrl: './seccion-elementos-maniobra.component.html',
  styleUrls: [
    './seccion-elementos-maniobra.component.css',
    '../gestion-centro-de-mando.component.css'
  ]
})
export class SeccionElementosManiobraComponent extends SeccionBaseComponent
{
  // campos de atributos:
  //tipo_regulacion.
  //marca_regulacion.
  //tipo_reloj.
  //marca_reloj.
  //celula.
  //marca_celula.
  //interruptor_manual.
  //marca_interruptor_manual.
  //tipo_telegestion.
  //marca_telegestion.
  //hora_inicio.
  //hora_fin.
  //observaciones_elementos_maniobra.

  constructor()
  {
    super();
  }

  public onChangeCheckboxInput(key, value):void
  {    
    if( ! value )
      this.template[key] = null; 
  }
}
