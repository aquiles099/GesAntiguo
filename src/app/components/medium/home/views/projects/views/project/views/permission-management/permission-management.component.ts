import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import Swal from 'sweetalert2';
import { ShepherdService } from 'angular-shepherd';
import { ApiService } from '../../../../../../../../../services/api.service';
import { Project } from '../../../../../../../../../interfaces/project';
import { Subscription } from 'rxjs';
import { getRandomInt } from 'src/app/shared/helpers';
import { PermissionManagementService } from '../../../../../../../../../services/medium/administration/permission-management.service';

@Component({
  templateUrl: './permission-management.component.html',
  styleUrls: [
    './permission-management.component.css',
    '../../../../../../../../../../themes/styles/default-view.scss'
  ]
})
export class PermissionManagementComponent implements OnInit, OnDestroy
{
  public project: Project;

  imagenModulo: any;
  Cantidadusuario: any;
  public data = [];
  dataInicial = [];
  dataTablaPermiso: any[]
  mostrarchecbookEditable: boolean = false;
  public tipo_acceso: any[] = [];
  lista_permisos: any[] = [];
  lista_gmao: any[] = [];
  lista_telemedida: any[] = [];

  public showSpinner: boolean = false;
  
  permisosTipo: any;
  searchText: string;

  columnaPermisos: number;

  private routeDataSubscription: Subscription;

  public badgeColors: string[] = [
    "#0A8A3D",
    "#6E63C8",
    "#FFF",
    "#FF5F58",
    "#288635",
    "#BDBDBD",
    "#3498db"
  ];

  constructor(
    private _apiService: ApiService,
    private changeDetector: ChangeDetectorRef,
    private _shepherdService: ShepherdService,
    private _permissionManagementService:PermissionManagementService,
    private route: ActivatedRoute,
  ) { }

  get tourIsActive(): boolean {
    return this._shepherdService.isActive;
  }

  public ngOnInit(): void {

    this.routeDataSubscription = this.route.data.subscribe(_data => {

      this.project = _data.data.project;

      this.buildTable(_data.data.permissionsData);

    });
  }

  private buildTable(permissionsData?:any):void
  {
    this.permisosTipo = permissionsData.datos.tipo_accesos; // Recogemos el tipo de acceso que habrá al crear la tabla
    
    if (this.permisosTipo.length > 0) {
      this.columnaPermisos = 12 / this.permisosTipo.length;
    }

    this.dataTablaPermiso = permissionsData.datos.usuarios;
    this.imagenModulo = permissionsData.datos.modulos
    this.changeDetector.detectChanges();

    this.data = [];
    this.dataInicial = [];

    permissionsData.datos.usuarios.forEach((usuario) => {

      let contador = 1; //Variable que tendrá el número de filas para cada usuario

      //Para cada módulo, creamos una fila en la tabla
      usuario.modulos.forEach((modulo) => {

        let usuarioFila = {
          user: "",
          firstName: "",
          lastName: "",
          fullName: "",
          contador: 0,
          gmao: false,
          moduloNombre: "",
          modulo: "",
          telemedida: false,
          tieneTelemedida: false,
          icono: "",
          grupo1: "",
          grupo2: "",
          permisos1: [],
          permisos2: [],
          colorIndex: getRandomInt(this.badgeColors.length)
        };

        usuarioFila.user = usuario.usuario;
        usuarioFila.firstName = usuario.nombre;
        usuarioFila.lastName =  usuario.apellidos;
        usuarioFila.fullName = usuario.nombre + " " + usuario.apellidos;
        usuarioFila.contador = contador;
        usuarioFila.gmao = usuario.gmao;
        usuarioFila.moduloNombre = modulo.nombre;
        usuarioFila.modulo = modulo.icono;

        modulo.grupos.forEach((grupo) => {

          //Solo si el grupo es Gestlighting, la fila tendrá telemedida
          if (grupo.nombre === "Gestlighting") {
            usuarioFila.telemedida = grupo.telemedida;
            usuarioFila.tieneTelemedida = true;
          }

        });

        //Para el grupo 1, guardamos su nombre y permisos
        if (modulo.grupos[0]) {
          usuarioFila.grupo1 = modulo.grupos[0].nombre;
          usuarioFila.permisos1 = modulo.grupos[0].permisos;

        }

        //Para el grupo 2 (si lo hubiera), guardamos su nombre y permisos
        if (modulo.grupos[1]) {
          usuarioFila.grupo2 = modulo.grupos[1].nombre;
          usuarioFila.permisos2 = modulo.grupos[1].permisos;
        }

        contador++;

        //Añadimos la fila al array de filas
        this.data.push(usuarioFila);
      });

    });

    //Guardamos los datos iniciales, para usarlos si el usuario cancela la edición
    this.dataInicial = JSON.parse(JSON.stringify(this.data));

    //Comprobamos cuantos usuarios tienen al menos un permiso
    this.Cantidadusuario = 0;

    permissionsData.datos.usuarios.forEach((usuario) => {//Para cada usuario
      let tieneAcceso = false;
      usuario.modulos.forEach((modulo) => {//Para cada modulo
        modulo.grupos.forEach((grupo) => {//Para cada grupo
          grupo.permisos.forEach((permiso) => {//Para cada permiso

            //Si tiene permiso
            if (permiso.activo) {
              tieneAcceso = true;//La variable que indica si tiene algún permiso será true
            }
          });
        });
      });

      //Si hemos comprobado que tiene al menos 1 permiso
      if (tieneAcceso) {

        //Aumentamos en 1 la cantidad de usuarios con algún permiso
        this.Cantidadusuario++;
      }
    });

  }

