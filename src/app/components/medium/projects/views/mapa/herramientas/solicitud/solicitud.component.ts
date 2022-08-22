import { Component, OnInit } from '@angular/core';
import { HideableSectionComponent } from 'src/app/components/shared/hideable-section/hideable-section.component';
@Component({
  selector: 'app-solicitud',
  templateUrl: './solicitud.component.html',
  styleUrls: ['./solicitud.component.css']
})
export class SolicitudComponent extends HideableSectionComponent implements OnInit {

  constructor() {
    super();
  }

  ngOnInit(): void {
  }

}
