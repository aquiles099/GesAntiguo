import { Component, OnInit, OnDestroy } from '@angular/core';
import { Project } from '../../../../../../../../../interfaces/project';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { showPreconfirmMessage } from 'src/app/shared/helpers';
import { SpinnerService } from '../../../../../../../../../services/spinner.service';
import { ToastrService } from 'ngx-toastr';
import { ProjectsService } from '../../../../../../../../../services/unic/projects.service';
import { AuthenticatedUserService } from '../../../../../../../../../services/authenticated-user.service';
import { User } from 'src/app/models/user';

interface Option
{
  id?:string;
  title?:string;
  collapsible?:boolean;
  collapsed?:boolean;
  children?:Array<Option>;
  iconSrc?:string;
  path?:string;
  action?:string;
}

@Component({
  templateUrl: './actions.component.html',
  styleUrls: [
    './actions.component.css',
    '../../../../../../../../../../themes/styles/default-view.scss'
  ]
})
export class ActionsComponent implements OnInit, OnDestroy
{
  public project:Project;

  private routeDataSubscription:Subscription;
  // private paramsSubscription:Subscription;

  public groups:Option[] = [];

  constructor(
    private route:ActivatedRoute,
    private _spinnerService:SpinnerService,
    private _toastrService:ToastrService,
    private _projectsService:ProjectsService,
    private _authenticatedUserService:AuthenticatedUserService,
    private router:Router
  ) { }

  get authenticatedUser():User
  {
    return this._authenticatedUserService.user;
  }

  public async ngOnInit():Promise<void>
  {

    this.routeDataSubscription = this.route.parent.data.subscribe(data => {
    
      this.project = data.project;

      this.buildOptions();
    
    });

    // this.paramsSubscription = this.route.queryParams.subscribe(params => {
    
    //   if( params.hasOwnProperty('bloque'))
    //   {
    //     const group = this.groups.find(group => group.id === params["bloque"]);
    
    //     if(group)
    //       group.collapsed = false;
    //   }
    // });
  }