  public getFullNameInitials(firstName:string, lastName:string):string
  {
      return firstName.trim().split(" ")[0][0].toUpperCase() +
              lastName.trim().split(" ")[0][0].toUpperCase();
  }

  onClickEditarTabla() {
    this.mostrarchecbookEditable = true;

  }
  onClickCancelar() {
    this.mostrarchecbookEditable = false;

    //Volvemos a dejar la tabla como estaba antes de empezar la edición
    this.data = [];
    this.data = JSON.parse(JSON.stringify(this.dataInicial));

  }

  onGuardarPermisos() {
    this.mostrarchecbookEditable = false;

    this.ModificarPermiso();
  }

  //Check de permisos pulsado
  cambiado(usuario, grupo, permisos, check) {

    //SI HAY ALGUN OTRO CHECK ACTIVO, LO DESMARCAMOS (puesto que el maximo es 1)
    //Si está activando el check
    if (check) {
      this.data.forEach((fila) => {

        //Si el check es del primer grupo
        if (fila.grupo1 === grupo && fila.user === usuario.user) {
          fila.permisos1.forEach((permiso) => {
            if (permiso.nombre !== permisos.nombre) {
              if (permiso.activo) {
                permiso.activo = false;
                this.lista_permisos.push({
                  usuario: usuario.user,
                  modulo: usuario.moduloNombre,
                  grupo: grupo,
                  id_permiso: permisos.id,
                  activo: false
                });
              }

            }
          });

          //Si el check es del segundo grupo
        } else if (fila.grupo2 === grupo && fila.user === usuario.user) {
          fila.permisos2.forEach((permiso) => {
            if (permiso.nombre !== permisos.nombre) {
              if (permiso.activo) {
                permiso.activo = false;
                this.lista_permisos.push({
                  usuario: usuario.user,
                  modulo: usuario.moduloNombre,
                  grupo: grupo,
                  id_permiso: permisos.id,
                  activo: false
                });
              }
            }
          });
        }
      });
      //Si está desactivando el check
      //Comprobamos si es hay que desactivar gmao y/o telemedida
    } else {
      let gmaoactivar = false;
      let telemedidaactivar = false;

      this.data.forEach((fila) => {

        //Comprobamos si queda algún check activo
        if (fila.user === usuario.user) {
          fila.permisos1.forEach((permiso1) => {
            if (permiso1.activo) {
              gmaoactivar = true;
            }
          });

          fila.permisos2.forEach((permiso2) => {
            if (permiso2.activo) {
              gmaoactivar = true;
            }
          });

          //Comprobamos si queda algún check de energy para telemedida
          if (fila.grupo1 === "Gestlighting") {
            fila.permisos1.forEach((permiso1) => {
              if (permiso1.activo) {
                telemedidaactivar = true;
              }
            });
          }
          if (fila.grupo2 === "Gestlighting") {
            fila.permisos2.forEach((permiso2) => {
              if (permiso2.activo) {
                telemedidaactivar = true;
              }
            });
          }

        }

      });

      //Si hemos desactivado todos los check de permisos, desactivamos el gmao
      if (!gmaoactivar) {
        //Actualizamos el estado del check para todas las filas de ese usuario
        this.data.forEach((fila) => {
          if (fila.user === usuario.user && fila.gmao) {
            this.cambiadoGMAO(usuario.user, false);
          }
        });
      }

      //Si hemos desactivado todos los check de energy, desactivamos telemedida
      if (!telemedidaactivar) {
        //Actualizamos el estado del check para todas las filas de ese usuario
        this.data.forEach((fila) => {
          if (fila.user === usuario.user && fila.telemedida) {
            this.cambiadoTelemedida(usuario.user, false);
          }
        });
      }

    }


    this.lista_permisos.push({
      usuario: usuario.user,
      modulo: usuario.moduloNombre,
      grupo: grupo,
      id_permiso: permisos.id,
      activo: permisos.activo
    });

  }

