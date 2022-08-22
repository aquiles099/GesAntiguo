import { Component, OnInit } from '@angular/core';

@Component({
  // no interesan selectores porque son vistas enrutadas y se vera automaticamente la plantilla de componente.
  templateUrl: './gmao.component.html',
  styleUrls: ['./gmao.component.css']
})
export class GmaoComponent implements OnInit {

  /* Este componente no tiene ninguna utlidad mas que
  * alojar la salida de enrutador para todas las vistas de "gmao".
  * Esto es necesario para poder mantener el segmento "gmao" en la url
  */
  constructor() { }

  ngOnInit(): void {
  }

}
