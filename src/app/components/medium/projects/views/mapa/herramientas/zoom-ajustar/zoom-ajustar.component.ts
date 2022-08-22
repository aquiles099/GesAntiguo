import { Component, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { HideableSectionComponent } from 'src/app/components/shared/hideable-section/hideable-section.component';
import { DrawMap, featureGroup, FeatureGroup, Draw, drawLocal, DrawEvents, tileLayer} from 'leaflet';
import { FisotecService } from 'src/app/services';
import Swal from 'sweetalert2';
import { ProjectLayersService } from 'src/app/services/medium/project-layers.service';

@Component({
    selector: 'herramienta-zoom-ajustar',
    templateUrl: './zoom-ajustar.component.html',
    styleUrls: []
  })
  export class ZoomAjustarComponent extends HideableSectionComponent {

    @Input() public map: DrawMap;

    @Input() public capaDeElementosDibujados: FeatureGroup = featureGroup();

    @Output() onCerrar: EventEmitter<any> = new EventEmitter();

    rectangulo: Draw.Rectangle;
    public drawOptions: any;

    constructor() {
        super();

        drawLocal.draw.handlers.rectangle.tooltip.start = "Click y arrastra para hacer zoom.";

        this.drawOptions = {
            draw: {
              marker: false,
              polyline: {
                shapeOptions: {
                  color: '#218D8F'
                }
              },
              circle: false,
              polygon: {
                shapeOptions: {
                  color: '#218D8F'
                }
              },
              circlemarker: false,
              rectangle: {
                shapeOptions: {
                  color: '#218D8F'
                },
                showArea: false
              }
            },
            edit: {
              featureGroup: this.capaDeElementosDibujados
            }
          };
    }

    public async show(): Promise<void> {
        this.llenarVentanaZoom();
        await super.show();
    }

    llenarVentanaZoom() {
        //Añadimos un evento sobre el mapa que se lanzará cuando se termine de dibujar
        this.map.on('draw:created', (e) => {
            this.onDrawCreated(e);
        });
    
        //Activamos el dibujo
        this.rectangulo = new Draw.Rectangle(this.map, this.drawOptions.draw.rectangle);
        this.rectangulo.enable();
    }

    //Función lanzada al terminar de dibujar el rectángulo
    onDrawCreated(event: any) {

        //Persistimos el dibujo sobre el mapa y centramos la pantalla sobre el mismo
        this.capaDeElementosDibujados.addLayer((event as DrawEvents.Created).layer);
        this.map.flyToBounds(this.capaDeElementosDibujados.getBounds());

        this.onCerrar.emit();
    }

    //Se lanza al cerrar la herramienta
    public async hide(): Promise<void> {

        //Volvemos a activar el doble click en el mapa, cancelamos el dibujo (si estuviera haciéndose) y borramos el polígono sobre el mapa (si lo hubiera)
        this.map.doubleClickZoom.enable();
        if (this.rectangulo) {
        this.rectangulo.disable();
        }
        this.capaDeElementosDibujados.clearLayers();
        this.capaDeElementosDibujados.remove();
        

        await super.hide();
    }


  }