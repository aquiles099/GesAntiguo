import { MapsAPILoader } from '@agm/core';
import { Component, Input, OnInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { icon, Marker, marker, DrawMap, DomUtil } from 'leaflet';
import { HideableSectionComponent } from '../../../../shared/hideable-section/hideable-section.component';

@Component({
  selector: 'street-view-map',
  templateUrl: './street-view-map.component.html',
  styleUrls: ['./street-view-map.component.css']
})
export class StreetViewMapComponent extends HideableSectionComponent
{
  @Input()
  public map: DrawMap;

  private clickOnMap:boolean = false;

  public initated:boolean = false;

  private onMapClickClosure: (event:any) => void = event => {
    
    if( ! this.initated )
      this.initated = true;

    this.clickOnMap = true;
    this.map_street_view.setCenter({ lat: event.latlng.lat, lng: event.latlng.lng });
    this.panorama.setPosition({ lat: event.latlng.lat, lng: event.latlng.lng });
    this.onUpdatePosition(event.latlng.lat, event.latlng.lng);
    setTimeout(() => {
      this.clickOnMap = false;
    }, 1000);
  };

  private pegmanMarker:Marker = marker(null, { icon:  icon({
      iconUrl: 'assets/icons/pin_2.png',
      shadowUrl: 'assets/icons/marker-shadow.png',
      iconSize: [30, 30]
    }) 
  });

  @ViewChild('streetviewMap') 
  public streetviewMap: ElementRef<HTMLElement>;

  @ViewChild('oblicuas') 
  public oblicuas: ElementRef<HTMLElement>;

  private map_street_view: google.maps.Map;
  private panorama: google.maps.StreetViewPanorama;

  constructor(
    private mapsAPILoader: MapsAPILoader
  )
  {
    super();
  }

  public async show():Promise<void>
  {
    this.map.on("click", this.onMapClickClosure);
    DomUtil.addClass(this.map.getContainer(), 'cursor-crosshair');
    this.pegmanMarker.setLatLng( this.map.getBounds().getCenter() );
    this.pegmanMarker.addTo(this.map);
    await super.show();
    await this.loadMaps();
  }

  private async loadMaps():Promise<void>
  {
    await this.mapsAPILoader.load();
    
    this.map_street_view = new google.maps.Map(this.oblicuas.nativeElement, {
      center: this.map.getBounds().getCenter(),
      zoom: 18,
      mapTypeId: 'satellite',
    });

    this.panorama = new google.maps.StreetViewPanorama(
      this.streetviewMap.nativeElement, {
      position: this.map.getBounds().getCenter(),
      pov: {
        heading: 34,
        pitch: 10
      }
    });

    this.map_street_view.setStreetView(this.panorama);

    this.panorama.addListener('position_changed', () => {
      if( ! this.clickOnMap &&  this.initated )
      {
        const _latlng = this.panorama.getPosition();
        this.onUpdatePosition(_latlng.lat(), _latlng.lng());
      }
    });

  }

  private onUpdatePosition(lat:number, lng:number):void
  {
    this.pegmanMarker.setLatLng( [lat, lng] );
    this.map.flyTo([lat - 0.0005, lng], 18, { duration: 0.5, });
  }

  public async hide():Promise<void>
  {
    this.map.off("click", this.onMapClickClosure);
    DomUtil.removeClass(this.map.getContainer(), 'cursor-crosshair');
    this.pegmanMarker.removeFrom(this.map);
    await super.hide();
    this.initated = false;
  }
}
