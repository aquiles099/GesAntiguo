import { Component, Input, OnInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { Capa, Grupo, Modulo } from 'src/app/interfaces/medium/mapa/Modulo';
import { ProjectLayersService } from 'src/app/services/medium/project-layers.service';
import { ObjectUtility } from '../../../../../../../../shared/object-utility';

export interface LayerForm
{
  module:string;
  group:string;
  layer:string;
}

@Component({
  selector: 'layer-selectors-section',
  templateUrl: './layer-selectors-section.component.html',
  styleUrls: [
    './layer-selectors-section.component.css',
    '../../../../../../../../../themes/styles/map-tool-bar.scss'
  ]
})
export class LayerSelectorsSectionComponent implements OnInit, OnDestroy
{
  @Input()
  public disableSelectors:boolean = false;
  
  @Input()
  public selectorsBottomMarginClass:"mb-1"|"mb-2"|"mb-3" = "mb-3";
  
  @Input()
  public form:LayerForm = {
    module:null,
    group:null,
    layer:null
  };

  public modules:Modulo[] = [];
  
  public groups:Grupo[] = [];
  
  public layers:Capa[] = [];
  
  @Output()
  public onSelectModule:EventEmitter<Modulo> = new EventEmitter;
  
  @Output()
  public onSelectGroup:EventEmitter<Grupo> = new EventEmitter;
  
  @Output()
  public onSelectLayer:EventEmitter<Capa> = new EventEmitter;
  
  constructor(
    private _projectLayersService:ProjectLayersService,
  )
  {
  }

  get thereIsOnlyOneModule():boolean
  {
    return this.modules.length === 1;
  }
  
  get thereIsMoreThanOneModule():boolean
  {
    return this.modules.length > 1;
  }

  public ngOnInit():void
  {
    this.modules = this._projectLayersService.obtenerModulos();

    if( this.thereIsOnlyOneModule )
    {
      this.form.module = this.modules[0].nombre;

      this.layers = this._projectLayersService.obtenerCapas({
        modulo: this.form.module,
        grupo: null,
        proyectado: true
      });
    }
  }

  public fillFormFromALayer(layer:Capa):void
  {
    const module = this.modules.find(module => module.nombre === layer.modulo);
    this.form.module = module.nombre;
    this.onChangeModuleSelector(module);

    const group = module.grupos.find(group => group.nombre === layer.grupo);
    this.form.group = group.nombre;
    this.onChangeGroupSelector(group);

    this.form.layer = layer.nombre;
    this.onChangeLayerSelector(layer);
  }

  public onChangeModuleSelector(module?:Modulo):void
  {
    this.form.group = null;
    this.form.layer = null;
    this.layers = [];

    this.groups = module.grupos.filter(group => group.capas.some(capa => capa.proyectado));
    this.onSelectModule.emit(module);
  }

  public onChangeGroupSelector(group?:Grupo):void
  {
    this.form.layer = null;
    this.layers = group.capas.filter(capa => capa.proyectado);
    this.onSelectGroup.emit(group);
  }

  public onChangeLayerSelector(layer?:Capa):void
  {
    this.onSelectLayer.emit(layer);
  } 

  public reset():void
  {
    ObjectUtility.overrideValues(this.form);
    this.groups = [];
    this.layers = [];
  }

  public ngOnDestroy():void
  {
    this.reset();
  }
}
