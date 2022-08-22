import { Component, ViewChild, Output, EventEmitter } from '@angular/core';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { SpinnerService } from '../../../../../../../../services/spinner.service';
import { ProjectsService } from '../../../../../../../../services/unic/projects.service';
import { ToastrService } from 'ngx-toastr';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ObjectUtility } from '../../../../../../../../shared/object-utility';
import { showPreconfirmMessage, delayExecution } from 'src/app/shared/helpers';
import { ChartConfiguration, AnalysisConfiguration } from '../../../../../../../../interfaces/analysis/analysis-chart-configuration';
import { ProjectService } from '../../../../../../../../services/unic/project.service';
import { ShepherdService } from 'angular-shepherd';
import { toggleFullscreen } from '../../../../../../../../shared/helpers';

interface AnalysisConfigurationWithId extends AnalysisConfiguration
{
  id:number;
}

interface ChartOption
{
  value:string;
  name:string;
  imageUrl:string;
  available_info:string[];
}

@Component({
  selector: 'modal-de-configuracion',
  templateUrl: './modal-de-configuracion.component.html',
  styleUrls: ['./modal-de-configuracion.component.css']
})
export class ModalDeConfiguracionComponent
{
  @ViewChild(ModalDirective)
  private modal:ModalDirective;
  
  @ViewChild("saveConfigurationModal")
  private saveConfigurationModal:ModalDirective;
  
  @Output()
  private onHide:EventEmitter<any> = new EventEmitter;

  public configurationType:string = "new";

  public chartOptions:Array<ChartOption> = [];

  public availableInfoOptions:Array<string> = [];
  
  public analysisModeOptions:Array<string> = [
    "Proyecto",
    "Mapa visualizado"
  ];
  
  public chartImageSrc:string;
  
  public chartPositionRefSelected:number;
  public selectedAnalysisConfigurationName:string = "";
  
  public form:FormGroup;
  
  public saveConfigurationModalIsOpen:boolean = false;

  public sendingRequest:boolean = false;

  private thereWasChangesInTheConfiguration:boolean = false;
  
  public analysisConfiguration:AnalysisConfigurationWithId = {
    id: null,
    name: "",
    configurations: []
  };

  public analysisConfigurations:AnalysisConfigurationWithId[] = [];

  constructor(
    private _spinnerService:SpinnerService,
    private _projectsService:ProjectsService,
    private _projectService:ProjectService,
    private _toastrService:ToastrService,
    private _shepherdService:ShepherdService
  )
  {
    this.form = new FormGroup({
      chartType: new FormControl(null, Validators.required),
      info: new FormControl(null, Validators.required),
      analysisMode: new FormControl(null, Validators.required)
    });
  }

  get tourIsActive():boolean
  {
    return this._shepherdService.isActive;
  }

  public async show():Promise<void>
  {
    try {

      this._spinnerService.show();
      
      const chartOptions = (await this._projectsService.getAnalisysChartsOptions()).datos.graficas;
      
      this.chartOptions = chartOptions.map( (option:any) => {

          return {
            value: option.grafica,
            name: option.nombre_mostrar,
            imageUrl: option.imagen,
            available_info: option.tipos_informacion
          };

      });     

      try
      {
        
        this.analysisConfigurations = [...(await this._projectsService.getAnalisysConfigurationsList( this._projectService.project.id_proyecto )).datos];
        
        this.setIdInAnalysisConfigurations();

      } catch (error) 
      {
        this.analysisConfigurations = [];
      }

      this.modal.show();

    } catch (error) {

      console.error(error);
      this._toastrService.error(error.message,"Error");
      
      await this.hide();
    }
    finally{
      this._spinnerService.hide();
    }
  }

  private setIdInAnalysisConfigurations():void
  {
    this.analysisConfigurations.forEach((config, index) => config.id = index + 1);
  }

  public onSelectExistingConfiguration(config:AnalysisConfiguration):void
  {
    this.analysisConfiguration = ObjectUtility.simpleCloning(config);

    if( this.chartPositionRefSelected )
      this.onSelectChartPositionRef( this.chartPositionRefSelected );
  }

