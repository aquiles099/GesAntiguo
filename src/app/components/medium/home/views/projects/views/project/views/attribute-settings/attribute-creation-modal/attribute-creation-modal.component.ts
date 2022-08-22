
import { Component, Input, ViewChild, OnInit, Output, EventEmitter } from '@angular/core';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { ToastrService } from 'ngx-toastr';
import { SpinnerService } from '../../../../../../../../../../services/spinner.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Project } from '../../../../../../../../../../interfaces/project';
import { Modulo, Capa, Grupo } from '../../../../../../../../../../interfaces/medium/mapa/Modulo';
import { ApiService } from '../../../../../../../../../../services/api.service';

@Component({
  selector: 'attribute-creation-modal',
  templateUrl: './attribute-creation-modal.component.html',
  styleUrls: ['./attribute-creation-modal.component.css']
})
export class AttributeCreationModalComponent implements OnInit
{
  @Input() 
  public proyecto:Project;
  
  @Input() 
  public modulos:Modulo[] = [];
  
  public grupos:Grupo[] = [];
  
  public capas:Capa[] = [];
  
  @Input() 
  public tiposDeAcceso: any[] = [];

  public tiposDeAtributo: any[] = [];
  public listaDeHerramientas: any[] = []

  @ViewChild(ModalDirective)
  public modal:ModalDirective;
  
  @Output()
  public alCrearAtributo:EventEmitter<void> = new EventEmitter;

  public form:FormGroup;

  constructor(
    private _apiService:ApiService,
    private _spinnerService:SpinnerService,
    private _toastrService:ToastrService
  )
  {
    this.form = new FormGroup({
      "nombre": new FormControl(null, Validators.required),
      "modulo": new FormControl(null, Validators.required),
      "grupo": new FormControl(null, Validators.required),
      "capa": new FormControl(null, Validators.required),
      "tipo_dato": new FormControl(null, Validators.required),
      "tipo_acceso": new FormControl(null, Validators.required)
    });
  }

  public async ngOnInit():Promise<void>
  {
    try
    {
      const response = await this._apiService.postWithAuthentication({
        funcion: 'web_informacion_crear_atributo_proyecto',
        proyecto: this.proyecto.nombre,
        id_proyecto: this.proyecto.id_proyecto,
      });

      this.tiposDeAtributo = response.datos.tipo_atributo;
      this.listaDeHerramientas = response.datos.tipo_herramienta;
    }
    catch(error)
    {
      this._toastrService.error(error.message,"Error");
    }
  }

  public show():void
  {
    this.modal.show();
    this.comprobarSiHayUnSoloModuloAsociadoParaSeleccionarlo();
  }

  private comprobarSiHayUnSoloModuloAsociadoParaSeleccionarlo():void
  {
     if(this.modulos.length === 1)
     {
       this.form.patchValue({modulo: this.modulos[0].nombre});
       this.alCambiarSelectorDeModulos(this.modulos[0]);
     }
  }

  public alCambiarSelectorDeModulos(modulo:Modulo): void
  {
    this.grupos = modulo.grupos;

    if(this.grupos.length === 1)
    {
      this.form.patchValue({grupo: this.grupos[0].nombre});
      this.alCambiarSelectorDeGrupos(this.grupos[0]);
    }
  }

  public alCambiarSelectorDeGrupos(grupo:Grupo): void
  {
    this.form.patchValue({capa: null});
    this.capas = [...grupo.capas];
  }

  public alternarEstadoHabilitadoDeHerramienta(herramienta:any):void
  {
    herramienta.estado = ! herramienta.estado; 
  }

  public async crearAtributo():Promise<void>
  {
    try
    {
      this._spinnerService.show();

      const herramientas = {};
      
      this.listaDeHerramientas.forEach(
        elemento => herramientas[elemento.nombre_formateado] = elemento.estado
      );

      const data = {
        funcion: 'web_crear_atributo_proyecto',
        proyecto: this.proyecto.nombre,
        id_proyecto: this.proyecto.id_proyecto,
        valor_defecto: ''
      };
      
      Object.assign(data, this.form.value, herramientas);

      await this._apiService.postWithAuthentication(data);
      
      this._toastrService.success("Atributo creado.","Exito!");

      this.alCrearAtributo.emit();

      this.clear();
    }
    catch (error)
    {
      this._toastrService.error(error.message,"Error");
    }
    finally
    {
      this._spinnerService.hide();
    }
  }

  public clear():void
  {
    this.form.reset();
    this.listaDeHerramientas.forEach(herramienta => herramienta.estado = false);
    this.comprobarSiHayUnSoloModuloAsociadoParaSeleccionarlo();
  }
}
