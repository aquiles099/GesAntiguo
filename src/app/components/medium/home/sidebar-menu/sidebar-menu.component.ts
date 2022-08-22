import { Component, OnInit, OnDestroy, AfterViewInit, EventEmitter, Output } from '@angular/core';
import { User } from '../../../../models/user';
import { AuthenticatedUserService } from '../../../../services/authenticated-user.service';
import { ProjectsService } from '../../../../services/unic/projects.service';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { ProjectService } from '../../../../services/unic/project.service';
import { fadeInOnEnterAnimation, fadeOutOnLeaveAnimation } from 'angular-animations';

interface SidebarMenuOption
{
  id?:string;
  label: string;
  path: string[];
  icon?:string;
  collapse?: boolean;
  children?: Array<SidebarMenuOption>;
}

const ANIMATION_DURATION = 250;

@Component({
  selector: 'sidebar-menu',
  templateUrl: './sidebar-menu.component.html',
  styleUrls: ['./sidebar-menu.component.css'],
  animations:[
    fadeInOnEnterAnimation({duration: ANIMATION_DURATION}),
    fadeOutOnLeaveAnimation({duration: ANIMATION_DURATION})
  ]
})
export class SidebarMenuComponent implements OnInit, AfterViewInit, OnDestroy
{
  private projectsPath = `/medium/home/proyectos`;

  public selectedProjectId:string = null;

  public optionGroups: SidebarMenuOption[] =  [];

  private isInProjectViewRegex:RegExp = new RegExp("^.*\/proyectos\/[0-9]+\/(?!acciones).*$");
  
  private isInProjectActionsViewRegex:RegExp = new RegExp("^.*\/proyectos\/[0-9]+\/acciones.*$");

  private routerEventsSubscription:Subscription;
  private projectServiceSubscription:Subscription;

  @Output()
  public showProjectCreationModal:EventEmitter<void> = new EventEmitter;

  constructor(
    private _authenticatedUserService:AuthenticatedUserService,
    private _projectsService:ProjectsService,
    private _projectService:ProjectService,
    private router:Router
  )
  {
    
  }

  get authenticatedUser():User
  {
    return this._authenticatedUserService.user;
  }

  get numberOfActiveProjects():number
  {
    return this._projectsService.numberOfActiveProjects;
  }

  get numberOfFavoriteActiveProjects():number
  {
    return this._projectsService.numberOfFavoriteActiveProjects;
  }

  get inProjectView():boolean
  {
    return this.isInProjectViewRegex.test( this.router.url );
  }
  
  get inProjectActionsView():boolean
  {
    return this.isInProjectActionsViewRegex.test( this.router.url );
  }

  public ngOnInit():void
  {
    this.projectServiceSubscription = this._projectService.projectObservable.subscribe(project => {

      this.selectedProjectId = project?.id_proyecto.toString();

      this.buildOptionGroups();

    });

    this.expandMenuForCurrentRoute();
  }

