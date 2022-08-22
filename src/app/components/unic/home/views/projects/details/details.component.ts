import { Component, OnInit, OnDestroy } from '@angular/core';
import { Project, ConfiguracionDeProyecto } from '../../../../../../interfaces/project';
import { ActivatedRoute } from '@angular/router';
import { GeojsonFilesService } from '../../../../../../services/unic/geojson-files.service';
import { Subscription } from 'rxjs';
import { ShepherdService } from 'angular-shepherd';

@Component({
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.css']
})
export class DetailsComponent implements OnInit, OnDestroy
{
  public data:ConfiguracionDeProyecto;
  
  public project:Project;

  public moduleLayerDataIsCollapsed:boolean = false;

  public moduleLayerData:any[] = [];

  private routeDataSubscription:Subscription;

  constructor(
    private _geojsonFilesService:GeojsonFilesService,
    private route:ActivatedRoute,
    private _shepherdService:ShepherdService
  ) { }

  public ngOnInit():void
  {
    this.routeDataSubscription = this.route.data.subscribe(_data => {
      
      this.project = _data.data.project;
      this.data = _data.data.adittionalInfo;

    });
    
    this.setModuleLayerData();
  }

  private async setModuleLayerData():Promise<void>
  {
    await this._geojsonFilesService.load();

    this._geojsonFilesService.get().forEach(file => {

      let layerGroup = this.moduleLayerData.find(layerGroup => layerGroup.name === file.module_name); 

      if( ! layerGroup )
      {
        layerGroup = {
          name: file.module_name,
          isCollapsed: false,
          layers: []
        };

        this.moduleLayerData.push(layerGroup);
      }
      
      layerGroup.layers.push({
        name:file.layer_name,
        elements: file.getContent(false).features.length
      });

    });
  }

  public toggleModuleLayerDataVisibility():void
  {
    if( this._shepherdService.isActive )
      return;
      
    this.moduleLayerDataIsCollapsed = ! this.moduleLayerDataIsCollapsed;
  }

  public toggleLayerGroupDataVisibility(groupName:string):void
  {
    if( this._shepherdService.isActive )
      return;

    const layerGroup = this.moduleLayerData.find(layerGroup => layerGroup.name === groupName); 
    layerGroup.isCollapsed = ! layerGroup.isCollapsed;
  }

  
  /* TOUR */

 public showTour():void
 {
   if( this._shepherdService.isActive )
     return;

   this.buildTour();

   this.moduleLayerData.forEach(groupLayer =>  groupLayer.isCollapsed = false);

   this.moduleLayerDataIsCollapsed = false;

   this._shepherdService.start();
 }

 private buildTour():void
 {
   const that = this;    
 
   const steps = this.buildTourSteps();

   const buttons = [
     {
       classes: 'btn-secondary',
       text: 'Atras',
       action(){
           that._shepherdService.back();
       }
     },
     {
       classes: 'btn-info',
       text: 'Siguiente',
       action(){
           that._shepherdService.next();
       }
     }
   ];
   
   const _steps = [];

   for( let i = 0, stepsLength = steps.length; i < stepsLength; i++ )
   {
     let _buttons = [...buttons]; 
     
     const step = steps[i];

     if( i === 0 )
       _buttons = _buttons.slice(1);
    
     if( i === (stepsLength - 1)  )
     {
       const lastBtnIndex = _buttons.length - 1;
       _buttons[lastBtnIndex] = {..._buttons[lastBtnIndex]}; // El ultimo boton (mas a la derecha) siempre sera el de avanzar / finalizar.
       _buttons[lastBtnIndex].text = 'Finalizar';
       _buttons[lastBtnIndex].action = () => that._shepherdService.complete();
     }
     
     const _step = {
       id: step.element,
       attachTo: { 
         element: `${step.selectorPrefix ?? "#"}${step.element}`, 
         on: step.labelPosition
       },
       buttons: _buttons,
       title: `PASO ${i + 1}`,
       text: step.content,
       when: step.event,
       beforeShowPromise: step.beforeShowPromise 
     };

     _steps.push(_step);
   }

   this._shepherdService.addSteps(_steps);
 }

 private buildTourSteps():any[]
 {
   const steps = [
     {
       element: `project-main-info-container`,
       selectorPrefix: `.`,
       labelPosition: "bottom",
       content: 'Aquí podrá visualizar la información principal del proyecto.'
     },
     {
       element: `module-layer-data-container`,
       selectorPrefix: ".",
       labelPosition: "top",
       content: 'La información de módulos > grupos > capas se mostrará aquí.'
     }
   ];

   if( this.moduleLayerData.length )
   {
     steps.push(
      {
        element: "module-row",
        selectorPrefix: ".",
        labelPosition: "bottom",
        content: `
         Se listarán los módulos asociados al proyecto. 
         <br><br>
         Para mostrar / ocultar la información de un <b>módulo o grupo</b>, hacer click sobre la fila.
        `
      },
      {
        element: "groups-row",
        selectorPrefix: ".",
        labelPosition: "bottom",
        content: `
         Al desplegar la información de un módulo se listarán sus grupos.
        `
      },
       {
         element: "layers-row",
         selectorPrefix: ".",
         labelPosition: "bottom",
         content: `
         Al desplegar la información de un grupo se listarán sus capas.
         `
       },
       {
         element: "layer-elements-tag",
         selectorPrefix: ".",
         labelPosition: "left",
         content: `
          Puede ver el <b>número total de elementos</b> de cada capa en el extremo derecho de la fila.  
         `
       }
     );
   }

   return steps;
 }


  public ngOnDestroy(): void
  {
      this.routeDataSubscription.unsubscribe();
  }
}
