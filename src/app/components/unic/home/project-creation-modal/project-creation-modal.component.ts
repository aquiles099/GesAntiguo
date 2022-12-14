import { Component, ViewChild, ChangeDetectorRef, ElementRef, OnDestroy } from '@angular/core';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { ProjectsService } from '../../../../services/unic/projects.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { SpinnerService } from '../../../../services/spinner.service';
import { ToastrService } from 'ngx-toastr';
import { checkIfTheFileExtensionIsCorrect, getFileContent, toggleFullscreen, getFileExtension } from '../../../../shared/helpers';
import swal from 'sweetalert2';
import { ProjectService } from '../../../../services/unic/project.service';
import { Router } from '@angular/router';
import { GeojsonFilesService } from '../../../../services/unic/geojson-files.service';
import { GeojsonLayerImagesService } from '../../../../services/unic/geojson-layer-images.service';
import { GeojsonFilesAnalysisChartsConfigurationsService } from '../../../../services/unic/geojson-files-analysis-charts-configurations.service';
import { delayExecution } from 'src/app/shared/helpers';
import { ShepherdService } from 'angular-shepherd';

@Component({
  selector: 'project-creation-modal',
  templateUrl: './project-creation-modal.component.html',
  styleUrls: ['./project-creation-modal.component.css']
})
export class ProjectCreationModalComponent implements OnDestroy
{
  @ViewChild(ModalDirective)
  public modal: ModalDirective;

  public form:FormGroup;

  @ViewChild('newProjectForm')
  public formRef:ElementRef<HTMLFormElement>;

  public sendingForm:boolean = false;
  public submitButtonText:string = "Guardar y continuar";

  public projectIconSrc:string = "assets/iconos-nuevo-proyecto-web/CAMARA.png";
  public projectIconExtension:string = "";

  public modules:Array<any> = [];
  public provinces:Array<any> = [];

  public municipalities:Array<any> = [];
  public loadingMunicipalities:boolean = false;

  constructor(
    private _projectsService:ProjectsService,
    private _projectService:ProjectService,
    private _geojsonFilesService:GeojsonFilesService,
    private _geojsonLayerImagesService:GeojsonLayerImagesService,
    private _geojsonFilesAnalysisChartsConfigurationsService:GeojsonFilesAnalysisChartsConfigurationsService,
    private _spinner:SpinnerService,
    private _toast:ToastrService,
    private _router:Router,
    private _shepherdService:ShepherdService,
    private changeDetector: ChangeDetectorRef
  )
  {
    this.form = new FormGroup({
      name: new FormControl(null, Validators.required),
      icon: new FormControl(null, Validators.required),
      province: new FormControl(null, Validators.required),
      municipality: new FormControl(null, Validators.required)
    });
  }

  public async open():Promise<void>
  {
    try {
      this._spinner.show();

      const data = await this._projectsService.getNewProjectInfo();
  
      if( data.error )
        throw new Error(data.msg_error);

      this.provinces = [...Object.values(data.datos.provincias)];
      this.modules = [...Object.values(data.datos.modulos)];
  
      this.modules.forEach(module => module.groups = Object.values(module.grupos) );

      this.modal.show();
      
    } catch (error) {
      console.error(error);
      this._toast.error(error.message, "Error");
    }
    finally
    {
      this._spinner.hide();
    }
  }

  public showTour():void
  {
    if( ! this._shepherdService.tourObject )
      this.buildTour();

    this._shepherdService.start();
  }

  private buildTour():void
  {
    const that = this;    
  
    const steps = this.buildTourSteps();

    const buttons = this.buildTourButtons(steps);
    
    const _steps = [];

    for( let i = 0, stepsLength = steps.length; i < stepsLength; i++ )
    {
      let _buttons = [...buttons]; 

      if( i === 0 )
      {
        _buttons = _buttons.slice(1);
      }
      
      if( i === (stepsLength - 1)  )
      {
        _buttons[1] = {..._buttons[1]};
        _buttons[1].text = 'Finalizar';
        _buttons[1].action = () => that._shepherdService.complete();
      }

      const step = steps[i];
      
      const _step = {
        id: step.element, 
        attachTo: { 
          element: `${step.element === "submit-btn" ? "." : "#"}${step.element}`, 
          on: step.labelPosition
        },
        buttons: _buttons,
        title: step.stepNumber ? `PASO ${step.stepNumber}` : "TIP",
        text: step.text,
        when: step.event ?? null
      };

      _steps.push(_step);
    }

    this._shepherdService.addSteps(_steps);
  }