  public async onChangeConfigurationType(type:string):Promise<void>
  {
    ObjectUtility.overrideValues(this.analysisConfiguration);
    this.selectedAnalysisConfigurationName = null;
    this.configurationType = type;
    this.clearForm();
    this.form.disable();
  }

  public onChangeChartTypeSelect(chartOption:ChartOption):void
  {
    this.chartImageSrc = chartOption.imageUrl;  

    this.form.get("info").patchValue(null);
    
    this.availableInfoOptions = [...chartOption.available_info];
  }

  public onSelectChartPositionRef(position:number):void
  {
    if( this.tourIsActive )
      return;

    if( this.form.disabled )
      this.form.enable();

    if( this.chartPositionIsConfigured(position) )
    {
      const chartConfig = this.getChartConfig(position);

      const chartOptionSelected = this.chartOptions.find(chartOption => chartOption.value === chartConfig.chartType);

      this.onChangeChartTypeSelect(chartOptionSelected);

      this.form.patchValue({
        chartType: chartConfig.chartType, 
        info: chartConfig.info, 
        analysisMode: chartConfig.analysisMode
      });
    }
    else
    {
      this.clearForm();
    }

    this.chartPositionRefSelected = position;
  }

  public addChartConfiguration():void
  {
    try {
      
      if( this.form.invalid )
        throw new Error("Faltan datos para la configuración del gráfico.");
        
      const config = this.form.value;
      
      if( this.isThereAnyConfigurationWithTheSameData(config) )
        throw new Error("Ya existe un gráfico con la misma configuración.");
                
      config["position"] = this.chartPositionRefSelected;

      let message = `Configuración de gráfico ${this.chartPositionRefSelected} añadida.`;
      
      if( this.chartPositionIsConfigured(config.position) )
      {
        this.analysisConfiguration.configurations = this.analysisConfiguration.configurations.map(_config => {
            
          if(_config.position === config.position)
            _config = config;

          return _config;
        });

        message = `Configuración de gráfico ${this.chartPositionRefSelected} actualizada.`;
      }
      else
      {
        this.analysisConfiguration.configurations = [...this.analysisConfiguration.configurations, config];
      }

      this.clearForm();

      this.form.disable();

      this._toastrService.success(message,"Exito");

    } catch (error)
    {
      console.error(error);
      this._toastrService.error(error.message,"Error"); 
    }
  }

  public chartPositionIsConfigured(position:number):boolean
  {
    return this.analysisConfiguration.configurations.some(config => config.position === position);
  }

  public isThereAnyConfigurationWithTheSameData(newConfig:ChartConfiguration):boolean
  {
    return this.analysisConfiguration.configurations.some(_config => {

      const configCopy = ObjectUtility.simpleCloning(_config);

      delete configCopy.position;

      return ObjectUtility.areEquals(newConfig, configCopy);
    });
  }

  public isThereAnyChartPositionConfigured():boolean
  {
    return this.analysisConfiguration.configurations.length > 0;
  }

  private getChartConfig(position:number):ChartConfiguration
  {
    return this.analysisConfiguration.configurations.find(config => config.position === position);
  }

  public removeChartConfiguration():void
  {
    this.analysisConfiguration.configurations = this.analysisConfiguration.configurations.filter(config => config.position !== this.chartPositionRefSelected);

    this._toastrService.success(`Configuración de gráfico ${this.chartPositionRefSelected} removida.`);
    
    this.clearForm();

    this.form.disable();
  }

  public runAnalysis():void
  {
    this.hide( ObjectUtility.simpleCloning(this.analysisConfiguration) );
  }

