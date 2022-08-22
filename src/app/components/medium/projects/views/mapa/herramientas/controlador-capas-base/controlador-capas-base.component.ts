import { Component, Input, Output, EventEmitter } from '@angular/core';
import { l as _capasBase } from '../../../../../../../../environments/mapasBase';
import { Map, TileLayer } from 'leaflet';
import { HideableSectionComponent } from '../../../../../../shared/hideable-section/hideable-section.component';
import { Modulo, Capa, Grupo } from '../../../../../../../interfaces/medium/mapa/Modulo';
import { ProjectLayersService } from '../../../../../../../services/medium/project-layers.service';
import { ShepherdService } from 'angular-shepherd';
import { MapService } from '../../../../../../../services/unic/map.service';

interface ListadoColapsable
{
  nombre:string;
  colapsado:boolean;
}

@Component({
  selector: 'controlador-capas-base',
  templateUrl: './controlador-capas-base.component.html',
  styleUrls: ['./controlador-capas-base.component.css']
})
export class ControladorCapasBaseComponent extends HideableSectionComponent
{
  @Input()
  public mapa:Map;

  public capasBase:{
    capa:TileLayer;
    imageName: string;
    className: string;
  }[] = [];

  @Input()
  public nombreCapaBaseActual:string;

  public datosDeModulos:Array<Modulo> = [];

  public listadosDeModulos:ListadoColapsable[] = [];
  public listadosDeGrupos:ListadoColapsable[] = [];
  public listadosDeCapas:ListadoColapsable[] = [];

  @Output()
  public cambiarCapaBase:EventEmitter<TileLayer> = new EventEmitter;

  constructor(
    private _projectLayersService:ProjectLayersService,
    private _shepherdService:ShepherdService,
    private _mapService:MapService
  )
  {
    super();
    this.obtenerCapasBases();
  }

  get tourIsActive():boolean
  {
    return this._shepherdService.isActive;
  }

  @Input() set añadirDatosDeModulos(capasPorModulos:Array<Modulo>)
  {
    if( capasPorModulos )
    {
      this.datosDeModulos = [];
      this.datosDeModulos = [...capasPorModulos];
      this.listadosDeCapas = [];

      let primerModulo = true;

      this.listadosDeModulos = capasPorModulos.map(modulo => {

        let moduloColapsado = true;
        if(primerModulo){
          primerModulo = false;
          moduloColapsado = false;
        }

        let primerGrupo = true;
        this.listadosDeGrupos = [...this.listadosDeGrupos, ...modulo.grupos.map(grupo => {
          let grupoColapsado = true;
          if(primerGrupo){
            primerGrupo = false;
            grupoColapsado = false;
          }

          this.listadosDeCapas = [...this.listadosDeCapas, ...grupo.capas.map(capa => {

            return {
              nombre: capa.nombre,
              colapsado: true
            };
          })];
          return {
            nombre: grupo.nombre,
            colapsado: grupoColapsado
          }
        })];

        return {
          nombre: modulo.nombre,
          colapsado: moduloColapsado
        };
      });

    }
  }

  public obtenerCapasBases():void
  {
    this.capasBase = this._mapService.getBaseLayers().map(capa => {

      const layerClassName = capa.options.className;

      const nombreClaseCapaEnArreglo = layerClassName.toLowerCase().split(" ");

      const imageName = nombreClaseCapaEnArreglo.length > 1 ?
         nombreClaseCapaEnArreglo[ nombreClaseCapaEnArreglo.length - 1 ] :
         nombreClaseCapaEnArreglo[ 0 ];
      
      return {
        capa:capa,
        imageName: imageName,
        className: layerClassName
      };

    });
  }

  public alternarVisibilidadDeCapaModular(modulo:Modulo):void
  {    
    modulo.proyectado = ! modulo.proyectado;

    modulo.proyectado ?
    modulo.grupos.forEach(grupo => this.alternarVisibilidadDeCapaGrupal(grupo)) :
    modulo.grupos.forEach(grupo => this.alternarVisibilidadDeCapaGrupal(grupo));
  }

  public alternarVisibilidadDeCapaGrupal(grupo:Grupo):void
  {
    grupo.proyectado = ! grupo.proyectado;
    
    grupo.proyectado ?
    grupo.capas.forEach(capa => this.alternarVisibilidadDeCapaIndividual(capa)) :
    grupo.capas.forEach(capa => this.alternarVisibilidadDeCapaIndividual(capa));
  }

  public alternarVisibilidadDeCapaIndividual(capa:Capa):void
  {
    capa.proyectado = ! capa.proyectado;

    capa.proyectado ?
    this.mapa.addLayer(capa.capaWms) :
    this.mapa.removeLayer(capa.capaWms);

    this._projectLayersService.notificarCambioEnObservador();
  }

  public alternarVisibilidadDeListado(nombre:string, tipo:"modulo"|"grupo"):void
  {
    if( this.tourIsActive )
    return;

    if( tipo === "grupo" )
    {
      const grupo = this.listadosDeGrupos.find(grupo => grupo.nombre === nombre);
      grupo.colapsado = ! grupo.colapsado;

      if(!grupo.colapsado){
        this.listadosDeGrupos.forEach((grupo) => {
          if(grupo.nombre !== nombre){
            grupo.colapsado = true;
          }
        });
      }
    }
    else
    {
      const modulo = this.listadosDeModulos.find(modulo => modulo.nombre === nombre);
      modulo.colapsado = ! modulo.colapsado;

      if(!modulo.colapsado){
        this.listadosDeModulos.forEach((modulo) => {
          if(modulo.nombre !== nombre){
            modulo.colapsado = true;
          }
        });
      }

    }
  }

  public alternarVisibilidadDeLeyenda(nombre:string):void
  {
    if( this.tourIsActive )
    return;

    const capa = this.listadosDeCapas.find(capa => capa.nombre === nombre);
    capa.colapsado = ! capa.colapsado;

    if(!capa.colapsado){
      this.listadosDeCapas.forEach((capa) => {
        if(capa.nombre !== nombre){
          capa.colapsado = true;
        }
      });
    }
  }

  public listadoEstaColapsado(nombre:string, tipo:"modulo"|"grupo"):boolean
  {
    return tipo === "modulo" ?
    this.listadosDeModulos.find(modulo => modulo.nombre === nombre).colapsado :
    this.listadosDeGrupos.find(grupo => grupo.nombre === nombre).colapsado;
  }

  public capaEstaColapsada(nombre:string):boolean {
    return this.listadosDeCapas.find(capa => capa.nombre === nombre).colapsado;
  }

  public eventoCambiarCapaBase(capa:TileLayer):void
  {
    this.cambiarCapaBase.emit(capa);
  }
}