  private buildTourSteps():any[]
  {
    /* PARA PASO DE INFORMACION DE MODULO SE TOMARA DE EJEMPLO EL 2DO DEL LISTADO */
    const secondModuleContainer = document.querySelector(".module-2-groups");

    const steps = [
      {
        element: "project-title-input",
        labelPosition: "bottom",
        stepNumber: 1,
        text: 'Agregue un titulo.',
        actionInStepIsInvalid: () => this.form.get("name").invalid, 
        errorText: "Por favor, agregue un titulo."
      },
      {
        element: "project-icon-upload",
        labelPosition: "right",
        stepNumber: 2,
        text: 'Cargue un icono.',
        actionInStepIsInvalid: () => this.form.get("icon").invalid,
        errorText: "Por favor, cargue un icono.",
      },
      {
        element: "project-icon-preview",
        labelPosition: "right",
        text: 'Puede previsualizar el icono en pantalla completa haciendo click.'
      },
      {
        element: "project-province",
        labelPosition: "right",
        stepNumber: 3,
        text: 'Haga click y seleccione provincia para cargar municipios (escriba el nombre y presione <kbd>Enter ???</kbd>).',
        actionInStepIsInvalid: () => this.form.get("province").invalid, 
        errorText: "Por favor, seleccione provincia."
      },
      {
        element: "project-municipality",
        labelPosition: "right",
        stepNumber: 4,
        text: 'Haga click y seleccione municipio (escriba el nombre y presione <kbd>Enter ???</kbd>).',
        actionInStepIsInvalid: () => this.form.get("municipality").invalid, 
        errorText: "Por favor, seleccione un municipio.",
      },
      {
        element: "project-modules-container",
        labelPosition: "left",
        stepNumber: 5,
        text: 'Elija los modulos que usara tildando las casillas. Debe seleccionar al menos 1.',
        actionInStepIsInvalid: () => new FormData(this.formRef.nativeElement).getAll("groups[]").length === 0, 
        errorText: "Por favor, seleccione al menos un modulo.",
        event: {
          "before-show": () => secondModuleContainer.classList.remove("show")
        }
      },
      {
        element: "project-module-2",
        labelPosition: "left",
        stepNumber: 6,
        text: 'Si no necesita todos los grupos de un modulo puede seleccionarlos segun su criterio.',
        actionInStepIsInvalid: () => new FormData(this.formRef.nativeElement).getAll("groups[]").length === 0, 
        errorText: "Por favor, seleccione al menos un grupo.",
        event: {
          "before-show": () => secondModuleContainer.classList.add("show")
        }
      },
      {
        element: "submit-btn",
        labelPosition: "left",
        stepNumber: 7,
        text: 'Guarde el proyecto para continuar con la configuraci??n de capas. Asegurese de que todos los datos agregados sean correctos.'
      },
    ];

    return steps;
  }

  private buildTourButtons(steps:any[]):any[]
  {
    const that = this;    

    const buttons = [
      {
        classes: 'btn-secondary',
        text: 'Atras',
        action(){

          let currentStep = that._shepherdService.tourObject.getCurrentStep();

          const stepData = steps.find(element => element.element === currentStep.id);

          currentStep.updateStepOptions({
            text: stepData.text
          });
        
          that._shepherdService.back();
        }
      },
      {
        classes: 'btn-info',
        text: 'Siguiente',
        action(){
          let currentStep = that._shepherdService.tourObject.getCurrentStep();

          const stepData = steps.find(element => element.element === currentStep.id);

          if( stepData.actionInStepIsInvalid && stepData.actionInStepIsInvalid() )
          {
            currentStep.updateStepOptions({
              text: stepData.errorText
            });
          }
          else
          {
            currentStep.updateStepOptions({
              text: stepData.text
            });

            that._shepherdService.next();
          }
        }
      }
    ];

    return buttons;
  }