  public async saveAnalysisConfiguration():Promise<void>
  {
    try {

      const isThereAnyConfigurationWithTheSameName = this.analysisConfigurations.some(config => config.name === this.analysisConfiguration.name);

      if( isThereAnyConfigurationWithTheSameName )
        throw new Error("Ya existe una configuración de análisis con el mismo nombre.");
        
      this.analysisConfigurations = [...this.analysisConfigurations, ObjectUtility.simpleCloning(this.analysisConfiguration)];

      ObjectUtility.overrideValues(this.analysisConfiguration);

      this.clearForm();

      this.saveConfigurationModal.hide();

      this._toastrService.success("Configuración guardada.","Exito!"); 

      this.setIdInAnalysisConfigurations();

      this.thereWasChangesInTheConfiguration = true;
    }
    catch (error)
    {
      console.error(error);
      this._toastrService.error(error.message,"Error"); 
      this.analysisConfigurations = this.analysisConfigurations.filter(config => config.name !== this.analysisConfiguration.name);
    }
  }

  public async updateAnalysisConfiguration():Promise<void>
  {    
    try
    {
      const isThereAnyConfigurationWithTheSameName = this.analysisConfigurations.filter(
        config => config.id !== this.analysisConfiguration.id
      ).some(
        config => config.name === this.analysisConfiguration.name
      );

      if( isThereAnyConfigurationWithTheSameName )
        throw new Error("Ya existe una configuración de análisis con el mismo nombre.");
     
      const configIndex = this.analysisConfigurations.findIndex(config => config.name === this.selectedAnalysisConfigurationName );
     
      this.analysisConfigurations.splice(configIndex, 1);
  
      this.analysisConfigurations = [...this.analysisConfigurations, ObjectUtility.simpleCloning(this.analysisConfiguration)];

      this._toastrService.success("Configuración de análisis actualizada.","Exito!");

      this.selectedAnalysisConfigurationName = this.analysisConfiguration.name;
      
      this.clearForm();
      
      this.saveConfigurationModal.hide();

      this.setIdInAnalysisConfigurations();

      this.thereWasChangesInTheConfiguration = true;
    }
    catch (error) 
    {
      console.error(error);
      this._toastrService.error(error.message, "Error");
    }
  }

  public async removeAnalysisConfiguration(event:any):Promise<void>
  {
    event.preventDefault();

    const userResponse = await showPreconfirmMessage(
      `¿Eliminar configuración de análisis?`,
      "Esta acción no es reversible.",
      "warning"
    );

    if( userResponse.isConfirmed )
    {     
      this.analysisConfigurations = this.analysisConfigurations.filter(config => config.name !== this.selectedAnalysisConfigurationName)
        
      this._toastrService.success("Configuración de análisis eliminada.","Exito!");

      this.clearForm();

      ObjectUtility.overrideValues(this.analysisConfiguration);

      this.selectedAnalysisConfigurationName = null;

      this.setIdInAnalysisConfigurations();

      this.thereWasChangesInTheConfiguration = true;
    }
  }

  public clearForm():void
  {          
    this.chartPositionRefSelected = null;

    this.chartImageSrc = null;

    this.form.reset();
  }

  public async hide(dismissReason?:any):Promise<void>
  {
    try
    {
      this._spinnerService.updateText("Espere...");
      this._spinnerService.show();

      if( this.thereWasChangesInTheConfiguration )
      {
        const configs = this.analysisConfigurations.map(config => {

          delete config.id;

          return config;
        });
        
        await this._projectsService.updateAnalisysConfigurationsList(
          this._projectService.project.id_proyecto,
          configs
        );
      }
    }
    catch (error)
    {
      console.error(error);
      this._toastrService.error(error.message,"Error");   
    }
    finally
    {
      this._spinnerService.hide();
      this._spinnerService.cleanText();

      ObjectUtility.overrideValues(this.analysisConfiguration);
      this.selectedAnalysisConfigurationName = "";
      this.configurationType = "new";
      this.sendingRequest = false;
      this.clearForm();
      this.modal.hide();
      await delayExecution(500);
      this.onHide.emit(dismissReason);

      // 
      this._shepherdService.tourObject = null;
    }
  }

  /* TOUR */

