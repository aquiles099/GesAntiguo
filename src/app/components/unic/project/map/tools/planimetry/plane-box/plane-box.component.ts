import { Component, Input, ViewChild, ElementRef } from '@angular/core';
import { BoxImage, PlanimetryBox } from 'src/app/interfaces/geojson/planimetry/planimetry-template';

@Component({
  selector: 'plane-box',
  templateUrl: './plane-box.component.html',
  styleUrls: ['./plane-box.component.css']
})
export class PlaneBoxComponent
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