  //Check de telemedida
  cambiadoTelemedida(usuario: string, checked: boolean) {

    //Si se está activando el check
    if (checked) {
      let permitirActivar = false;
      //Comprobamos si hay algún permiso de energy activo antes de permitirlo
      this.data.forEach((fila) => {
        if (fila.user === usuario) {
          if (fila.grupo1 === "Gestlighting") {
            fila.permisos1.forEach((permiso1) => {
              if (permiso1.activo) {
                permitirActivar = true;
              }
            });

            if (fila.grupo2 === "Gestlighting") {
              fila.permisos2.forEach((permiso2) => {
                if (permiso2.activo) {
                  permitirActivar = true;
                }
              });
            }
          }
        }

      });

      if (permitirActivar) {

        //Actualizamos el estado del check para todas las filas de ese usuario
        this.data.forEach((fila) => {
          if (fila.user === usuario) {
            fila.telemedida = checked;
          }
        });

        this.lista_telemedida.push({
          usuario: usuario,
          telemedida: checked
        });

      } else {
        setTimeout(() => {
          //Actualizamos el estado del check para todas las filas de ese usuario
          this.data.forEach((fila) => {
            if (fila.user === usuario) {
              fila.telemedida = false;
            }
          });
          this.changeDetector.detectChanges();
        }, 10);

      }

      //Si se está desactivando el check
    } else {
      //Actualizamos el estado del check para todas las filas de ese usuario
      this.data.forEach((fila) => {
        if (fila.user === usuario) {
          fila.telemedida = checked;
        }
      });

      this.lista_telemedida.push({
        usuario: usuario,
        telemedida: checked
      });
    }


  }

  //Check de gmao
  cambiadoGMAO(usuario: string, checked: boolean) {

    //Si se está activando el check
    if (checked) {
      let permitirActivar = false;
      //Comprobamos si hay algún permiso activo antes de permitirlo
      this.data.forEach((fila) => {
        if (fila.user === usuario) {
          fila.permisos1.forEach((permiso1) => {
            if (permiso1.activo) {
              permitirActivar = true;
            }
          });

          fila.permisos2.forEach((permiso2) => {
            if (permiso2.activo) {
              permitirActivar = true;
            }
          });
        }
      });

      if (permitirActivar) {

        //Actualizamos el estado del check para todas las filas de ese usuario
        this.data.forEach((fila) => {
          if (fila.user === usuario) {
            fila.gmao = checked;
          }
        });

        this.lista_gmao.push({
          usuario: usuario,
          gmao: checked
        });

      } else {
        setTimeout(() => {
          //Actualizamos el estado del check para todas las filas de ese usuario
          this.data.forEach((fila) => {
            if (fila.user === usuario) {
              fila.gmao = false;
            }
          });
          this.changeDetector.detectChanges();
        }, 10);


      }

      //Si está desactivando el check
    } else {
      //Actualizamos el estado del check para todas las filas de ese usuario
      this.data.forEach((fila) => {
        if (fila.user === usuario) {
          fila.gmao = checked;
        }
      });

      this.lista_gmao.push({
        usuario: usuario,
        gmao: checked
      });
    }

  }