  public showTour():void
  {
    if( this.tourIsActive )
      return;

    this.buildTour();

    this._shepherdService.tourObject.on("complete", () => {
      
      if( this.chartPositionRefSelected ) 
        this.form.enable();
    });
      
    this._shepherdService.tourObject.on("cancel", () => {
      
      if( this.chartPositionRefSelected ) 
        this.form.enable();
      
        this.chartImageSrc = null;
    });

    if( this.form.enabled )
      this.form.disable();

    this._shepherdService.start();
  }

  private buildTour():void
  {
    const that = this;    
  
    const steps = this.buildTourSteps();

    const buttons = [
      {
        classes: 'btn-info',
        text: 'Expandir recurso',
        action(){
          const mediaResources = document.querySelectorAll(".step-media");
          toggleFullscreen(mediaResources[mediaResources.length - 1]);
        }
      },
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
      {
        _buttons = _buttons.slice(2);
      }
      else
      {
        if( ! step.hasMedia  )
          _buttons = _buttons.slice(1);  
      }
      
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
          element: `#${step.element}`, 
          on: step.labelPosition
        },
        buttons: _buttons,
        title: `PASO ${i + 1}`,
        text: step.content,
        when: step.event ?? null,
        beforeShowPromise: step.beforeShowPromise ?? null
      };