  public detectChanges(delay:number = 0):void
  {
    setTimeout(() => this.changeDetector.detectChanges(), delay);
  }

  public async onSelectProjectIcon(event:any):Promise<void>
  {
    try {
      
      const file = event.target.files[0];
  
      if(file)
      {
        if( ! checkIfTheFileExtensionIsCorrect([file], ["jpg","jpeg","png"]) )
          throw new Error("El archivo debe ser una imagen con extensi??n jpg, jpeg o png");

          this.projectIconSrc = await getFileContent(file, "dataURL");
          this.projectIconExtension = await getFileExtension(file);
      }

    } catch (error) {
      console.error(error);
      this._toast.error(error.message, "Error");
    }
    finally
    {
      event.target.value = null;
    }

  }

  public toggleFullscreen(event:any):void
  {
    if( this.projectIconSrc  !== "assets/iconos-nuevo-proyecto-web/CAMARA.png")
      toggleFullscreen(event);
  }

  public moduleGroupsContainerIsCollapse(container:HTMLLIElement):boolean
  {
    return container.classList.contains('show');
  }

  public async onChangeProvinceSelect(province:any):Promise<void>
  {
    try {
      
      this.loadingMunicipalities = true;
            
      this.form.get("municipality").disable();

      const data = await this._projectsService.getMunicipalities(province.nombre);
  
      this.municipalities = [...Object.values(data.datos.municipios)];

    }
    catch (error)
    {
      this._toast.error(error.message, "Error");
    }
    finally
    {
      this.loadingMunicipalities = false;
      this.form.get("municipality").enable();
    }
  }

  public async onSubmit(form:HTMLFormElement):Promise<void>
  {
    try {

      this._spinner.updateText("Registrando proyecto...");
      this._spinner.show();

      this.sendingForm = true;

      this.submitButtonText = "Espere...";
      
      const formData = new FormData(form);

      formData.append("province", this.form.get("province").value);
      formData.append("municipality", this.form.get("municipality").value);
      formData.delete("icon");
      formData.append("icon", this.projectIconSrc.substr( this.projectIconSrc.indexOf(",") + 1 ) );
      formData.append("iconExtension", this.projectIconExtension);
          
      const project = await this._projectsService.create(formData); 

      if( this._shepherdService.isActive )
        this._shepherdService.complete();

      this._spinner.hide();

      await swal.fire({
        title: "Exito!",
        text: "Proyecto registrado.",
        icon: "success",
        timer: 2000
      });
 
      this._spinner.show();

      await delayExecution(250);
      
      this._projectService.next(project);

      await this._geojsonFilesService.openIDBConnection(); 
      await this._geojsonLayerImagesService.openIDBConnection();
      await this._geojsonFilesAnalysisChartsConfigurationsService.openIDBConnection();

      this._spinner.hide();

      this._router.navigateByUrl(`/unic/proyectos/${project.id_proyecto}/configuracion`);

    } catch (error) {
      console.error(error);
      this._toast.error(error.message, "Error");
    }
    finally
    {
      this.sendingForm = false;
      this.submitButtonText = "Guardar y continuar";
      this._spinner.hide();
      this._spinner.cleanText();
    }
  }

  public clear():void
  {
    this.form.reset();
    this.sendingForm = false;
    this.submitButtonText = "Guardar y continuar";
  
    this.projectIconSrc = "assets/iconos-nuevo-proyecto-web/CAMARA.png";
    this.projectIconExtension = "";
  
    this.modules = [];
    this.provinces = [];
  
    this.municipalities = [];
    this.loadingMunicipalities = false;
  }

  public ngOnDestroy():void
  {
    this._shepherdService.tourObject = null; 
  }
}