  public async ModificarPermiso():Promise<void>
  {
    try
    {
      this.showSpinner = true;
      
      const response = await this._apiService.postWithAuthentication({
        funcion: "web_modificar_permisos_usuario_lista",
        id_proyecto: this.project.id_proyecto,
        lista_permisos: this.lista_permisos,
        lista_gmao: this.lista_gmao,
        lista_telemedida: this.lista_telemedida
      });

      Swal.fire({
        icon: "success",
        title: "Agregado",
        text: response.datos.msg,
        confirmButtonText: "OK",
      });

      const permissionsData = (await this._permissionManagementService.getDataForPermissionsManagement(
        this.project.id_proyecto
      ));

      this.buildTable(permissionsData);
       
    } 
    catch (error)
    {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message,
        confirmButtonText: "OK",
      });
    }
    finally
    {
      this.showSpinner = false;
      this.lista_permisos = [];
      this.lista_gmao = [];
      this.lista_telemedida = [];
    }
  }

  /* TOUR */

  public showTour(): void {
    if (this.tourIsActive)
      return;

    this.buildTour();

    this._shepherdService.start();
  }

  private buildTour(): void {
    const that = this;

    const steps = this.buildTourSteps();

    const buttons = [
      {
        classes: 'btn-secondary',
        text: 'Atras',
        action() {
          that._shepherdService.back();
        }
      },
      {
        classes: 'btn-info',
        text: 'Siguiente',
        action() {
          that._shepherdService.next();
        }
      }
    ];

    const _steps = [];

    for (let i = 0, stepsLength = steps.length; i < stepsLength; i++) {
      let _buttons = [...buttons];

      const step = steps[i];

      if (i === 0)
        _buttons = _buttons.slice(1);

      if (i === (stepsLength - 1)) {
        const lastBtnIndex = _buttons.length - 1;
        _buttons[lastBtnIndex] = { ..._buttons[lastBtnIndex] }; // El ultimo boton (mas a la derecha) siempre sera el de avanzar / finalizar.
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
        when: step.event
      };

      _steps.push(_step);
    }

    this._shepherdService.addSteps(_steps);
  }

  private buildTourSteps(): any[] {
    const steps = [
      {
        element: `users-with-access-label`,
        labelPosition: "bottom",
        content: 'Aquí podrá visualizar el número de usuarios con acceso al proyecto.'
      },
      {
        element: `permissions-table`,
        labelPosition: "top",
        content: `
       Se listarán aquí todos los usuarios registrados desde <b>administración de usuarios</b>.
       `
      },
      {
        element: `edit-permissions-btn`,
        labelPosition: "left",
        content: `
       Para editar los permisos del proyecto en los usuarios, hacer click en <img class="small-icon d-inline" src="assets/icons/EDITAR.svg">.
       `
      },
      {
        element: `permissions-table-body`,
        labelPosition: "top",
        content: `
        Al hacer click en <img class="small-icon d-inline" src="assets/icons/EDITAR.svg">,
        las casillas en cada fila serán habilitadas.
       <br><br>
       Marcar o desmarcar las casillas correspondientes para asignar los permisos deseados.
       `
      },
      {
        element: `permissions-table-body`,
        labelPosition: "top",
        content: `
       Un usuario tiene acceso a un proyecto <b>por medio de un rol (técnico, personal de mantenimiento, visor, etc.)</b>.
       <br><br>
       Para remover el acceso a un usuario, destildar la casilla del rol que tenga asignado. 
       `
      },
      {
        element: `permissions-table-body`,
        labelPosition: "top",
        content: `
       Para habilitar / deshabilitar el acceso de una <b>sección (GMAO, Gestión energética, etc.)</b> a un usuario, este debe tener un rol asignado. 
       `
      },
      {
        element: `update-permissions-btn`,
        labelPosition: "left",
        content: `
       Para guardar los cambios realizados, hacer click en <img class="small-icon d-inline" src="assets/icons/GUARDAR.svg">. 
       `
      },
      {
        element: `undo-edit-permissions-btn`,
        labelPosition: "left",
        content: `
       Para deshacer cambios realizados, hacer click en <img class="small-icon d-inline" src="assets/icons/CERRAVENTANA.svg">. 
       `
      },
      {
        element: `users-finder`,
        labelPosition: "left",
        content: `
       Puede utilizar el buscador para filtrar los usuarios en la tabla. 
       `
      }
    ];

    return steps;
  }

  public ngOnDestroy(): void {
    this._shepherdService.tourObject = null;
    this.routeDataSubscription.unsubscribe();
  }

}
