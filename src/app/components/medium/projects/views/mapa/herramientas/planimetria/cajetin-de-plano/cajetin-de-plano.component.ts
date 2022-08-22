import { Component, Input, ViewChild, ElementRef } from '@angular/core';
import { BoxImage, PlanimetryBox } from 'src/app/interfaces/geojson/planimetry/planimetry-template';

@Component({
  selector: 'cajetin-de-plano',
  templateUrl: './cajetin-de-plano.component.html',
  styleUrls: ['./cajetin-de-plano.component.css']
})
export class CajetinDePlanoComponent
{
  @Input()
  public data:PlanimetryBox = {
    model: null,
    title: null,
    designation: null,
    titular: null,
    sponsor: null,
    images: [],
    scale: null,
    number: null,
    date: null
  };

  @ViewChild("htmlRef")
  public templateRef:ElementRef<HTMLTableElement>;

  constructor() { }

  public getImage(position:"left"|"right"):BoxImage
  {
    return this.data.images.find(image => image.position === position)
  }
}