  private buildOptionGroups():void
  {
    this.optionGroups = [
      {
        id: "gmao",
        label: 'GMAO',
        path: [this.projectsPath, this.selectedProjectId, "gmao"],
        collapse: true,
        children: [
          {
            label: "Tablero",
            icon: "assets/icons/GRAFICA.svg",
            path: [this.projectsPath, this.selectedProjectId, "gmao", "estadisticas"]
          },
          {
            label: "Incidencias",
            icon: "assets/icons/SVG/solicitud_blanco.svg",
            path: [this.projectsPath, this.selectedProjectId, "gmao", "solicitudes"]
          },
          {
            label: "Órdenes de trabajo",
            icon: "assets/icons/MARTILLO.svg",
            path: [this.projectsPath, this.selectedProjectId, "gmao", "ordenes-de-trabajo"]
          },
          {
            label: "Mantenimiento preventivo",
            icon: "assets/icons/SVG/mant_blanco.svg",
            path: [this.projectsPath, this.selectedProjectId, "gmao", "mantenimiento-preventivo"]
          },
          {
            label: "Configuración",
            path: [this.projectsPath, this.selectedProjectId, "gmao", "configuracion"],
            /*icon: "assets/icons/SVG/AJUSTES.svg",*/
            collapse: true,
            children: [
              {
                label: "Tareas",
                path: [this.projectsPath, this.selectedProjectId, "gmao", "configuracion", "tareas"],
                icon: "assets/icons/SVG/tareablanco.svg"
              },
              {
                label: "Tipo de incidencias/ordenes",
                path: [this.projectsPath, this.selectedProjectId, "gmao", "configuracion", "tipos-incidencias-ordenes"],
                icon: "assets/icons/incidencia_ordenes_blanco.svg"
              },
              {
                label: "Tipo de mantenimiento preventivo",
                path: [this.projectsPath, this.selectedProjectId, "gmao", "configuracion", "tipo-mantenimiento-preventivo"],
                icon: "assets/icons/SVG/tipos_mantenimiento_preventivo_blanco.svg"
              },
               {
                label: "Almacenes",
                path: [this.projectsPath, this.selectedProjectId, "gmao", "configuracion", "almacenes"],
                icon: "assets/icons/SVG/almacen_blanco.svg"
              },
              {
                label: "Marcas",
                path: [this.projectsPath, this.selectedProjectId, "gmao", "configuracion", "marcas"],
                icon: "assets/icons/SVG/marcablanco.svg"
              },
              {
                label: "Modelos",
                path: [this.projectsPath, this.selectedProjectId, "gmao", "configuracion", "modelos"],
                icon: "assets/icons/SVG/modeloblanco.svg"
              },
              {
                label: "Artículos",
                path: [this.projectsPath, this.selectedProjectId, "gmao", "configuracion", "inventarios"],
                icon: "assets/icons/SVG/inventarioblanco.svg"
              },
            ]

          }
        ]
      },
      {
        id: "gestion-energetica",
        label: "Gestión energética",
        path: [this.projectsPath, this.selectedProjectId, "gestion-energetica"],
        collapse: true,
        children: [
        {
            label: "Tablero",
            icon: "assets/icons/PERSONALIZAR_2.svg",
            path: [this.projectsPath, this.selectedProjectId, "gestion-energetica", "tablero"]
          },
          {
            label: "Concentradores",
            icon: "assets/icons/CONCENTRADOR_W.svg",
            path: [this.projectsPath, this.selectedProjectId, "gestion-energetica", "concentradores"]
          },
          {
            label: "Dispositivos",
            icon: "assets/icons/DISPOSITIVOS_W.svg",
            path: [this.projectsPath, this.selectedProjectId, "gestion-energetica", "dispositivos"]
          },
          {
            label: "Localizaciones",
            icon: "assets/icons/MAPA_W.svg",
            path: [this.projectsPath, this.selectedProjectId, "gestion-energetica", "localizaciones"]
          },
          {
            label: "Análisis",
            icon: "assets/icons/GRAFICA.svg",
            path: [this.projectsPath, this.selectedProjectId, "gestion-energetica", "analisis"]
          },
        ]
      },
      // {
      //   label: "Uvax",
      //   path: [this.projectsPath, this.selectedProjectId, "uvax"],
      //   collapse: true,
      //   children: []
      // },
      {
        id: "tellink",
        label: "TELLINK",
        path: [this.projectsPath, this.selectedProjectId, "tellink"],
        collapse: true,
        children: [
          {
            label: "Tablero",
            icon: "assets/icons/GRAFICA.svg",
            path: [this.projectsPath, this.selectedProjectId, "tellink", "tablero"]
          },
          {
            label: "Centros de mando",
            path: [this.projectsPath, this.selectedProjectId, "tellink", "centros-de-mando"],
            icon: "assets/icons/DISPOSITIVOS_W.svg"
          },
          {
            label: "Perfiles de alarmas",
            path: [this.projectsPath, this.selectedProjectId, "tellink", "perfiles-de-alarmas"],
            icon: "assets/icons/SVG/INCIDENCIA_white.svg",
          }
        ]
      }
    ];
  }

  private expandMenuForCurrentRoute(options?:SidebarMenuOption []):void
  {
    const _options = options ?? this.optionGroups;

    for(let option of _options)
    {
      if( option.hasOwnProperty("collapse") )
      {
        let path = Array.isArray( option.path ) ?
        option.path.join("/") : option.path;

        option.collapse = ! this.router.url.includes( path );

        if( option?.children )
          this.expandMenuForCurrentRoute( option.children );
      }
    }
  }

  public ngAfterViewInit(): void 
  {
    this.routerEventsSubscription = this.router.events.subscribe((event) => {

      if (event instanceof NavigationEnd)
        this.expandMenuForCurrentRoute();

    });
  }

  public getAvailableOptionGroups():SidebarMenuOption[]
  {
    return this.optionGroups.filter(
      group => this.authenticatedUser.hasAccessToTheModule(group.id)
    )
  }

  public toggleCollapseStateInMenus(menu:SidebarMenuOption):void
  {
    menu.collapse = ! menu.collapse;

    if( ! menu.collapse )
    {
      const isAChildMenu = this.optionGroups.every(_menu => _menu !== menu);
      
      const collapseMenus = (menus:SidebarMenuOption[]) => {

        for(let _menu of menus )
        {
            if( _menu.hasOwnProperty("collapse") )
            {
              _menu.collapse  = true;
    
              if( _menu.children )
                collapseMenus( _menu.children );
            }
        }

      };

      let menus;

      if( isAChildMenu )
      {
        const parentMenu = this.optionGroups.find(_menu => _menu.children.includes(menu))
        menus = parentMenu.children.filter(_menu => _menu !== menu);
      }
      else
      {
        menus = this.optionGroups.filter(_menu => _menu !== menu);
      }

      collapseMenus(menus);
    }
  }

  public showProjectCreationModalEvent():void
  {
    this.showProjectCreationModal.emit();
  }

  public ngOnDestroy(): void
  {
    this.routerEventsSubscription.unsubscribe();
    this.projectServiceSubscription.unsubscribe();
  }
}
