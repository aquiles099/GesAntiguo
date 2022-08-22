import { Component, OnInit, OnDestroy } from '@angular/core';
import { Project } from '../../../../../../../interfaces/project';
import { ProjectsService } from '../../../../../../../services/unic/projects.service';
import { ToastrService } from 'ngx-toastr';
import { SpinnerService } from '../../../../../../../services/spinner.service';
import { ShepherdService } from 'angular-shepherd';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css']
})
export class ListComponent implements OnInit, OnDestroy
{
  public projects: Project[] = [];
  public filteredProjects: Project[] = [];

  public onlyFavoriteProjects:boolean = false;

  public sortOptions:any[] = [
    {
      label:"Reciente",
      value:"ultimo_acceso"
    },
    {
      label:"Alfabéticamente",
      value:"nombre"
    }
  ];

  public sortOrder:string = "nombre";
  public sortMode:"asc"|"desc" = "asc";
  
  public projectModules:any[] = [];
  public selectedModule:string = null;

  public search:string = null;

  private projectsSubscription:Subscription;
  private paramsSubscription:Subscription;


  constructor(
    private _route:ActivatedRoute,
    private _projectsService: ProjectsService,
    private _shepherdService:ShepherdService,
  )
  {
  }

  get tourIsActive():boolean
  {
    return this._shepherdService.isActive;
  }

  public ngOnInit(): void
  {    
    this.projectsSubscription = this._projectsService.project$.subscribe(
      projects => this.projects = this.filteredProjects = projects
    );

    this.paramsSubscription = this._route.queryParams.subscribe(params => {
    
      this.onlyFavoriteProjects = params.hasOwnProperty('favoritos')
    
      this.filteredProjects = this.onlyFavoriteProjects ?
      this.projects.filter(project => project.favorito) :
      this.projects;

      this.getProjectModules();
      
    });
  }
  
  private getProjectModules():void
  {
    const modules = new Set;
  
    this.projects.forEach(project => 
      project.modulos.forEach(module => modules.add(module.modulo))
    );
    
    this.projectModules = Array.from(modules);
    this.projectModules.unshift("Todos");    
  }

  public changeSortMode():void
  {
    if( this.tourIsActive )
      return;
      
    this.sortMode = this.sortMode === "asc" ? "desc" : "asc";
    this.onChangeOrder();
  }

  public onChangeOrder(event?:any):void
  {
    if( event )
      this.sortOrder = event.target.value;

    switch( this.sortOrder )
    {
      case "ultimo_acceso":
        this.sortProjectsByLastAccess();
        break;

      default:
        this.sortProjectsByProperty();
        break;
    }
  } 

  private sortProjectsByLastAccess():void
  {
    this.projects.sort((a:any, b:any) => {

        let _a = a, _b = b;

        if( this.sortMode === "desc" )
        {
            _a = b;
            _b = a;
        }
        
        _a = _a[this.sortOrder] ? new Date(_a[this.sortOrder]).getTime() : 0;
        _b = _b[this.sortOrder] ? new Date(_b[this.sortOrder]).getTime() : 0;
        
        return _b - _a;
    });

  }

  private sortProjectsByProperty():void
  {
      this.projects.sort((a:any, b:any) => {

        let _a = a, _b = b;

        if( this.sortMode === "desc" )
        {
            _a = b;
            _b = a;
        }
        
        _a = _a[this.sortOrder];
        _b = _b[this.sortOrder];
        
        if( ! isNaN(_a) && ! isNaN(_b) )
        {
            return _a - _b;
        }
        else
        { 
          _a = _a ? _a.charAt(0).toLowerCase() : null;
          _b = _b ? _b.charAt(0).toLowerCase() : null;

          let value;

          switch(true)
          {
              case _a > _b :
                  value = 1;
                  break;
              case _a < _b :
                  value = -1;
                  break;
              case _a === _b :
                  value = 0;
                  break;
          }

          return value;
        }
      });
  }