      _steps.push(_step);
    }

    this._shepherdService.addSteps(_steps);
  }

  private buildTourSteps():any[]
  {
    const steps = [
      {
        element: `analysis-charts-new-configuration-checkbox`,
        labelPosition: "top",
        content: `
        Para crear una <b>nueva configuración</b> seleccionar <b>"Nueva"</b>.
        `
      },
      {
        element: `analysis-charts-configurations-listing-checkbox`,
        labelPosition: "top",
        content: `
        Para ver las <b>configuraciónes existentes</b> seleccionar <b>"Mis configuraciones"</b>".
        `,
        event: {
          "before-show": () => this.configurationType = "existing"
        }
      },
      {
        element: `analysis-charts-configurations-listing`,
        labelPosition: "top",
        content: `
        Al seleccionar <b>"Mis configuraciones"</b> podrá ver el listado.
        `,
        event: {
          "before-show": () => this.configurationType = "existing"
        }
      },
      {
        element: `analysis-charts-charts-configuration-container`,
        labelPosition: "right-start",
        hasMedia: true,
        content: `
        Para <b>editar o empezar una configuración</b>, seleccionar una de las 6 posiciones de gráfico haciendo click sobre estas.
        <br><br> 
        <div style="display: none">Error al cargar video.</div>
        <video onerror="this.classList.add('hide'); this.previousElementSibling.style.display = 'block';" 
              class="step-media" loop autoplay muted>
          <source src="assets/images/medium/tours/herramientas/graficos-de-analisis/4-seleccionar-atributos.mp4" type="video/mp4">
          Tu navegador no soporta videos.
        </video> 
        `,
        event: {
          "before-show": () => this.configurationType = "new"
        }
      },
      {
        element: `analysis-charts-chart-type-selector`,
        labelPosition: "right",
        content: `
          Seleccionar el <b>tipo de gráfico</b>.
        `
      },
      {
        element: `analysis-charts-chart-image-container`,
        labelPosition: "bottom",
        content: `
          Podrá ver la imagen referencial del <b>tipo de gráfico seleccionado</b> aquí.
        `,
        event: {
          "before-show": () => this.chartImageSrc = this.chartOptions[0].imageUrl,
          "before-hide": () => this.chartImageSrc = null
        }
      },
      {
        element: `analysis-charts-chart-info-selector`,
        labelPosition: "right",
        content: `
          Seleccionar el <b>tipo de información</b> que se mostrará en los gráficos.
          <br>
          Los <b>tipos de información</b> pueden variar
          dependiendo del <b>tipo de gráfico</b> seleccionado. 
        `
      },
      {
        element: `analysis-charts-chart-analysis-mode-selector`,
        labelPosition: "right",
        hasMedia: true,
        content: `
          Seleccionar el <b>tipo de análisis</b> para los gráficos. 
          <br><br>
          <ol>
            <li class="mb-2">
              <b>Proyecto</b>: datos para el análisis serán tomados del municipio del proyecto.  
            </li>
            <li>
              <b>Mapa visualizado</b>: datos para el análisis serán tomados del rectángulo de mapa 
              visible <b>(ver recurso)</b>. En este modo de análisis los gráficos serán <b>actualizados</b>
              cada vez que el mapa cambie de posición <b>(mover con el cursor, aumentar y disminuir zoom)</b>.  
              <br><br> 
              <video onerror="this.classList.add('hide'); this.previousElementSibling.style.display = 'block';" 
                    class="step-media" loop autoplay muted>
                <source src="assets/images/medium/tours/herramientas/graficos-de-analisis/7-mapa-visible.mp4" type="video/mp4">
                Tu navegador no soporta videos.
              </video> 
            </li>
          </ol> 
        `
      },
      {
        element: `analysis-charts-save-chart-config-btn`,
        labelPosition: "right",
        content: `
          Una vez que se haya <b>configurado</b> una posición de gráfico hacer click en <span class="badge bg-info"> <img src="assets/icons/SVG/GUARDAR_white.svg" class="small-icon" alt="guardar"> </span>
          para guardarla. 
          <br><br>
          Las posiciones de gráficos configuradas se mostrarán en color azul.
        `
      },
      {
        element: `analysis-charts-charts-configuration-container`,
        labelPosition: "right",
        content: `
          Para editar una posición de gráfico configurada seleccionarla nuevamente, modificar valores y hacer click en 
          <span class="badge bg-info"> <img src="assets/icons/SVG/GUARDAR_white.svg" class="small-icon" alt="guardar"> </span>. 
        `
      },
      {
        element: `analysis-charts-remove-chart-config-btn`,
        labelPosition: "right",
        content: `
          Para <b>eliminar</b> una configuración de una posición de gráfico, seleccionarla y hacer click en 
          <span class="badge bg-danger"> <img src="assets/icons/SVG/PAPELERA_BLANCO.svg" class="small-icon" alt="papelera"> </span>.
        `
      },
      {
        element: `analysis-charts-save-analysis-config-btn`,
        labelPosition: "top",
        content: `
          Para ${this.configurationType === "new" ? "guardar" : "actualizar"} una configuración de análisis <b>(posiciones de gráficos configuradas)</b>, hacer click en 
          <span class="badge-outline-info"> ${this.configurationType === "new" ? "Guardar configuración" : "Guardar cambios"} </span>.
        `
      },
      {
        element: `analysis-charts-save-analysis-config-btn`,
        hasMedia: true,
        labelPosition: "top",
        content: `
          Se mostrará una ventana donde se debe ${this.configurationType === "new" ? "asignar" : "actualizar (opcional)"} 
          el nombre de la configuración.
          <br>
          Hacer click en <span class="badge bg-info text-white"> ${this.configurationType === "new" ? "Guardar" : "Actualizar"} </span>
          para terminar.
          <br><br> 
          <video onerror="this.classList.add('hide'); this.previousElementSibling.style.display = 'block';" 
                class="step-media" loop autoplay muted>
            <source src="assets/images/medium/tours/herramientas/graficos-de-analisis/13-guardar-configuracion-analisis.mp4" type="video/mp4">
            Tu navegador no soporta videos.
          </video> 
          <p class="m-0 ${this.configurationType === "new" ? "" : "d-none"}">
            <br><br>
            Una vez que una configuración haya sido guardada podrá elegirla desde el listado en "<b>Mis configuraciones</b>".
          </p>
        `
      },
      {
        element: `analysis-charts-show-analysis-btn`,
        labelPosition: "top",
        content: `
          Para activar un análisis sobre el mapa hacer click en 
          <span class="badge bg-info text-white"> Añadir al mapa</span>.
          <br><br>
          Debe estar configurada <b>al menos 1 posición de gráfico</b> para que se habilite el botón.
        `
      },
      {
        element: `analysis-charts-close-modal-btn`,
        labelPosition: "bottom",
        content: `
          Salga de la herramienta pulsando la <b>X</b>.
        `
      },
    ];
 
    return steps;
  }

}
