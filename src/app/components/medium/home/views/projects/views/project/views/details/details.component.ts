import { Component, OnInit, OnDestroy } from '@angular/core';
import { ShepherdService } from 'angular-shepherd';
import { Project } from '../../../../../../../../../interfaces/project';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  templateUrl: './details.component.html',
  styleUrls: [
    './details.component.css',
    '../../../../../../../../../../themes/styles/default-view.scss'
  ]
})
export class DetailsComponent implements OnInit, OnDestroy
{
  public project:Project;
  
  public additionalData:any;

  public showSpinner:boolean = false;

  private routeDataSubscription:Subscription;

  constructor(
    private route:ActivatedRoute,
    private _shepherdService:ShepherdService
  ) { }

  get tourIsActive():boolean
  {
    return this._shepherdService.isActive;
  }

  public async ngOnInit():Promise<void>
  {
    this.routeDataSubscription = this.route.data.subscribe(_data => {

      const {project, details } = _data.data;

      this.project = project;
      this.additionalData = details;

      this.formatModuleLayerData();

    });
  }

  private formatModuleLayerData():void
  {
    this.additionalData.modulos.forEach(modulo => {

      modulo["colapsado"] = false;
      modulo.grupos.forEach(grupo => grupo["colapsado"] = false);

    });
  }

  public toggleModuleLayerDataVisibility(modulo:any):void
  {
    if( this.tourIsActive )
      return;

    modulo.colapsado = ! modulo.colapsado;
  }

  public toggleLayerGroupDataVisibility(grupo:any):void
  {
    if( this.tourIsActive )
      return;

    grupo.colapsado = ! grupo.colapsado;
  }

  /* TOUR */

 public showTour():void
 {
   if( this.tourIsActive )
     return;

   this.buildTour();

   this.additionalData.modulos.forEach(modulo => {

    modulo.colapsado = false;
    modulo.grupos.forEach(grupo => grupo.colapsado = false);

  });

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
       element: `project-users-info-container`,
       selectorPrefix: `.`,
       labelPosition: "left",
       content: 'Aquí se muestra el <b>número de usuarios total y por departamento</b>.'
     },
     {
       element: `module-layer-data-container`,
       selectorPrefix: ".",
       labelPosition: "top",
       content: 'La información de módulos > grupos > capas se mostrará aquí.'
     }
   ];

   if( this.additionalData.modulos.length )
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
    this._shepherdService.tourObject = null;    
  }
}