  private buildOptions():void
  {
    this.groups = [
      {
        collapsible: false,
        children:  [
          {
            title: "Ir al mapa",
            iconSrc: "assets/icons/SVG/localizacion.svg",
            path: `/medium/proyectos/${this.project.id_proyecto}/mapa`
          },
          {
            title: "Información",
            iconSrc: "assets/icons/SVG/LISTADO.svg",
            path: `../informacion`
          }
        ]
      }
    ];

    if( this.authenticatedUser.isAdmin )
    {
      this.groups.push({
        id: "administracion",
        title: "Administración",
        collapsed: true,
        collapsible: true,
        children:  [
          {
            title: "Gestionar permisos",
            iconSrc: "assets/icons/SVG/AJUSTES.svg",
            path: `../gestion-de-permisos`
          },
          {
            title: "Configurar capas",
            iconSrc: "assets/icons/SVG/boton_capaz_activado.svg",
            path: `/medium/proyectos/${this.project.id_proyecto}/configuracion`
          },
          {
            title: "Configurar atributos",
            iconSrc: "assets/icons/SVG/atributos.svg",
            path: `../configuracion-de-atributos`
          },
          {
            title: "Eliminar",
            iconSrc: "assets/icons/SVG/PAPEPERA_R.svg",
            action:`deleteProject`
          }
        ]
      });
    }

    if( this.authenticatedUser.hasAccessToTheModule("gmao") )
    {
      this.groups.push(   {
        id: "gmao",
        title: "GMAO",
        collapsed: true,
        collapsible: true,
        children:  [
          {
            title: "Tablero",
            iconSrc: "assets/icons/SVG/GRAFICA.svg",
            path: `../gmao/estadisticas`
          },
          {
            title: "Incidencias",
            iconSrc: "assets/icons/SVG/solicitud.svg",
            path: `../gmao/solicitudes`
          },
          {
            title: "Órdenes de trabajo",
            iconSrc: "assets/icons/SVG/MARTILLO_b.svg",
            path: `../gmao/ordenes-de-trabajo`
          },
          {
            title: "Mantenimiento preventivo",
            iconSrc: "assets/icons/SVG/mantenimiento_preventivo.svg",
            path: `../gmao/mantenimiento-preventivo`
          },
          
          {
             title: "Configuración",
             collapsed: true,
             collapsible: true,
             children:  [
                /*{
                  title: "Familias",
                  iconSrc: "assets/icons/SVG/familia.svg",
                  path: `../gmao/configuracion/familias`
                },
                {
                  title: "Sub-familias",
                  iconSrc: "assets/icons/SVG/subfamilia.svg",
                  path: `../gmao/configuracion/sub-familias`
                },
*/                 {
                   title: "Almacenes",
                   iconSrc: "assets/icons/SVG/almacen.svg",
                   path: `../gmao/configuracion/almacenes`
                 },
                {
                  title: "Marcas",
                  iconSrc: "assets/icons/SVG/marca.svg",
                  path: `../gmao/configuracion/marcas`
                },
                {
                  title: "Modelos",
                  iconSrc: "assets/icons/MODELO_b.svg",
                  path: `../gmao/configuracion/modelos`
                },
                {
                  title: "Artículos",
                  iconSrc: "assets/icons/SVG/tarea.svg",
                  path: `../gmao/configuracion/inventarios`
                },
                {
                  title: "Tareas",
                  iconSrc: "assets/icons/SVG/tarea.svg",
                  path: `../gmao/configuracion/tareas`
                },
                {
                  title: "Tipos de incidencias / Ordenes",
                  iconSrc: "assets/icons/incidencia_ordenes.svg",
                  path: `../gmao/configuracion/tipos-incidencias-ordenes`
                },
                {
                  title: "Tipos de mantenimiento preventivo",
                  iconSrc: "assets/icons/SVG/tipos_mantenimiento_preventivo.svg",
                  path: `../gmao/configuracion/tipo-mantenimiento-preventivo`
                },
                {
                  title: "Tipo de inventario",
                  iconSrc: "assets/icons/SVG/tipos_inventarios.svg",
                  path: `../gmao/configuracion/tipo-inventario`
                },
              ]
             },
        ]
      });
    }

    if( this.authenticatedUser.hasAccessToTheModule("gestion-energetica") )
    {
      this.groups.push({
        id: "gestion-energetica",
        title: "Gestión energética",
        collapsed: true,
        collapsible: true,
        children:  [
          {
            title: "Análisis",
            iconSrc: "assets/icons/SVG/GRAFICA.svg",
            path: `../gestion-energetica/analisis`
          },
          {
            title: "Consultas",
            iconSrc: "assets/icons/SVG/LUPA.svg",
            path: `../gestion-energetica/consulta`
          },
          {
            title: "Alertas",
            iconSrc: "assets/icons/SVG/INCIDENCIA.svg",
            path: `../gestion-energetica/alertas`
          },
          {
            title: "Tablero",
            iconSrc: "assets/icons/PERSONALIZAR.svg",
            path: `../gestion-energetica/tablero`
          },
          {
            title: "Concentradores",
            iconSrc: "assets/icons/SVG/CONCENTRADOR.svg",
            path: `../gestion-energetica/concentradores`
          },
          {
            title: "Dispositivos",
            iconSrc: "assets/icons/SVG/DISPOSITIVOS.svg",
            path: `../gestion-energetica/dispositivos`
          },
          {
            title: "Localizaciones",
            iconSrc: "assets/icons/SVG/MAPA.svg",
            path: `../gestion-energetica/localizaciones`
          },
        ]
      });
    }

    if( this.authenticatedUser.hasAccessToTheModule("tellink") )
    {
      this.groups.push( {
        id: "tellink",
        title: "TELLINK",
        collapsed: true,
        collapsible: true,
        children:  [
          {
            title: "Tablero",
            iconSrc: "assets/icons/PERSONALIZAR.svg",
            path: `../tellink/tablero`
          },
          {
            title: "Centros de mando",
            iconSrc: "assets/icons/SVG/DISPOSITIVOS.svg",
            path: `../tellink/centros-de-mando`
          },
          {
            title: "Perfiles de alarmas",
            iconSrc: "assets/icons/SVG/INCIDENCIA.svg",
            path: `../tellink/perfiles-de-alarmas`
          },
        ]
      });
    }
  }

  public toggleCollapsedStateInGroups(group:Option):void
  {
    this.groups.forEach(_group => {
      
      if( _group !== group && group.hasOwnProperty("collapsed"))
        _group.collapsed = true

    });

    group.collapsed = ! group.collapsed;

    // this.router.navigate(["."], {
    //   relativeTo: this.route,
    //   queryParams: {bloque: group.id}
    // });
  }

  public async deleteProject():Promise<void>
  {
    try
    {
      const userResponse = await showPreconfirmMessage(
        "¿Estas seguro?",
        `¿Eliminar proyecto ${this.project.nombre}?. <br> <b>Esta acción no es reversible</b>.`
      );
  
      if( userResponse.isConfirmed )
      {
        this._spinnerService.show();

        await this._projectsService.delete(this.project);

        this._toastrService.success("Proyecto eliminado","Exito!");

        this.router.navigateByUrl("/medium/home/proyectos");
      }
    }
    catch (error)
    {
      this._toastrService.error(error.message);
    }
    finally
    {
      this._spinnerService.hide();
    }
  }

  public ngOnDestroy(): void
  {
    this.routeDataSubscription.unsubscribe();
    // this.paramsSubscription.unsubscribe();
  }
}