  public onChangeCategory(event:any):void
  {
    this.selectedModule = event.target.value;

    if( this.selectedModule === "Todos" )
    {
      this.filteredProjects = this.projects;
    }
    else
    {
      this.filteredProjects = this.projects.filter(
        project => project.modulos.some(module => module.modulo === this.selectedModule) 
      );
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
       content: 'Visualize los proyectos activos haciendo click en éstas opciones.'
     },
     {
       element: `bottom-section`,
       selectorPrefix: ".",
       labelPosition: "right-start",
       content: 'Gestione <b>proyectos, usuarios y empresas</b> con las opciones de la parte inferior de la barra.'
     },
     {
       element: `projects-container`,
       labelPosition: "top",
       content: 'Aquí puede visualizar el listado de proyectos.'
     },
     {
       element: `projects-list-header`,
       labelPosition: "bottom",
       content: 'Organize y filtre para facilitar la busqueda.'
     },
     {
       element: `sort-projects-selector-container`,
       labelPosition: "bottom",
       content: `
       Puede organizar de forma <b>alfabética</b> o en 
       base a la fecha <b>más reciente</b> en la que se accedido a un proyecto.
       <br><br>
       Para definir el orden (<b>ascendente o descendente</b>), 
       hacer click <i class="fas fa-arrow-up"></i> / <i class="fas fa-arrow-down"></i>.
       `
     },
     {
       element: `projects-by-module-selector-container`,
       labelPosition: "bottom",
       content: `
       Filtre en base a un modulo.
       `
     },
     {
       element: `projects-finder-input-container`,
       labelPosition: "bottom",
       content: `
       Utilice el buscador para filtrar proyectos que coincidan con un texto.
       `
     }
   ];

   if( this.filteredProjects.length )
   {
    const imageOfFirstProjectInTheList = document.querySelector(".project-zone-image");
    const spinnerOfFirstProjectImageInTheList = document.querySelector(".project-zone-image-spinner");

     steps.push(
        ( {
         element: "project-zone-image",
         selectorPrefix: ".",
         labelPosition: "auto",
         content: `
          Puede previsualizar la imagen del <b>municipio</b> del proyecto. 
          Hacer click sobre ésta para ir a <b>acciones de proyecto</b>. 
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
                if( spinnerOfFirstProjectImageInTheList && ! spinnerOfFirstProjectImageInTheList.classList.contains("d-none") )
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
         element: "project-users",
         selectorPrefix: ".",
         labelPosition: "auto",
         content: `
          Aquí puede ver las <b>iniciales de los nombres de usuarios asociados</b>. 
          <br>
          Posicione el cursor sobre los círculos para ver el nombre completo de cada uno.
         `
       },
       {
         element: "last-access-tag",
         selectorPrefix: ".",
         labelPosition: "auto",
         content: `
          Aquí puede ver la <b>fecha del último acceso</b>. 
         `
       },
       {
         element: "add-project-to-favorite",
         selectorPrefix: ".",
         labelPosition: "auto",
         content: `
          Para añadir un proyecto cómo <b>favorito</b>, 
          hacer click sobre <img class="d-inline small-icon mx-1" src="assets/icons/SVG/FAVORITO.svg"> 
          y esperar unos segundos a que se muestre en amarillo (<img class="d-inline small-icon mx-1" src="assets/icons/SVG/FAVORITO_R.svg">).
          <br>
          Podrá visualizar el proyecto en la sección de <b>favoritos</b>.  
         `
       },
       {
         element: "add-project-to-favorite",
         selectorPrefix: ".",
         labelPosition: "auto",
         content: `
          Para eliminarlo de <b>favoritos</b>, 
          hacer click sobre <img class="d-inline small-icon mx-1" src="assets/icons/SVG/FAVORITO_R.svg"> 
          y esperar unos segundos a que se muestre transparente (<img class="d-inline small-icon mx-1" src="assets/icons/SVG/FAVORITO.svg">).  
         `
       }
     );
   }

   return steps;
 }

  public ngOnDestroy():void
  {
    this.paramsSubscription.unsubscribe();
    this.projectsSubscription.unsubscribe();
    this._shepherdService.tourObject = null;    
  }
}
