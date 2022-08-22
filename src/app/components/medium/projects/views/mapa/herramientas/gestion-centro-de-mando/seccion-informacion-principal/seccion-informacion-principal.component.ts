import { Component } from '@angular/core';
import { SeccionBaseComponent } from '../seccion-base/seccion-base.component';

@Component({
  selector: 'seccion-informacion-principal',
  templateUrl: './seccion-informacion-principal.component.html',
  styleUrls: [
    './seccion-informacion-principal.component.css',
    '../gestion-centro-de-mando.component.css'
  ]
})
export class SeccionInformacionPrincipalComponent extends SeccionBaseComponent
{
  // campos de atributos.
  //caja_proteccion.
  //cm_padre.
  //descripcion.
  //estado.
  //estado_caja_proteccion.
  //geom.
  //id_centro_mando.
  //localizacion.
  //modulo_medida.
  //numero.
  //puesta_tierra.
  //temporal.
  //vial.

  constructor()
  {
    super();
  }

  public onChangeAttributeSelector(vialId:any, field:string):void
  {
    if( field === "vial" )
    {
      this.template["localizacion"] = (this.attributes
                                          .find(data => data.campo === "vial")
                                          .dominios as any)
                                          .find(value => value.id_vial === vialId)
                                          .localizacion;
    }
  }
}
