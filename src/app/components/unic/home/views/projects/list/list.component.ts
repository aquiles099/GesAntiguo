import { Component, OnInit, OnDestroy } from '@angular/core';
import { Project } from '../../../../../../interfaces/project';
import { Subscription } from 'rxjs';
import { showPreconfirmMessage } from 'src/app/shared/helpers';
import { ProjectsService } from '../../../../../../services/unic/projects.service';
import { ToastrService } from 'ngx-toastr';
import { GeojsonFilesService } from '../../../../../../services/unic/geojson-files.service';
import { GeojsonLayerImagesService } from '../../../../../../services/unic/geojson-layer-images.service';
import { GeojsonFilesAnalysisChartsConfigurationsService } from '../../../../../../services/unic/geojson-files-analysis-charts-configurations.service';
import { ProjectAction } from '../../../../../shared/projects/project-card/project-card.component';
import { SpinnerService } from '../../../../../../services/spinner.service';
import { ShepherdService } from 'angular-shepherd';

@Component({
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css']
})
export class ListComponent implements OnInit, OnDestroy
{
  public title:string = "";

  public projects: Array<Project> = [];
  private projectsSubscription:Subscription;
  
  public showSpinner: boolean = true;

  constructor(
    private _toastrService:ToastrService,
    private _spinnerService:SpinnerService,
    private _projectsService:ProjectsService,
    private _geojsonFilesService:GeojsonFilesService,
    private _geojsonLayerImagesService:GeojsonLayerImagesService,
    private _geojsonFilesAnalysisChartsConfigurationsService:GeojsonFilesAnalysisChartsConfigurationsService,
    private _shepherdService:ShepherdService

  ) { }

  public ngOnInit(): void
  {
    this.projectsSubscription = this._projectsService.project$.subscribe(data => this.projects = data ?? []);
  }

  public handleProjectAction(action:ProjectAction):void
  {
    switch(action.name)
    {
      case "delete":
        this.deleteProject(action.project)
        break;
    }
  }
  public async deleteProject(project:Project):Promise<void>
  {
    try
    {
      const userResponse = await showPreconfirmMessage(
        "¿Estas seguro?",
        `¿Eliminar proyecto ${project.nombre}?. Esta acción no es reversible.`
      );
  
      if( userResponse.isConfirmed )
      {
        this._spinnerService.updateText("Eliminando proyecto...");
        this._spinnerService.show();

        await this._projectsService.delete( project );

        await this._geojsonFilesService.deleteObjectStoresAndReopenIDBConnection([project.id_proyecto]);
        await this._geojsonLayerImagesService.deleteObjectStoresAndReopenIDBConnection([project.id_proyecto]);
        await this._geojsonFilesAnalysisChartsConfigurationsService.deleteObjectStoresAndReopenIDBConnection([project.id_proyecto]);  
        
        this._toastrService.success("Proyecto eliminado","Exito!");
      }
    }
    catch (error)
    {
      this._toastrService.error(error.message);
    }
    finally
    {
      this._spinnerService.cleanText();
      this._spinnerService.hide();
    }
  }

   /* TOUR */

 public showTour():void
 {
   if( this._shepherdService.isActive )
     return;

   this.buildTour();

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
       element: `top-section`,
       selectorPrefix: `.`,
       labelPosition: "right",
       content: 'Visualize los proyectos haciendo click en la opción de la parte superior.'
     },
     {
       element: `bottom-section`,
       selectorPrefix: ".",
       labelPosition: "right-start",
       content: 'Registre <b>nuevos proyectos</b> con la opción de la parte inferior de la barra.'
     },
     {
       element: `projects-container`,
       labelPosition: "top",
       content: 'Aquí puede visualizar el listado de proyectos.'
     }
   ];

   if( this.projects.length )
   {
    const imageOfFirstProjectInTheList = document.querySelector(".project-zone-image");
    const spinnerOfFirstProjectImageInTheList = document.querySelector(".project-zone-image-spinner");

     steps.push(
        ( {
         element: "project-zone-image",
         selectorPrefix: ".",
         labelPosition: "auto",
         content: `
          Puede previsualizar la imagen de la zona (<b>municipio</b>) del proyecto. 
         `,
         event: {
           "before-show": () => {

                // si la imagen del 1er proyecto no se cargo
                // remover clases 'd-none' para que tour pueda 
                // ubicar elemento y contiuar.
                if( imageOfFirstProjectInTheList.classList.contains("d-none") )
                  imageOfFirstProjectInTheList.classList.remove("d-none");
           },
           "before-hide": () => {

                // volver a esconder la imagen de proyecto
                // en caso de que no se haya cargado
                // (si el spinner no tiene la clase 'd-none').
                if( ! spinnerOfFirstProjectImageInTheList.classList.contains("d-none") )
                  imageOfFirstProjectInTheList.classList.add("d-none");
           }
         }
       } as any),
       {
         element: "project-modules-icons",
         selectorPrefix: ".",
         labelPosition: "auto",
         content: `
          Aquí puede ver los <b>modulos asociados</b>. 
          <br>
          Posicione el cursor sobre los iconos para ver el nombre de cada uno.
         `
       },
       {
         element: "options-list-col",
         selectorPrefix: ".",
         labelPosition: "auto",
         content: `
          Para ver / ocultar las <b>opciones de proyecto</b>, 
          hacer click sobre <img class="d-inline small-icon mx-1" src="assets/icons/SVG/3PUNTOS.svg">
          y se desplegará el listado. 
         `
       }
     );
   }

   return steps;
 }
  
  public ngOnDestroy(): void
  {
    this._shepherdService.tourObject = null;    
    this.projectsSubscription.unsubscribe();
  }
}
