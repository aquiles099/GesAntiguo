import { Component, Input} from '@angular/core';
import { Map, LatLngExpression, latLngBounds, TileLayer } from 'leaflet';
import { jsPDF } from "jspdf";
import proj4 from 'proj4';
import '../../../../../../../../../assets/fonts/Raleway-Regular-normal.js';
import '../../../../../../../../../assets/fonts/Raleway-Bold-normal.js';
import { MapService } from '../../../../../../../../services/unic/map.service';
import { ProjectService } from '../../../../../../../../services/unic/project.service';
import { Project } from '../../../../../../../../interfaces/project';
import { ProjectsService } from '../../../../../../../../services/unic/projects.service';
import { SpinnerService } from '../../../../../../../../services/spinner.service';
import { ToastrService } from 'ngx-toastr';
import { delayExecution } from 'src/app/shared/helpers';

@Component({
  selector: 'generador-fichas-centros-de-mando',
  templateUrl: './generador-fichas-centros-de-mando.component.html',
  styleUrls: ['./generador-fichas-centros-de-mando.component.css']
})
export class GeneradorFichasCentrosDeMandoComponent
{
    @Input()
    public map:Map;
    
    @Input()
    public centros_mando_seleccionados: string[] = [];
    
    @Input()
    public capaCentrosDeMando:TileLayer;

    @Input()
    public capaResaltadoCentrosDeMando:TileLayer;
    
    array_circuitos: string[] = [];

    cmEnIndice: any[][] = [];
    posicionIndiceActual = 0;
    indiceResaltarLinea = false;
    paginaConFotosActual = 0;

    //DATOS CENTRO DE MANDO
    numeroCuadro: string = "";
    municipioCM: string = "-";
    provinciaCM: string = "-";
    localizacionCM: string = "-";
    estadoCM: string = "-";
    numeroSuministro: string = "-";
    numeroContador: string = "-";
    tension: string = "-";
    fechaInstalacionCM: string = "-";
    horasDia: string = "-";
    horasAhorro: string = "-";
    horaInicio: string = "-";
    horaFin: string = "-";
    observaciones: string = "-";
    direccion: string = "-";
    coordenadas: string = "-";
    numeroCups: string = "-";
    seccionAcometida: string = "-";
    situacionCajaProteccion: string = "";
    proteccionIp: string = "";
    proteccionIk: string = "";
    altoCuadroProteccion: string = "";
    anchoCuadroProteccion: string = "";
    fondoCuadroProteccion: string = "";
    materialCajaProteccion: string = "";
    existenciaPuestaTierra: string = "";
    tipoPuestaTierra: string = "";
    resistenciaPuestaTierra: string = "";
    seccionPuestaTierra: string = "";
    arrayFotos: string[] = [];

    tipoRegulacion: string = "-";
    marcaRegulacion: string = "-";
    tipoTelegestion: string = "-";
    marcaTelegestion: string = "-";
    tipoReloj: string = "-";
    marcaReloj: string = "-";
    tipoInterruptorManual: string = "-";
    marcaInterruptorManual: string = "-";
    tipoCelula: string = "-";
    marcaCelula: string = "-";

    tensionFaseR: string = "-";
    intensidadFaseR: string = "-";
    potenciaActivaFaseR: string = "-";
    potenciaReactivaFaseR: string = "-";
    potenciaAparenteFaseR: string = "-";
    factorPotenciaFaseR: string = "-";

    tensionFaseS: string = "-";
    intensidadFaseS: string = "-";
    potenciaActivaFaseS: string = "-";
    potenciaReactivaFaseS: string = "-";
    potenciaAparenteFaseS: string = "-";
    factorPotenciaFaseS: string = "-";

    tensionFaseT: string = "-";
    intensidadFaseT: string = "-";
    potenciaActivaFaseT: string = "-";
    potenciaReactivaFaseT: string = "-";
    potenciaAparenteFaseT: string = "-";
    factorPotenciaFaseT: string = "-";

    potenciaActivaTotal: string = "-";
    potenciaReactivaTotal: string = "-";
    potenciaAparenteTotal: string = "-";
    intensidadNeutra: string = "-";
    observacionesMediciones: string = "-";

    constructor(
    private _mapService:MapService,
    private _projectService:ProjectService,
    private _projectsService:ProjectsService,
    private _spinnerService:SpinnerService,
    private _toastrService:ToastrService
    ) { }

    get proyecto():Project
    {
        return this._projectService.project;
    }

    get urlBase():string
    {
        return this.proyecto.url_base.split('wms?')[0] + "wms?";
    }
    
    get proyeccionProyecto():string
    {
        return this._projectService.configuration.datos_municipio.nombre_proj4;
    }

    //Método que empezará la creación del pdf
    public async empezarCreacion():Promise<void>
    {   
      try {

        this._spinnerService.show();
        
        let pdf = new jsPDF('portrait', 'mm', 'a4', true);
  
        this.añadirIndice(pdf);
  
        //Llamamos a la función para crear la ficha del primer centro de mando seleccionado
        await this.fichaCentroMando(this.centros_mando_seleccionados[0], pdf);
      }
      catch (error)
      {
        console.error(error);
        this._toastrService.error(error.message,"Error");
        this._spinnerService.hide();
        this._spinnerService.cleanText();
      }
    }

    //Método que recibe la descripción de un centro de mando, y hace una ficha del mismo
    public async fichaCentroMando(cm: string, pdf: jsPDF):Promise<void>
    {
        let intentos = 0;

        try
        {
          this.actualizarProgresoPdf(cm);
  
          const res = await this._projectsService.consultarApi({
              funcion: "web_fichas_cm_datos",
              proyecto: this.proyecto.bd_proyecto,
              modulo: "gissmart_energy",
              grupo: "gestlighting",
              centro_mando: cm
          });
   
          this.rellenarDatosCM(res, cm);

          const coor = res.datos.bbox.reverse();
          let ne: LatLngExpression = [coor[0], coor[1]];
          let sw: LatLngExpression = [coor[2], coor[3]];
          let bounds = latLngBounds(sw, ne);

          this.map.fitBounds(bounds);

          await delayExecution(5000);

          await this.construirPdf(res, cm, pdf);

          intentos = 0;
        }
        catch (error)
        {
          let siguientecm = this.centros_mando_seleccionados.indexOf(cm);
          siguientecm++;
          await this.fichaCentroMando(this.centros_mando_seleccionados[siguientecm], pdf);

          if( intentos === 3 )
            throw error;

          intentos++;
        }
    }

    private actualizarProgresoPdf(cm: string):void
    {
      let totalAAlcanzar = this.centros_mando_seleccionados.length;
      let actual = this.centros_mando_seleccionados.indexOf(cm);
      actual = actual + 1;
      this._spinnerService.updateText(`Generando ficha/s... <br><br> Actual: ${cm} (${actual} de ${totalAAlcanzar})`);
    }

    private async construirPdf(res: any, cm: string, pdf: jsPDF):Promise<void>
    {
        try
        {
            //Guardamos los circuitos del centro de mando en un array
            this.array_circuitos = [];

            //Dentro de la respuesta del backend, recorremos el diccionario de circuitos
            if (res.datos.circuitos) {
                Object.entries(res.datos.circuitos).forEach(([key, value]) => {
                    //Para cada circuito, recorremos su contenido
                    Object.entries(value).forEach(([k, v]) => {

                        //Si el campo es nombre del circuito, lo añadimos al array de circuitos
                        if (k === "nombre") {
                            this.array_circuitos.push(v);
                        }
                    });
                });
            }

            this.map.removeLayer(this.capaCentrosDeMando);
            this.map.removeLayer(this.capaResaltadoCentrosDeMando);    

            const imagenDeMapa = await this._mapService.getMapScreenshot();

            this.map.addLayer(this.capaCentrosDeMando);
            this.map.addLayer(this.capaResaltadoCentrosDeMando);    

            //Transformamos las coordenadas recibidas a las del proyecto
            let result1 = proj4(this.proyeccionProyecto, [this.map.getBounds().getWest(), this.map.getBounds().getSouth()]);
            let result2 = proj4(this.proyeccionProyecto, [this.map.getBounds().getEast(), this.map.getBounds().getNorth()]);

            //Imagen con el centro de mando
            let imagenSuperpuestaCM = new Image();

            //Hacemos la petición a geoserver para traer una imagen con el centro de mando
            imagenSuperpuestaCM.src = this.urlBase + "SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&FORMAT=image%2Fpng&TRANSPARENT=true" +
                "&LAYERS=" + this.proyecto.bd_proyecto + "%3Agissmart_energy_gestlighting_centro_mando&exceptions=application%2Fvnd.ogc.se_inimage&" +
                "CQL_FILTER=descripcion%3D%27" + cm + "%27" +
                "&SRS=EPSG%3A" + this.proyecto.proyeccion + "&" +
                "STYLES=EstiloCentrosDeMando&" +
                "WIDTH=" + this.map.getSize().x + "&HEIGHT=" + this.map.getSize().y + "&" +
                "BBOX=" + result1[0] + "%2C" + result1[1] + "%2C" + result2[0] + "%2C" + result2[1];

            //Esperamos a que la imagen esté cargada.
            await new Promise(resolve => imagenSuperpuestaCM.onload = () => resolve(true));

            //Imagen con la luminaria
            let imagenSuperpuestaLuminaria = new Image();

            //Estilo para que todos los puntos de luminaria sean amarillos
            let estilo = "Basico_31";

            //Hacemos la petición a geoserver para traer una imagen con la luminaria
            imagenSuperpuestaLuminaria.src = this.urlBase + "SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&FORMAT=image%2Fpng&TRANSPARENT=true" +
                "&LAYERS=" + this.proyecto.bd_proyecto + "%3Agissmart_energy_gestlighting_luminaria&exceptions=application%2Fvnd.ogc.se_inimage&" +
                "CQL_FILTER=centro_mando%3D%27" + cm + "%27" +
                "&SRS=EPSG%3A" + this.proyecto.proyeccion + "&" +
                "STYLES=" + estilo + "&" +
                "WIDTH=" + this.map.getSize().x + "&HEIGHT=" + this.map.getSize().y + "&" +
                "BBOX=" + result1[0] + "%2C" + result1[1] + "%2C" + result2[0] + "%2C" + result2[1];

            //Esperamos a que la imagen esté cargada
            await new Promise(resolve => imagenSuperpuestaLuminaria.onload = () => resolve(true));
        
            pdf.addPage();
            this.añadirCabeceraAPdf(pdf);
            this.añadirFooter(pdf);

            //Añadimos esta parte al índice
            this.añadirAlIndice(cm, pdf, pdf.getCurrentPageInfo().pageNumber);

            //Datos generales
            this.añadirDatosGeneralesCM(pdf);

            //Fotos
            this.añadirFotos(pdf);

            //Caja general de protección
            this.añadirCajaGeneralProteccion(pdf);

            //Cuadro de protección
            this.añadirCuadroProteccion(pdf);

            pdf.addPage();
            //Datos de la acometida
            this.añadirModuloMedida(pdf, 35); //Le pasamos la posición donde empezará

            //Puesta a tierra
            this.añadirPuestaTierraCuadro(pdf, 35);

            //Elementos de control
            this.añadirElementosControl(pdf, 35);

            //Mapa
            this.añadirCabeceraAPdf(pdf);
            this.añadirFooter(pdf);
            pdf.setFontSize(14);
            pdf.setFont('Raleway-Bold', 'normal');
            pdf.text("Mapa del centro de mando y puntos de luz", 10, 143);

            //Imagen del mapa
            let anchoMapa = 200;
            let altoMapa = (this.map.getSize().y * anchoMapa) / this.map.getSize().x;
            let margenIzquierdo = (pdf.internal.pageSize.width - anchoMapa) / 2;

            //Si el alto es superior a 125mm, lo redimensionaremos para no ocupar demasiado folio
            if (altoMapa > 125) {
                altoMapa = 125;
                anchoMapa = (this.map.getSize().x * altoMapa) / this.map.getSize().y;
                margenIzquierdo = (pdf.internal.pageSize.width - anchoMapa) / 2;
            }

            //Borde del mapa
            pdf.setFillColor(235, 235, 235);
            pdf.rect(margenIzquierdo - 1, 149, anchoMapa + 2, altoMapa + 2, "F");

            pdf.addImage(imagenDeMapa, 'png', margenIzquierdo, 150, anchoMapa, altoMapa);
            pdf.addImage(imagenSuperpuestaCM, 'png', margenIzquierdo, 150, anchoMapa, altoMapa);
            pdf.addImage(imagenSuperpuestaLuminaria, 'png', margenIzquierdo, 150, anchoMapa, altoMapa);

            //Leyenda
            let leyenda = new Image();
            leyenda.src = "../../../../../../assets/images/leyenda_ficha_CM.png";
            pdf.addImage(leyenda, 'png', margenIzquierdo, 150 + altoMapa - 16, 32, 16);
            pdf.setDrawColor(0, 0, 0);
            pdf.rect(margenIzquierdo, 150 + altoMapa - 16, 32, 16, "D");

            //Protecciones generales
            this.añadirProteccionesGenerales(pdf, res);

            //Medidas generales
            //this.añadirMediciones(pdf);

            await this.añadirPaginaCircuito(pdf, 0, cm, estilo, result1, result2, imagenDeMapa, imagenSuperpuestaCM, pdf.internal.pageSize.width, pdf.internal.pageSize.height, res);

        }
        catch(error)
        {
            throw error;
        }
    }

    //Función recursiva que irá añadiendo páginas al pdf por cada circuito
   public async añadirPaginaCircuito(
      pdf: any,
      circuito_index: number,
      cm: string,
      estilo: string,
      result1: any,
      result2: any,
      dataUrl: string,
      imagenSuperpuestaCM: any,
      width: number,
      height: number,
      res: any
    ):Promise<void>
    {
        try 
        {
            //Si el index del circuito está centro del array de circuitos
            if (circuito_index + 1 <= this.array_circuitos.length)
            {
                //Guardamos el nombre del circuito
                let circuito = this.array_circuitos[circuito_index];

                //Guardamos la imagen del layer descargada de geoserver
                let imagenSuperCircuito = new Image();

                imagenSuperCircuito.src = this.urlBase + "SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&FORMAT=image%2Fpng&TRANSPARENT=true&" +
                    "LAYERS=" + this.proyecto.bd_proyecto + "%3Agissmart_energy_gestlighting_luminaria&exceptions=application%2Fvnd.ogc.se_inimage&" +
                    "CQL_FILTER=centro_mando%3D%27" + cm + "%27+AND+circuito%3D%27" + circuito + "%27&" +
                    "SRS=EPSG%3A" + this.proyecto.proyeccion + "&" +
                    "STYLES=" + estilo + "&" +
                    "WIDTH=" + this.map.getSize().x + "&HEIGHT=" + this.map.getSize().y + "&" +
                    "BBOX=" + result1[0] + "%2C" + result1[1] + "%2C" + result2[0] + "%2C" + result2[1];

                //Cuando la imagen está cargada
                await new Promise<void>(resolve => imagenSuperCircuito.onload = () => resolve());
                
                //Añadimos una página al pdf e incluimos las 2 imágenes superpuestas (base y layer con las luminarias)
                pdf.addPage();
                this.añadirCabeceraAPdf(pdf);
                this.añadirFooter(pdf);

                pdf.setFontSize(14);
                pdf.setFont('Raleway-Bold', 'normal');
                pdf.text("Circuito " + circuito, 10, 30);

                //pdf.text("Circuito "+circuito, 10 ,10);
                //Imagen del mapa
                let anchoMapa = 200;
                let altoMapa = (this.map.getSize().y * anchoMapa) / this.map.getSize().x;
                let margenIzquierdo = (width - anchoMapa) / 2;

                //Si el alto es superior a 125mm, lo redimensionaremos para no ocupar demasiado folio
                if (altoMapa > 60) {
                    altoMapa = 60;
                    anchoMapa = (this.map.getSize().x * altoMapa) / this.map.getSize().y;
                    margenIzquierdo = (width - anchoMapa) / 2;
                }

                //Borde del mapa
                pdf.setFillColor(235, 235, 235);
                pdf.rect(margenIzquierdo - 1, 34, anchoMapa + 2, altoMapa + 2, "F");

                pdf.addImage(dataUrl, 'png', margenIzquierdo, 35, anchoMapa, altoMapa);
                pdf.addImage(imagenSuperpuestaCM, 'png', margenIzquierdo, 35, anchoMapa, altoMapa);
                pdf.addImage(imagenSuperCircuito, 'png', margenIzquierdo, 35, anchoMapa, altoMapa);

                //Leyenda
                let leyenda = new Image();
                leyenda.src = "../../../../../../assets/images/leyenda_ficha_CM.png";
                pdf.addImage(leyenda, 'png', margenIzquierdo, 35 + altoMapa - 16, 32, 16);
                pdf.setDrawColor(0, 0, 0);
                pdf.rect(margenIzquierdo, 35 + altoMapa - 16, 32, 16, "D");

                //Añadimos los datos correspondiente al circuito
                this.añadirDatosCircuito(pdf, circuito, altoMapa, res);

                //Llamamos a la función para añadir un nuevo circuito
                await this.añadirPaginaCircuito(pdf, circuito_index + 1, cm, estilo, result1, result2, dataUrl, imagenSuperpuestaCM, width, height, res);
            }
            else
            {
                //Si no hay más circuitos, guardamos el pdf.

                //Si hay fotos disponibles las añadimos en el anexo
                if (this.arrayFotos.length > 0)
                {
                    await this.añadirAnexo(pdf, 0);
                } 
                else
                {
                    //Guardamos el index del centro de mando actual en el array de centros de mando seleccionados
                    let indexActual: number = this.centros_mando_seleccionados.indexOf(cm);

                    //Si todavía no es el último centro de mando del array
                    if (indexActual + 1 < this.centros_mando_seleccionados.length) {

                        //Obtenemos el nombre del siguiente centro de mando
                        let siguienteCM = this.centros_mando_seleccionados[indexActual + 1];

                        //Llamamos a la función para crear otra ficha
                        await this.fichaCentroMando(siguienteCM, pdf);

                        //Si es el último centro de mando
                    }
                    else
                    {
                        pdf.save('FichasCentroMando.pdf');

                        this._spinnerService.hide();
                        this._spinnerService.cleanText();
                    }
                }
            }
        }
        catch (error)
        {
            throw error;    
        }
    }

    //Añadimos datos a la página del circuito
    private añadirDatosCircuito(pdf: jsPDF, circuito: string, posicion: number, res: any):void
    {
        let seccion = "-";
        let tipo = "-";
        let tieneProtecciones = false;
        let tieneMediciones = false;
        let tipoCanalizacion = "-";
        let tipoConductor = "-";
        let interruptorMA = "-";
        let observacionesCirc = "-";

        let polaridadMagnetotermico = "-";
        let intensidadMagnetotermico = "-";
        let marcaMagnetotermico = "-";

        let polaridadDiferencial = "-";
        let intensidadDiferencial = "-";
        let sensibilidadDiferencial = "-";
        let marcaDiferencial = "-";

        let existenciaContactor = "-";
        let polaridadContactor = "-";
        let intensidadContactor = "-";
        let marcaContactor = "-";

        let tituloMediciones = "-";
        let tensionFaseR = "-";
        let intensidadFaseR = "-";
        let potenciaActivaFaseR = "-";
        let potenciaReactivaFaseR = "-";
        let factorPotenciaFaseR = "-";

        let tensionFaseS = "-";
        let intensidadFaseS = "-";
        let potenciaActivaFaseS = "-";
        let potenciaReactivaFaseS = "-";
        let factorPotenciaFaseS = "-";

        let tensionFaseT = "-";
        let intensidadFaseT = "-";
        let potenciaActivaFaseT = "-";
        let potenciaReactivaFaseT = "-";
        let factorPotenciaFaseT = "-";

        // Añadimos variable cantidad que se usara en las protecciones
        let cantidadMagnetotermico = "-";
        let cantidadDiferencial = "-";
        let cantidadContactor = "-";

        //Dentro de la respuesta del backend, recorremos el diccionario de circuitos
        Object.entries(res.datos.circuitos).forEach(([key, value]) => {
            let circuitoCorrecto = false;
            //Para cada circuito, recorremos su contenido y comprobamos que es el circuito a reflejar
            Object.entries(value).forEach(([k, v]) => {
                if (k === "nombre" && v === circuito) {
                    circuitoCorrecto = true;
                }
            });

            //Cuando estamos en el circuito que queremos reflejar
            if (circuitoCorrecto) {
                Object.entries(value).forEach(([k, v]) => {
                    if (k === "seccion") {
                        seccion = v;
                    }
                    if (k === "tipo") {
                        tipo = v;
                    }
                    if (k === "tipo_canalizacion") {
                        tipoCanalizacion = v;
                    }
                    if (k === "tipo_conductor") {
                        tipoConductor = v;
                    }
                    if (k === "observaciones") {
                        if (v === null) {
                            observacionesCirc = "-";
                        } else {
                            observacionesCirc = v;
                        }
                    }

                    if (k === "manual_automatico") {
                        if (v === true) {
                            interruptorMA = "Sí";
                        } else {
                            interruptorMA = "No";
                        }
                    }

                    if (k === "protecciones_circuito") {
                        //Si hay protecciones para reflejar
                        tieneProtecciones = true;

                        //Recorremos el diccionario para averiguar qué tipo de protección es
                        Object.entries(v).forEach(([llaveProt, datosProt]) => {
                            let esMagnetotermico = false;
                            let esDiferencial = false;
                            let esContactor = false;
                            Object.entries(datosProt).forEach(([keyProt, valueProt]) => {
                                if (keyProt === "tipo" && valueProt === "MAGNETOTÉRMICO") {
                                    esMagnetotermico = true;
                                }
                                if (keyProt === "tipo" && valueProt === "DIFERENCIAL") {
                                    esDiferencial = true;
                                }
                                if (keyProt === "tipo" && valueProt === "CONTACTOR") {
                                    esContactor = true;
                                }
                            });

                            Object.entries(datosProt).forEach(([keyProt, valueProt]) => {

                                //Si es magnetotérmico
                                if (esMagnetotermico) {
                                    if (keyProt === "polaridad") {
                                        if (valueProt === null) {
                                            polaridadMagnetotermico = "-";
                                        } else {
                                            polaridadMagnetotermico = valueProt;
                                        }
                                    }
                                    if (keyProt === "intensidad") {
                                        if (valueProt === null) {
                                            intensidadMagnetotermico = "-";
                                        } else {
                                            intensidadMagnetotermico = valueProt;
                                        }
                                    }
                                    if (keyProt === "marca") {
                                        if (valueProt === null) {
                                            marcaMagnetotermico = "-";
                                        } else {
                                            marcaMagnetotermico = valueProt;
                                        }
                                    }
                                    if (keyProt === "cantidad") {
                                        if (valueProt === null) {
                                            cantidadMagnetotermico = "-";
                                        } else {
                                            cantidadMagnetotermico = valueProt;
                                        }
                                    }
                                }

                                //Si es diferencial
                                if (esDiferencial) {
                                    if (keyProt === "polaridad") {
                                        if (valueProt === null) {
                                            polaridadDiferencial = "-";
                                        } else {
                                            polaridadDiferencial = valueProt;
                                        }
                                    }
                                    if (keyProt === "intensidad") {
                                        if (valueProt === null) {
                                            intensidadDiferencial = "-";
                                        } else {
                                            intensidadDiferencial = valueProt;
                                        }
                                    }
                                    if (keyProt === "sensibilidad") {
                                        if (valueProt === null) {
                                            sensibilidadDiferencial = "-";
                                        } else {
                                            sensibilidadDiferencial = valueProt;
                                        }
                                    }
                                    if (keyProt === "marca") {
                                        if (valueProt === null) {
                                            marcaDiferencial = "-";
                                        } else {
                                            marcaDiferencial = valueProt;
                                        }
                                    }
                                    if (keyProt === "cantidad") {
                                        if (valueProt === null) {
                                            cantidadDiferencial = "-";
                                        } else {
                                            cantidadDiferencial = valueProt;
                                        }
                                    }
                                }

                                //Si es contactor
                                if (esContactor) {
                                    if (keyProt === "cantidad") {
                                        if (valueProt === null || valueProt <= 0) {
                                            existenciaContactor = "No";
                                        } else {
                                            existenciaContactor = "Sí";
                                        }
                                    }
                                    if (keyProt === "polaridad") {
                                        if (valueProt === null) {
                                            polaridadContactor = "-";
                                        } else {
                                            polaridadContactor = valueProt;
                                        }
                                    }
                                    if (keyProt === "intensidad") {
                                        if (valueProt === null) {
                                            intensidadContactor = "-";
                                        } else {
                                            intensidadContactor = valueProt;
                                        }
                                    }
                                    if (keyProt === "marca") {
                                        if (valueProt === null) {
                                            marcaContactor = "-";
                                        } else {
                                            marcaContactor = valueProt;
                                        }
                                    }
                                    if (keyProt === "cantidad") {
                                        if (valueProt === null) {
                                            cantidadContactor = "-";
                                        } else {
                                            cantidadContactor = valueProt;
                                        }
                                    }
                                }
                            });
                        });
                    }

                    if (k === "medicion_circuito") {
                        //Si hay mediciones para reflejar
                        tieneMediciones = true;

                        //Recorremos el diccionario para averiguar si es normal o reducida
                        Object.entries(v).forEach(([llaveMed, datosMed]) => {
                            let sumatoriaNormal = 0;
                            let sumatoriaReducida = 0;

                            //Sumamos los valores de las mediciones normales y reducias para averiguar cual está llegando
                            Object.entries(datosMed).forEach(([keyMed, valueMed]) => {
                                if (keyMed === "factor_potencia_normal_fase_r") {
                                    sumatoriaNormal = sumatoriaNormal + valueMed;
                                }
                                if (keyMed === "factor_potencia_normal_fase_s") {
                                    sumatoriaNormal = sumatoriaNormal + valueMed;
                                }
                                if (keyMed === "factor_potencia_normal_fase_t") {
                                    sumatoriaNormal = sumatoriaNormal + valueMed;
                                }

                                if (keyMed === "factor_potencia_reducida_fase_r") {
                                    sumatoriaReducida = sumatoriaReducida + valueMed;
                                }
                                if (keyMed === "factor_potencia_reducida_fase_s") {
                                    sumatoriaReducida = sumatoriaReducida + valueMed;
                                }
                                if (keyMed === "factor_potencia_reducida_fase_t") {
                                    sumatoriaReducida = sumatoriaReducida + valueMed;
                                }
                            });

                            //Comprobamos cual es mayor
                            if (sumatoriaNormal >= sumatoriaReducida) {
                                tituloMediciones = "Medidas del circuito (sin sistemas de reducción)";

                                //Añadimos los datos sin sistemas de reducción
                                Object.entries(datosMed).forEach(([keyMed, valueMed]) => {
                                    if (keyMed === "tension_normal_vrs") {
                                        tensionFaseR = valueMed + "";
                                    }
                                    if (keyMed === "intensidad_normal_fase_r") {
                                        intensidadFaseR = valueMed + "";
                                    }
                                    if (keyMed === "potencia_normal_fase_r") {
                                        potenciaActivaFaseR = valueMed + "";
                                    }
                                    if (keyMed === "reactiva_normal_fase_r") {
                                        potenciaReactivaFaseR = valueMed + "";
                                    }
                                    if (keyMed === "factor_potencia_normal_fase_r") {
                                        factorPotenciaFaseR = valueMed + "";
                                    }

                                    if (keyMed === "tension_normal_vst") {
                                        tensionFaseS = valueMed + "";
                                    }
                                    if (keyMed === "intensidad_normal_fase_s") {
                                        intensidadFaseS = valueMed + "";
                                    }
                                    if (keyMed === "potencia_normal_fase_s") {
                                        potenciaActivaFaseS = valueMed + "";
                                    }
                                    if (keyMed === "reactiva_normal_fase_s") {
                                        potenciaReactivaFaseS = valueMed + "";
                                    }
                                    if (keyMed === "factor_potencia_normal_fase_s") {
                                        factorPotenciaFaseS = valueMed + "";
                                    }

                                    if (keyMed === "tension_normal_vtr") {
                                        tensionFaseT = valueMed + "";
                                    }
                                    if (keyMed === "intensidad_normal_fase_t") {
                                        intensidadFaseT = valueMed + "";
                                    }
                                    if (keyMed === "potencia_normal_fase_t") {
                                        potenciaActivaFaseT = valueMed + "";
                                    }
                                    if (keyMed === "reactiva_normal_fase_t") {
                                        potenciaReactivaFaseT = valueMed + "";
                                    }
                                    if (keyMed === "factor_potencia_normal_fase_t") {
                                        factorPotenciaFaseT = valueMed + "";
                                    }
                                });
                            } else {
                                tituloMediciones = "Medidas del circuito (con sistemas de reducción)";

                                //Añadimos los datos con sistemas de reducción
                                Object.entries(datosMed).forEach(([keyMed, valueMed]) => {
                                    if (keyMed === "tension_reducida_vrs") {
                                        tensionFaseR = valueMed + "";
                                    }
                                    if (keyMed === "intensidad_reducida_fase_r") {
                                        intensidadFaseR = valueMed + "";
                                    }
                                    if (keyMed === "potencia_reducida_fase_r") {
                                        potenciaActivaFaseR = valueMed + "";
                                    }
                                    if (keyMed === "reactiva_reducida_fase_r") {
                                        potenciaReactivaFaseR = valueMed + "";
                                    }
                                    if (keyMed === "factor_potencia_reducida_fase_r") {
                                        factorPotenciaFaseR = valueMed + "";
                                    }

                                    if (keyMed === "tension_reducida_vst") {
                                        tensionFaseS = valueMed + "";
                                    }
                                    if (keyMed === "intensidad_reducida_fase_s") {
                                        intensidadFaseS = valueMed + "";
                                    }
                                    if (keyMed === "potencia_reducida_fase_s") {
                                        potenciaActivaFaseS = valueMed + "";
                                    }
                                    if (keyMed === "reactiva_reducida_fase_s") {
                                        potenciaReactivaFaseS = valueMed + "";
                                    }
                                    if (keyMed === "factor_potencia_reducida_fase_s") {
                                        factorPotenciaFaseS = valueMed + "";
                                    }

                                    if (keyMed === "tension_reducida_vtr") {
                                        tensionFaseT = valueMed + "";
                                    }
                                    if (keyMed === "intensidad_reducida_fase_t") {
                                        intensidadFaseT = valueMed + "";
                                    }
                                    if (keyMed === "potencia_reducida_fase_t") {
                                        potenciaActivaFaseT = valueMed + "";
                                    }
                                    if (keyMed === "reactiva_reducida_fase_t") {
                                        potenciaReactivaFaseT = valueMed + "";
                                    }
                                    if (keyMed === "factor_potencia_reducida_fase_t") {
                                        factorPotenciaFaseT = valueMed + "";
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });

        //Datos generales
        pdf.setFontSize(14);
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Datos generales", 10, posicion + 45);

        //Tipo
        pdf.setFillColor(235, 235, 235);
        pdf.rect(13, posicion + 48, 180, 6, 'F');
        pdf.setFontSize(10);
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Tipo:", 15, posicion + 52);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text(tipo, 26, posicion + 52);
        pdf.setDrawColor(200, 200, 200);
        pdf.line(108, posicion + 48, 108, posicion + 54);

        //Sección
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Sección (mm2):", 110, posicion + 52);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text(seccion, 137, posicion + 52);

        //Tipo de canalización
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Tipo de canalización:", 15, posicion + 58);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text(tipoCanalizacion, 53, posicion + 58);
        pdf.line(108, posicion + 54, 108, posicion + 60);

        //Tipo de conductor
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Tipo de conductor:", 110, posicion + 58);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text(tipoConductor, 143, posicion + 58);

        //Interruptor Manual/Automático de circuito
        pdf.setFillColor(235, 235, 235);
        pdf.rect(13, posicion + 60, 180, 6, 'F');
        pdf.setFontSize(10);
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Interruptor Manual/Automático de circuito:", 15, posicion + 64);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text(interruptorMA, 90, posicion + 64);
        pdf.setDrawColor(200, 200, 200);
        pdf.line(108, posicion + 60, 108, posicion + 66);


        //Observaciones
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Observaciones:", 15, posicion + 71);
        pdf.setFont('Raleway-Regular', 'normal');
        //Si observaciones es demasiado largo, lo vamos separando en líneas de 60 caracteres (máximo 3 líneas)
        if (observacionesCirc.length <= 60) { //60
            pdf.text(observacionesCirc, 44, posicion + 71);
        } else if (observacionesCirc.length > 60) {
            pdf.text(observacionesCirc.substring(0, 60), 44, posicion + 71);
            pdf.text(observacionesCirc.substring(60, 120), 44, posicion + 77);
        }

        posicion = posicion + 84; //Ponemos el marcador de posición en el siguiente elemento

        //Si tiene protecciones, las añadimos
        if (tieneProtecciones) {
            //Protecciones del circuito
            pdf.setFontSize(14);
            pdf.setFont('Raleway-Bold', 'normal');
            pdf.text("Protecciones del circuito", 10, posicion);

            //INTERRUPTOR MAGNETOTÉRMICO
            pdf.setFontSize(10);
            pdf.text("INTERRUPTOR MAGNETOTÉRMICO", 15, posicion + 7);

            //Nº Polos
            pdf.setFillColor(235, 235, 235);
            pdf.rect(13, posicion + 9, 180, 6, 'F');
            pdf.setFont('Raleway-Bold', 'normal');
            pdf.text("Nº Polos:", 15, posicion + 13);
            pdf.setFont('Raleway-Regular', 'normal');
            pdf.text(polaridadMagnetotermico, 32, posicion + 13);
            pdf.line(108, posicion + 9, 108, posicion + 15);

            //Intensidad (A)
            pdf.setFont('Raleway-Bold', 'normal');
            pdf.text("Intensidad (A):", 110, posicion + 13);
            pdf.setFont('Raleway-Regular', 'normal');
            pdf.text(intensidadMagnetotermico, 137, posicion + 13);

            //Marca
            pdf.setFont('Raleway-Bold', 'normal');
            pdf.text("Marca:", 15, posicion + 19);
            pdf.setFont('Raleway-Regular', 'normal');
            pdf.text(marcaMagnetotermico, 29, posicion + 19);
            pdf.line(108, posicion + 15, 108, posicion + 21);

            //Cantidad
            pdf.setFont('Raleway-Bold', 'normal');
            pdf.text("Cantidad:", 110, posicion + 19);
            pdf.setFont('Raleway-Regular', 'normal');
            pdf.text(cantidadMagnetotermico + "", 130, posicion + 19);


            //INTERRUPTOR DIFERENCIAL
            pdf.setFont('Raleway-Bold', 'normal');
            pdf.setFontSize(10);
            pdf.text("INTERRUPTOR DIFERENCIAL", 15, posicion + 28);

            //Nº Polos
            pdf.setFillColor(235, 235, 235);
            pdf.rect(13, posicion + 30, 180, 6, 'F');
            pdf.setFont('Raleway-Bold', 'normal');
            pdf.text("Nº Polos:", 15, posicion + 34);
            pdf.setFont('Raleway-Regular', 'normal');
            pdf.text(polaridadDiferencial, 32, posicion + 34);
            pdf.line(108, posicion + 28, 108, posicion + 36);

            //Intensidad (A)
            pdf.setFont('Raleway-Bold', 'normal');
            pdf.text("Intensidad (A):", 110, posicion + 34);
            pdf.setFont('Raleway-Regular', 'normal');
            pdf.text(intensidadDiferencial, 137, posicion + 34);

            //Sensibilidad
            pdf.setFont('Raleway-Bold', 'normal');
            pdf.text("Sensibilidad (mA):", 15, posicion + 40);
            pdf.setFont('Raleway-Regular', 'normal');
            pdf.text(sensibilidadDiferencial, 47, posicion + 40);
            pdf.line(108, posicion + 36, 108, posicion + 42);

            //Marca
            pdf.setFont('Raleway-Bold', 'normal');
            pdf.text("Marca:", 110, posicion + 40);
            pdf.setFont('Raleway-Regular', 'normal');
            pdf.text(marcaDiferencial, 124, posicion + 40);

            //Cantidad
            pdf.setFillColor(235, 235, 235);
            pdf.rect(13, posicion + 42, 180, 6, 'F');
            pdf.setFont('Raleway-Bold', 'normal');
            pdf.text("Cantidad:", 15, posicion + 46);
            pdf.setFont('Raleway-Regular', 'normal');
            pdf.text(cantidadDiferencial + "", 35, posicion + 46);
            pdf.line(108, posicion + 42, 108, posicion + 48);


            //CONTACTOR
            pdf.setFont('Raleway-Bold', 'normal');
            pdf.setFontSize(10);
            pdf.text("CONTACTOR", 15, posicion + 55);

            //Existencia
            pdf.setFillColor(235, 235, 235);
            pdf.rect(13, posicion + 57, 180, 6, 'F');
            pdf.setFont('Raleway-Bold', 'normal');
            pdf.text("Existencia:", 15, posicion + 61);
            pdf.setFont('Raleway-Regular', 'normal');
            pdf.text(existenciaContactor, 35, posicion + 61);
            pdf.line(108, posicion + 57, 108, posicion + 63);

            //Nº Polos
            pdf.setFont('Raleway-Bold', 'normal');
            pdf.text("Nº Polos:", 110, posicion + 61);
            pdf.setFont('Raleway-Regular', 'normal');
            pdf.text(polaridadContactor, 128, posicion + 61);

            //Intensidad (A)
            pdf.setFont('Raleway-Bold', 'normal');
            pdf.text("Intensidad (A):", 15, posicion + 67);
            pdf.setFont('Raleway-Regular', 'normal');
            pdf.text(intensidadContactor, 43, posicion + 67);
            pdf.line(108, posicion + 63, 108, posicion + 69);

            //Marca
            pdf.setFont('Raleway-Bold', 'normal');
            pdf.text("Marca:", 110, posicion + 67);
            pdf.setFont('Raleway-Regular', 'normal');
            pdf.text(marcaContactor, 124, posicion + 67);

            //Cantidad
            pdf.setFillColor(235, 235, 235);
            pdf.rect(13, posicion + 69, 180, 6, 'F');
            pdf.setFont('Raleway-Bold', 'normal');
            pdf.text("Cantidad:", 15, posicion + 73);
            pdf.setFont('Raleway-Regular', 'normal');
            pdf.text(cantidadContactor + "", 35, posicion + 73);
            pdf.line(108, posicion + 69, 108, posicion + 75);

            posicion = posicion + 75; //Ponemos el marcador de posición en el siguiente elemento

        }

        //Si tiene mediciones, las añadimos
        if (tieneMediciones) {

            // if (posicion >= 234) {
                pdf.addPage();
                this.añadirCabeceraAPdf(pdf);
                this.añadirFooter(pdf);
                posicion = 35;
            // }
    
            //Protecciones del circuito
            pdf.setFontSize(14);
            pdf.setFont('Raleway-Bold', 'normal');
            pdf.text(tituloMediciones, 10, posicion);

            //Fase R
            pdf.setFont('Raleway-Bold', 'normal');
            pdf.setFontSize(12);
            pdf.text("Fase R", 15, posicion + 7);

            //Tensión
            pdf.setFillColor(235, 235, 235);
            pdf.rect(13, posicion + 9, 180, 6, 'F');
            pdf.setFont('Raleway-Bold', 'normal');
            pdf.setFontSize(10);
            pdf.text("Tensión (V): ", 15, posicion + 13);
            pdf.setFont('Raleway-Regular', 'normal');
            pdf.text(tensionFaseR, 36, posicion + 13);
            pdf.line(103, posicion + 9, 103, posicion + 15);

            //Intensidad
            pdf.setFont('Raleway-Bold', 'normal');
            pdf.text("Intensidad (A):", 105, posicion + 13);
            pdf.setFont('Raleway-Regular', 'normal');
            pdf.text(intensidadFaseR, 131, posicion + 13);

            //Potencia activa
            pdf.setFont('Raleway-Bold', 'normal');
            pdf.text("Potencia activa (W): ", 15, posicion + 19);
            pdf.setFont('Raleway-Regular', 'normal');
            pdf.text(potenciaActivaFaseR + "", 51, posicion + 19);
            pdf.line(103, posicion + 15, 103, posicion + 21);

            //Potencia reactiva
            pdf.setFont('Raleway-Bold', 'normal');
            pdf.text("Potencia reactiva:", 105, posicion + 19);
            pdf.setFont('Raleway-Regular', 'normal');
            pdf.text(potenciaReactivaFaseR, 138, posicion + 19);

            //Factor de potencia
            pdf.setFillColor(235, 235, 235);
            pdf.rect(13, posicion + 21, 180, 6, 'F');
            pdf.setFont('Raleway-Bold', 'normal');
            pdf.setFontSize(10);
            pdf.text("Factor de potencia: ", 15, posicion + 25);
            pdf.setFont('Raleway-Regular', 'normal');
            pdf.text(factorPotenciaFaseR, 50, posicion + 25);
            pdf.line(103, posicion + 21, 103, posicion + 27);

            posicion = posicion + 25; //Ponemos el marcador de posición en la siguiente posición

            //Fase S
            pdf.setFont('Raleway-Bold', 'normal');
            pdf.setFontSize(12);
            pdf.text("Fase S", 15, posicion + 7);

            //Tensión
            pdf.setFillColor(235, 235, 235);
            pdf.rect(13, posicion + 9, 180, 6, 'F');
            pdf.setFont('Raleway-Bold', 'normal');
            pdf.setFontSize(10);
            pdf.text("Tensión (V): ", 15, posicion + 13);
            pdf.setFont('Raleway-Regular', 'normal');
            pdf.text(tensionFaseS, 36, posicion + 13);
            pdf.line(103, posicion + 9, 103, posicion + 15);

            //Intensidad
            pdf.setFont('Raleway-Bold', 'normal');
            pdf.text("Intensidad (A):", 105, posicion + 13);
            pdf.setFont('Raleway-Regular', 'normal');
            pdf.text(intensidadFaseS, 131, posicion + 13);

            //Potencia activa
            pdf.setFont('Raleway-Bold', 'normal');
            pdf.text("Potencia activa (W): ", 15, posicion + 19);
            pdf.setFont('Raleway-Regular', 'normal');
            pdf.text(potenciaActivaFaseS + "", 51, posicion + 19);
            pdf.line(103, posicion + 15, 103, posicion + 21);

            //Potencia reactiva
            pdf.setFont('Raleway-Bold', 'normal');
            pdf.text("Potencia reactiva:", 105, posicion + 19);
            pdf.setFont('Raleway-Regular', 'normal');
            pdf.text(potenciaReactivaFaseS, 138, posicion + 19);

            //Factor de potencia
            pdf.setFillColor(235, 235, 235);
            pdf.rect(13, posicion + 21, 180, 6, 'F');
            pdf.setFont('Raleway-Bold', 'normal');
            pdf.setFontSize(10);
            pdf.text("Factor de potencia: ", 15, posicion + 25);
            pdf.setFont('Raleway-Regular', 'normal');
            pdf.text(factorPotenciaFaseS, 50, posicion + 25);
            pdf.line(103, posicion + 21, 103, posicion + 27);

            posicion = posicion + 25; //Ponemos el marcador de posición en la siguiente posición

            //Fase T
            pdf.setFont('Raleway-Bold', 'normal');
            pdf.setFontSize(12);
            pdf.text("Fase T", 15, posicion + 7);

            //Tensión
            pdf.setFillColor(235, 235, 235);
            pdf.rect(13, posicion + 9, 180, 6, 'F');
            pdf.setFont('Raleway-Bold', 'normal');
            pdf.setFontSize(10);
            pdf.text("Tensión (V): ", 15, posicion + 13);
            pdf.setFont('Raleway-Regular', 'normal');
            pdf.text(tensionFaseT, 36, posicion + 13);
            pdf.line(103, posicion + 9, 103, posicion + 15);

            //Intensidad
            pdf.setFont('Raleway-Bold', 'normal');
            pdf.text("Intensidad (A):", 105, posicion + 13);
            pdf.setFont('Raleway-Regular', 'normal');
            pdf.text(intensidadFaseT, 131, posicion + 13);

            //Potencia activa
            pdf.setFont('Raleway-Bold', 'normal');
            pdf.text("Potencia activa (W): ", 15, posicion + 19);
            pdf.setFont('Raleway-Regular', 'normal');
            pdf.text(potenciaActivaFaseT + "", 51, posicion + 19);
            pdf.line(103, posicion + 15, 103, posicion + 21);

            //Potencia reactiva
            pdf.setFont('Raleway-Bold', 'normal');
            pdf.text("Potencia reactiva:", 105, posicion + 19);
            pdf.setFont('Raleway-Regular', 'normal');
            pdf.text(potenciaReactivaFaseT, 138, posicion + 19);

            //Factor de potencia
            pdf.setFillColor(235, 235, 235);
            pdf.rect(13, posicion + 21, 180, 6, 'F');
            pdf.setFont('Raleway-Bold', 'normal');
            pdf.setFontSize(10);
            pdf.text("Factor de potencia: ", 15, posicion + 25);
            pdf.setFont('Raleway-Regular', 'normal');
            pdf.text(factorPotenciaFaseT, 50, posicion + 25);
            pdf.line(103, posicion + 21, 103, posicion + 27);
        }
    }

    //Añadimos la cabecera al pdf
    añadirCabeceraAPdf(pdf: jsPDF) {
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.setFontSize(16);
        pdf.text("Ficha de centro de mando " + this.numeroCuadro, 15, 20);
        pdf.setDrawColor(0, 0, 0);
        pdf.line(10, 22, pdf.internal.pageSize.width - 10, 22);
        pdf.setDrawColor(200, 200, 200);
        pdf.addImage(this.proyecto.icono, 'png', pdf.internal.pageSize.width - 30, 5, 12, 15);
    }

    //Índice del pdf
    añadirIndice(pdf: jsPDF) {
        this.cmEnIndice = [];

        pdf.setFont('Raleway-Bold', 'normal');
        pdf.setFontSize(16);
        pdf.text("Fichas de centro de mando ", 15, 20);
        pdf.setDrawColor(0, 0, 0);
        pdf.line(10, 22, pdf.internal.pageSize.width - 10, 22);
        pdf.setDrawColor(200, 200, 200);
        pdf.addImage(this.proyecto.icono, 'png', pdf.internal.pageSize.width - 30, 5, 12, 15);

        this.añadirFooter(pdf);

        pdf.setFont('Raleway-Bold', 'normal');
        pdf.setFontSize(16);
        pdf.text("ÍNDICE", 95, 35);

        this.posicionIndiceActual = 43;

        this.centros_mando_seleccionados.forEach((centro) => {

            if (this.posicionIndiceActual > 280) {
                pdf.addPage();
                pdf.setFont('Raleway-Bold', 'normal');
                pdf.setFontSize(16);
                pdf.text("Fichas de centro de mando", 15, 20);
                pdf.setDrawColor(0, 0, 0);
                pdf.line(10, 22, pdf.internal.pageSize.width - 10, 22);
                pdf.setDrawColor(200, 200, 200);
                pdf.addImage(this.proyecto.icono, 'png', pdf.internal.pageSize.width - 30, 5, 12, 15);

                this.añadirFooter(pdf);

                this.posicionIndiceActual = 38;
            }

            if (this.indiceResaltarLinea) {
                pdf.setFillColor(235, 235, 235);
                pdf.rect(13, this.posicionIndiceActual - 4, 180, 6, 'F');
            }
            pdf.setFontSize(12);
            pdf.setFont('Raleway-Regular', 'normal');
            pdf.text(centro, 25, this.posicionIndiceActual);

            //Guardamos la página y posición del centro de mando en el índice
            this.cmEnIndice.push([centro, pdf.getCurrentPageInfo().pageNumber, this.posicionIndiceActual]);

            this.posicionIndiceActual = this.posicionIndiceActual + 6;
            this.indiceResaltarLinea = !this.indiceResaltarLinea;
        });
    }

    //Añade una línea al índice
    añadirAlIndice(cm: string, pdf: jsPDF, pagina: number) {

        let paginaIndice = 0;
        let posicionIndice = 0;

        //Recorremos el array con la información de posición de cada centro de mando en el índice
        this.cmEnIndice.forEach((centro) => {

            //Si coincide con el centro de mando que estamos introduciendo
            if (cm === centro[0]) {

                //Cogemos la página y la posición en el folio del centro de mando deseado
                paginaIndice = centro[1];
                posicionIndice = centro[2];
            }
        });

        //Nos movemos a la página del índice e introducimos el texto con la página en su línea
        pdf.setPage(paginaIndice);
        pdf.setFontSize(12);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text(pagina + "", 185, posicionIndice);

        //Añadimos el link al elemento introducido
        pdf.link(13, posicionIndice - 4, 180, 6, { pageNumber: pagina });

        //Al terminar, actualizamos la posición actual y volvemos a la página que estaba
        pdf.setPage(pagina);
    }

    //Datos generales del centro de mando
    añadirDatosGeneralesCM(pdf: jsPDF) {
        pdf.setFontSize(16);
        pdf.text("Datos del centro de mando", 10, 35);
        pdf.setFontSize(14);
        pdf.setFont('Raleway-Bold', 'normal');
        //pdf.setFont(undefined, "bold");
        pdf.text("Datos generales", 10, 45);

        //Número de cuadro
        pdf.setFontSize(10);
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Número de cuadro:", 15, 52);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text(this.numeroCuadro, 51, 52);
        pdf.setDrawColor(200, 200, 200);
        pdf.line(108, 48, 108, 54);

        //Dirección
        pdf.setFillColor(235, 235, 235);
        pdf.rect(13, 54, 180, 6, 'F');
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Dirección:", 15, 58);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text(this.direccion, 34, 58);
        pdf.line(108, 54, 108, 60);

        //CP
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("CP:", 110, 58);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text("-", 118, 58); //TO DO: de momento se introduce manualmente

        //Municipio
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Municipio:", 15, 64);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text(sessionStorage.getItem("municipio"), 34, 64);
        pdf.line(108, 60, 108, 66);

        //Provincia
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Provincia:", 110, 64);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text(sessionStorage.getItem("provincia"), 128, 64);

        //Localización
        pdf.setFillColor(235, 235, 235);
        pdf.rect(13, 66, 180, 6, 'F');
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Localización:", 15, 70);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text(this.localizacionCM, 40, 70);
        pdf.line(108, 66, 108, 72);

        //Estado
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Estado:", 15, 76);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text(this.estadoCM, 29, 76);
        pdf.line(108, 72, 108, 78);

        //Coordenadas UTM
        pdf.setFillColor(235, 235, 235);
        pdf.rect(13, 78, 180, 6, 'F');
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Coordenadas UTM:", 15, 82);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text(this.coordenadas, 50, 82);
        pdf.line(108, 78, 108, 84);

        //Sección (mm2)
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Sección (mm2):", 15, 88);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text(this.seccionAcometida, 43, 88);
        pdf.line(108, 84, 108, 90);

        //Tensión
        pdf.setFillColor(235, 235, 235);
        pdf.rect(13, 90, 180, 6, 'F');
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Tensión:", 15, 94);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text(this.tension, 33, 94);
        pdf.line(108, 90, 108, 96);

        //Fecha instalación
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Fecha instalación:", 110, 94);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text(this.fechaInstalacionCM, 143, 94);

        //Horas funcionamiento día
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Horas funcionamiento día:", 15, 100);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text(this.horasDia, 63, 100);
        pdf.line(108, 96, 108, 102);

        //Horas funcionamiento ahorro
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Horas funcionamiento ahorro:", 110, 100);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text(this.horasAhorro, 165, 100);

        //Observaciones
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Observaciones:", 15, 112);
        pdf.setFont('Raleway-Regular', 'normal');
        //Si observaciones es demasiado largo, lo vamos separando en líneas de 60 caracteres (máximo 3 líneas)
        if (this.observaciones.length <= 60) { //60
            pdf.text(this.observaciones, 44, 112);
        } else if (this.observaciones.length > 60 && this.observaciones.length <= 120) {
            pdf.text(this.observaciones.substring(0, 60), 44, 112);
            pdf.text(this.observaciones.substring(60), 44, 118);
        } else if (this.observaciones.length > 120) {
            pdf.text(this.observaciones.substring(0, 60), 44, 112);
            pdf.text(this.observaciones.substring(60, 120), 44, 118);
            pdf.text(this.observaciones.substring(120, 180), 44, 124);
        }


    }

    //Fotos del centro de mando
    añadirFotos(pdf: jsPDF) {
        //Fotos título
        pdf.setFontSize(14);
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Fotos (hacer click en para ampliar)", 10, 136);

        this.paginaConFotosActual = pdf.getCurrentPageInfo().pageNumber;

        let contador = 0;
        this.arrayFotos.forEach((foto) => {
            contador++;
            //Para la primera foto
            if (contador === 1) {
                pdf.setFillColor(235, 235, 235);
                pdf.rect(4, 139, 66, 66, "F");
                //pdf.link(4, 129, 66, 66, { pageNumber: 2 });
                pdf.addImage(foto, "png", 5, 140, 64, 64);
            }
            //Para la segunda foto
            if (contador === 2) {
                pdf.setFillColor(235, 235, 235);
                pdf.rect(72, 139, 66, 66, "F");
                //pdf.link(72, 129, 66, 66, { pageNumber: 3 });
                pdf.addImage(foto, "png", 73, 140, 64, 64);
            }
            //Para la tercera foto
            if (contador === 3) {
                pdf.setFillColor(235, 235, 235);
                pdf.rect(140, 139, 66, 66, "F");
                //pdf.link(140, 129, 66, 66, { pageNumber: 4 });
                pdf.addImage(foto, "png", 141, 140, 64, 64);
            }
        });

    }

    //Caja general de protección
    añadirCajaGeneralProteccion(pdf: jsPDF) {

        pdf.setFontSize(14);
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Caja general de protección", 10, 215);

        //Situación
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.setFontSize(10);
        pdf.text("Situación:", 15, 222);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text(this.situacionCajaProteccion, 33, 222);
        pdf.line(103, 218, 103, 224);

        //Grado de protección IP
        pdf.setFillColor(235, 235, 235);
        pdf.rect(13, 224, 180, 6, 'F');
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Grado de protección IP:", 15, 228);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text(this.proteccionIp + "", 58, 228);
        pdf.line(103, 224, 103, 230);

        //Grado de protección IK
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Grado de protección IK:", 105, 228);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text(this.proteccionIk + "", 148, 228);

        //Intensidad nominal fusible (A)
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Intensidad nominal fusible (A):", 15, 234);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text("-", 70, 234); //TO DO: se introduce manualmente
        pdf.line(103, 230, 103, 236);
    }

    //Cuadro de protección
    añadirCuadroProteccion(pdf: jsPDF) {
        pdf.setFontSize(14);
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Cuadro de protección", 10, 245);

        //Ubicación
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.setFontSize(10);
        pdf.text("Ubicación:", 15, 252);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text(this.localizacionCM, 35, 252);
        pdf.line(103, 248, 103, 254);

        //Alto
        pdf.setFillColor(235, 235, 235);
        pdf.rect(13, 254, 180, 6, 'F');
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Alto (cm):", 15, 258);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text(this.altoCuadroProteccion + "", 33, 258);

        //Ancho
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Ancho (cm):", 70, 258);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text(this.anchoCuadroProteccion + "", 92, 258);
        pdf.line(103, 254, 103, 260);

        //Fondo
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Fondo (cm):", 140, 258);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text(this.fondoCuadroProteccion + "", 162, 258);

        //Material
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Material:", 15, 264);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text(this.materialCajaProteccion + "", 31, 264);
        pdf.line(103, 260, 103, 266);

    }

    //Datos del módulo de medida
    añadirModuloMedida(pdf: jsPDF, posicion: number) {

        pdf.setFontSize(14);
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Módulo de medida", 10, posicion);

        //Nº Identificación
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.setFontSize(10);
        pdf.text("Nº Identificación:", 15, posicion + 7);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text(this.numeroSuministro, 46, posicion + 7);
        pdf.line(103, posicion + 3, 103, posicion + 9);

        //Nº CUPS
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Nº CUPS:", 105, posicion + 7);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text(this.numeroCups, 124, posicion + 7);

        //Nº Contador
        pdf.setFillColor(235, 235, 235);
        pdf.rect(13, posicion + 9, 180, 6, 'F');
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Nº Contador:", 15, posicion + 13);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text(this.numeroContador, 39, posicion + 13);
        pdf.line(103, posicion + 9, 103, posicion + 15);


    }

    //Puesta a tierra
    añadirPuestaTierraCuadro(pdf: jsPDF, posicion: number) {
        posicion = posicion - 11; //Ajustamos la posición

        pdf.setFontSize(14);
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Puesta a tierra del cuadro", 10, posicion + 36);

        //Existencia
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.setFontSize(10);
        pdf.text("Existencia:", 15, posicion + 43);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text(this.existenciaPuestaTierra, 35, posicion + 43);
        pdf.line(103, posicion + 39, 103, posicion + 45);

        //Tipo
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Tipo:", 105, posicion + 43);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text(this.tipoPuestaTierra, 115, posicion + 43);

        //Resistencia
        pdf.setFillColor(235, 235, 235);
        pdf.rect(13, posicion + 45, 180, 6, 'F');
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Resistencia (ohm):", 15, posicion + 49);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text(this.resistenciaPuestaTierra + "", 48, posicion + 49);
        pdf.line(103, posicion + 45, 103, posicion + 51);

        //Sección de línea principal (mm2)
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Sección de línea principal (mm2):", 105, posicion + 49);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text(this.seccionPuestaTierra, 165, posicion + 49);
    }

    //Elementos de control
    añadirElementosControl(pdf: jsPDF, posicion: number) {
        posicion = posicion + 42;

        pdf.setFontSize(14);
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Elementos de control", 10, posicion + 7);

        //Telegestión
        pdf.setFillColor(235, 235, 235);
        pdf.rect(13, posicion + 9, 180, 6, 'F');
        pdf.line(13, posicion + 9, 13, posicion + 15);
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.setFontSize(10);
        pdf.text("TELEGESTIÓN", 15, posicion + 13);
        pdf.line(58, posicion + 9, 58, posicion + 15);

        //Tipo telegestión
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Tipo:", 60, posicion + 13);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text(this.tipoTelegestion, 71, posicion + 13);
        pdf.line(118, posicion + 9, 118, posicion + 15);

        //Marca telegestión
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Marca:", 120, posicion + 13);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text(this.marcaTelegestion, 134, posicion + 13);

        //Reloj
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.setFontSize(10);
        pdf.text("RELOJ", 15, posicion + 19);
        pdf.line(58, posicion + 15, 58, posicion + 21);

        //Tipo reloj
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Tipo:", 60, posicion + 19);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text(this.tipoReloj, 71, posicion + 19);
        pdf.line(118, posicion + 15, 118, posicion + 21);

        //Marca reloj
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Marca:", 120, posicion + 19);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text(this.marcaReloj, 134, posicion + 19);

        //Interruptor manual
        pdf.setFillColor(235, 235, 235);
        pdf.rect(13, posicion + 21, 180, 6, 'F');
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.setFontSize(10);
        pdf.text("INTERRUPTOR MANUAL", 15, posicion + 25);
        pdf.line(58, posicion + 21, 58, posicion + 27);

        //Tipo interruptor manual
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Tipo:", 60, posicion + 25);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text(this.tipoInterruptorManual, 71, posicion + 25);
        pdf.line(118, posicion + 21, 118, posicion + 27);

        //Marca interruptor manual
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Marca:", 120, posicion + 25);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text(this.marcaInterruptorManual, 134, posicion + 25);

        //Célula
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.setFontSize(10);
        pdf.text("CÉLULA", 15, posicion + 31);
        pdf.line(58, posicion + 27, 58, posicion + 33);

        //Tipo célula
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Tipo:", 60, posicion + 31);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text(this.tipoCelula, 71, posicion + 31);
        pdf.line(118, posicion + 27, 118, posicion + 33);

        //Marca célula
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Marca:", 120, posicion + 31);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text(this.marcaCelula, 134, posicion + 31);

        //Hora inicio
        pdf.setFillColor(235, 235, 235);
        pdf.rect(13, posicion + 33, 180, 6, 'F');
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Hora inicio:", 60, posicion + 37);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text(this.horaInicio, 82, posicion + 37);
        pdf.line(118, posicion + 33, 118, posicion + 39);

        //Hora fin
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Hora fin:", 120, posicion + 37);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text(this.horaFin, 137, posicion + 37);

    }

    //Protecciones generales
    añadirProteccionesGenerales(pdf: jsPDF, res: any) {
        pdf.addPage();
        this.añadirCabeceraAPdf(pdf);
        this.añadirFooter(pdf);

        pdf.setFontSize(14);
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Protecciones generales", 10, 35);

        //Primero el interruptor general
        let posicion = 0;
        let esElPrimero = false;
                let subtipo = "-";
                let rearmable = "-";
                let polaridad = "-";
                let tension = "-";
                let intensidad = "-";
                let sensibilidad = "-";
                let marca = "-";
                let cantidad = "-";
        if (res.datos.proteccion) {
            Object.entries(res.datos.proteccion).forEach(([key, value]) => {
                esElPrimero = false;
                
                //Comprobamos si es el interruptor general, que iría en primer lugar
                Object.entries(value).forEach(([k, v]) => {
                    if (k === "subtipo" && v === "INTERRUPTOR GENERAL") {
                        esElPrimero = true;
                    }
                });

                if (esElPrimero) {
                    subtipo = "GENERAL";
                    Object.entries(value).forEach(([k, v]) => {
                        if (k === "rearmable") {
                            if (v === null) {
                                rearmable = "-";
                            } else if (v === false) {
                                rearmable = "No";
                            } else if (v === true) {
                                rearmable = "Sí";
                            } else {
                                rearmable = v;
                            }
                        }
                        if (k === "polaridad") {
                            if (v === null) {
                                polaridad = "-";
                            } else {
                                polaridad = v;
                            }
                        }
                        if (k === "tension_corte") {
                            if (v === null) {
                                tension = "-";
                            } else {
                                tension = v + " kV";
                            }
                        }
                        if (k === "intensidad") {
                            if (v === null) {
                                intensidad = "-";
                            } else {
                                intensidad = v;
                            }
                        }
                        if (k === "sensibilidad") {
                            if (v === null) {
                                sensibilidad = "-";
                            } else {
                                sensibilidad = v;
                            }
                        }
                        if (k === "marca") {
                            if (v === null) {
                                marca = "-";
                            } else {
                                marca = v;
                            }
                        }
                        if (k === "cantidad") {
                            if (v === null) {
                                cantidad = "-";
                            } else {
                                cantidad = v;
                            }
                        }
                    });
                
                    pdf.setFont('Raleway-Bold', 'normal');
                    pdf.setFontSize(12);
                    pdf.text("INTERRUPTOR " + subtipo, 15, posicion + 42);

                    //Rearmable
                    pdf.setFillColor(235, 235, 235);
                    pdf.rect(13, posicion + 44, 180, 6, 'F');
                    pdf.setFont('Raleway-Bold', 'normal');
                    pdf.setFontSize(10);
                    pdf.text("Rearmable: ", 15, posicion + 48);
                    pdf.setFont('Raleway-Regular', 'normal');
                    pdf.text(rearmable + "", 38, posicion + 48);
                    pdf.line(103, posicion + 44, 103, posicion + 50);

                    //Nº Polos
                    pdf.setFont('Raleway-Bold', 'normal');
                    pdf.text("Nº Polos:", 105, posicion + 48);
                    pdf.setFont('Raleway-Regular', 'normal');
                    pdf.text(polaridad, 122, posicion + 48);

                    //Tensión
                    pdf.setFont('Raleway-Bold', 'normal');
                    pdf.text("Tensión de protección (Up): ", 15, posicion + 54);
                    pdf.setFont('Raleway-Regular', 'normal');
                    pdf.text(tension + "", 62, posicion + 54);
                    pdf.line(103, posicion + 50, 103, posicion + 56);

                    //Intensidad
                    pdf.setFont('Raleway-Bold', 'normal');
                    pdf.text("Intensidad (A):", 105, posicion + 54);
                    pdf.setFont('Raleway-Regular', 'normal');
                    pdf.text(intensidad, 131, posicion + 54);

                    //Sensibilidad
                    pdf.setFillColor(235, 235, 235);
                    pdf.rect(13, posicion + 56, 180, 6, 'F');
                    pdf.setFont('Raleway-Bold', 'normal');
                    pdf.text("Sensibilidad (mA): ", 15, posicion + 60);
                    pdf.setFont('Raleway-Regular', 'normal');
                    pdf.text(sensibilidad + "", 48, posicion + 60);
                    pdf.line(103, posicion + 56, 103, posicion + 62);

                    //Marca
                    pdf.setFont('Raleway-Bold', 'normal');
                    pdf.text("Marca:", 105, posicion + 60);
                    pdf.setFont('Raleway-Regular', 'normal');
                    pdf.text(marca, 118, posicion + 60);

                    //Poder de corte
                    pdf.setFont('Raleway-Bold', 'normal');
                    pdf.text("Poder de corte (kA): ", 15, posicion + 66);
                    pdf.setFont('Raleway-Regular', 'normal');
                    pdf.text("-", 50, posicion + 66);
                    pdf.line(103, posicion + 62, 103, posicion + 68);

                    //Corte omnipolar
                    pdf.setFont('Raleway-Bold', 'normal');
                    pdf.text("Corte omnipolar:", 105, posicion + 66);
                    pdf.setFont('Raleway-Regular', 'normal');
                    pdf.text("-", 135, posicion + 66);

                    //Cantidad
                    pdf.setFillColor(235, 235, 235);
                    pdf.rect(13, posicion + 68, 180, 6, 'F');
                    pdf.setFont('Raleway-Bold', 'normal');
                    pdf.text("Cantidad: ", 15, posicion + 72);
                    pdf.setFont('Raleway-Regular', 'normal');
                    pdf.text(cantidad + "", 33, posicion + 72);
                    pdf.line(103, posicion + 56, 103, posicion + 74);

                    posicion = posicion + 40;
                }

            });
        }

        //Para cada protección recibida del back
        if (res.datos.proteccion) {
            Object.entries(res.datos.proteccion).forEach(([key, value]) => {
                let meterBloque = true;
                let tipo = "-";
                let subtipo = "-";
                let rearmable = "-";
                let polaridad = "-";
                let tension = "-";
                let intensidad = "-";
                let sensibilidad = "-";
                let marca = "-";
                let cantidad = "-";

                // Datos para sobretensiones
                let intensidad_maxima = '-';
                let intensidad_nominal = '-';

                Object.entries(value).forEach(([k, v]) => {
                    if (k === "tipo") {
                        tipo = v;
                    }
                    if (k === "subtipo") {
                        subtipo = v;
                        if (subtipo === "INTERRUPTOR GENERAL") {
                            subtipo = "GENERAL";
                            meterBloque = false;
                        }
                    }
                    if (k === "rearmable") {
                        if (v === null) {
                            rearmable = "-";
                        } else if (v === false) {
                            rearmable = "No";
                        } else if (v === true) {
                            rearmable = "Sí";
                        } else {
                            rearmable = v;
                        }
                    }
                    if (k === "polaridad") {
                        if (v === null) {
                            polaridad = "-";
                        } else {
                            polaridad = v;
                        }
                    }
                    if (k === "tension_corte") {
                        if (v === null) {
                            tension = "-";
                        } else {
                            tension = v + " kV";
                        }
                    }
                    if (k === "intensidad") {
                        if (v === null) {
                            intensidad = "-";
                        } else {
                            intensidad = v;
                        }
                    }
                    if (k === "sensibilidad") {
                        if (v === null) {
                            sensibilidad = "-";
                        } else {
                            sensibilidad = v;
                        }
                    }
                    if (k === "marca") {
                        if (v === null) {
                            marca = "-";
                        } else {
                            marca = v;
                        }
                    }
                    if (k === "cantidad") {
                        if (v === null) {
                            cantidad = "-";
                        } else {
                            cantidad = v;
                        }
                    }
                    if (k === "intensidad_maxima") {
                        if (v === null) {
                            intensidad_maxima = "-";
                        } else {
                            intensidad_maxima = v + " kA";
                        }
                    }
                    if (k === "intensidad_nominal") {
                        if (v === null) {
                            intensidad_nominal = "-";
                        } else {
                            intensidad_nominal = v + " kA";
                        }
                    }
                });

                if (tipo === "GENERAL" && meterBloque) {
                    //Si el siguiente bloque se va a salir de la página, se crea una nueva
                    if (posicion >= 234) {
                        pdf.addPage();
                        this.añadirCabeceraAPdf(pdf);
                        this.añadirFooter(pdf);
                        posicion = 0;
                    }

                    pdf.setFont('Raleway-Bold', 'normal');
                    pdf.setFontSize(12);
                    if (subtipo === "SOBRETENSIÓN") {
                        pdf.text("PROTECCIÓN SOBRETENSIONES PERMANENTES Y TRANSITORIAS", 15, posicion + 42);
                    } else {
                        pdf.text("INTERRUPTOR " + subtipo, 15, posicion + 42);
                    }

                    //Rearmable
                    pdf.setFillColor(235, 235, 235);
                    pdf.rect(13, posicion + 44, 180, 6, 'F');
                    pdf.setFont('Raleway-Bold', 'normal');
                    pdf.setFontSize(10);
                    pdf.text("Rearmable: ", 15, posicion + 48);
                    pdf.setFont('Raleway-Regular', 'normal');
                    pdf.text(rearmable + "", 38, posicion + 48);
                    pdf.line(103, posicion + 44, 103, posicion + 50);

                    //Nº Polos
                    pdf.setFont('Raleway-Bold', 'normal');
                    pdf.text("Nº Polos:", 105, posicion + 48);
                    pdf.setFont('Raleway-Regular', 'normal');
                    pdf.text(polaridad, 122, posicion + 48);

                    //Tensión
                    pdf.setFont('Raleway-Bold', 'normal');
                    pdf.text("Tensión de protección (Up): ", 15, posicion + 54);
                    pdf.setFont('Raleway-Regular', 'normal');
                    pdf.text(tension, 62, posicion + 54);
                    pdf.line(103, posicion + 50, 103, posicion + 56);

                    //Intensidad
                    pdf.setFont('Raleway-Bold', 'normal');
                    pdf.text("Intensidad (A):", 105, posicion + 54);
                    pdf.setFont('Raleway-Regular', 'normal');
                    pdf.text(intensidad, 131, posicion + 54);

                    //Sensibilidad
                    pdf.setFillColor(235, 235, 235);
                    pdf.rect(13, posicion + 56, 180, 6, 'F');
                    pdf.setFont('Raleway-Bold', 'normal');
                    pdf.text("Sensibilidad (mA): ", 15, posicion + 60);
                    pdf.setFont('Raleway-Regular', 'normal');
                    pdf.text(sensibilidad + "", 48, posicion + 60);
                    pdf.line(103, posicion + 56, 103, posicion + 62);

                    //Marca
                    pdf.setFont('Raleway-Bold', 'normal');
                    pdf.text("Marca:", 105, posicion + 60);
                    pdf.setFont('Raleway-Regular', 'normal');
                    pdf.text(marca, 118, posicion + 60);

                    //Poder de corte
                    pdf.setFont('Raleway-Bold', 'normal');
                    pdf.text("Poder de corte (kA): ", 15, posicion + 66);
                    pdf.setFont('Raleway-Regular', 'normal');
                    pdf.text("-", 50, posicion + 66);
                    pdf.line(103, posicion + 62, 103, posicion + 68);

                    //Al interruptor magnetotérmico, se le añadirá corte omnipolar
                    if (subtipo === "MAGNETOTÉRMICO") {
                        //Corte omnipolar
                        pdf.setFont('Raleway-Bold', 'normal');
                        pdf.text("Corte omnipolar:", 105, posicion + 66);
                        pdf.setFont('Raleway-Regular', 'normal');
                        pdf.text("-", 135, posicion + 66);
                    }
                    
                    if (subtipo === "SOBRETENSIÓN"){
                        // Intensidad Nominal
                        pdf.setFont('Raleway-Bold', 'normal');
                        pdf.text("Intensidad descarga nominal (In):", 105, posicion + 66);
                        pdf.setFont('Raleway-Regular', 'normal');
                        pdf.text(intensidad_nominal, 162, posicion + 66);

                        // Intensidad máxima
                        pdf.setFillColor(235, 235, 235);
                        pdf.rect(13, posicion + 68, 180, 6, 'F');
                        pdf.setFont('Raleway-Bold', 'normal');
                        pdf.text("Intensidad salida máxima (Imax): ", 15, posicion + 72);
                        pdf.setFont('Raleway-Regular', 'normal');
                        pdf.text(intensidad_maxima, 71, posicion + 72);
                        pdf.line(103, posicion + 68, 103, posicion + 74);

                        // Cantidad
                        pdf.setFont('Raleway-Bold', 'normal');
                        pdf.text("Cantidad:", 105, posicion + 72);
                        pdf.setFont('Raleway-Regular', 'normal');
                        pdf.text(cantidad + "", 123, posicion + 72);
                    }
                    else {
                        // Cantidad
                        pdf.setFillColor(235, 235, 235);
                        pdf.rect(13, posicion + 68, 180, 6, 'F');
                        pdf.setFont('Raleway-Bold', 'normal');
                        pdf.text("Cantidad: ", 15, posicion + 72);
                        pdf.setFont('Raleway-Regular', 'normal');
                        pdf.text(cantidad + "", 33, posicion + 72);
                        pdf.line(103, posicion + 68, 103, posicion + 74);
                    }

                    posicion = posicion + 40;


                }
            });
        }

        posicion = posicion + 35;
        //Si el siguiente bloque se va a salir de la página, se crea una nueva
        if (posicion >= 236) {
            pdf.addPage();
            this.añadirCabeceraAPdf(pdf);
            this.añadirFooter(pdf);
            posicion = 0;
        }

        //REGULADOR EN CABECERA
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.setFontSize(12);
        pdf.text("REGULADOR EN CABECERA", 15, posicion + 7);

        //Tipo
        pdf.setFillColor(235, 235, 235);
        pdf.rect(13, posicion + 10, 180, 6, 'F');
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.setFontSize(10);
        pdf.text("Tipo: ", 15, posicion + 14);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text(this.tipoRegulacion, 30, posicion + 14);
        pdf.line(103, posicion + 10, 103, posicion + 16);

        //Marca
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Marca:", 105, posicion + 14);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text(this.marcaRegulacion, 122, posicion + 14);

        this.añadirProteccionesManiobra(pdf, res, posicion);
    }

    //Protecciones generales
    añadirProteccionesManiobra(pdf: jsPDF, res: any, posicion: number) {

        //Si el siguiente bloque se va a salir de la página, se crea una nueva
        if (posicion >= 226) {
            pdf.addPage();
            this.añadirCabeceraAPdf(pdf);
            this.añadirFooter(pdf);
            posicion = 0;
        }

        pdf.setFontSize(14);
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Protecciones de maniobra", 10, posicion + 35);


        //Para cada protección recibida del back
        if (res.datos.proteccion) {
            Object.entries(res.datos.proteccion).forEach(([key, value]) => {
                let tipo = "-";
                let subtipo = "-";
                let rearmable = "-";
                let polaridad = "-";
                let tension = "-";
                let intensidad = "-";
                let sensibilidad = "-";
                let marca = "-";
                let cantidad = "-";

                Object.entries(value).forEach(([k, v]) => {
                    if (k === "tipo") {
                        tipo = v;
                    }
                    if (k === "subtipo") {
                        subtipo = v;
                    }
                    if (k === "rearmable") {
                        if (v === null) {
                            rearmable = "-";
                        } else if (v === false) {
                            rearmable = "No";
                        } else if (v === true) {
                            rearmable = "Sí";
                        } else {
                            rearmable = v;
                        }
                    }
                    if (k === "polaridad") {
                        if (v === null) {
                            polaridad = "-";
                        } else {
                            polaridad = v;
                        }
                    }
                    if (k === "tension_corte") {
                        if (v === null) {
                            tension = "-";
                        } else {
                            tension = v + " kV";
                        }
                    }
                    if (k === "intensidad") {
                        if (v === null) {
                            intensidad = "-";
                        } else {
                            intensidad = v;
                        }
                    }
                    if (k === "sensibilidad") {
                        if (v === null) {
                            sensibilidad = "-";
                        } else {
                            sensibilidad = v;
                        }
                    }
                    if (k === "marca") {
                        if (v === null) {
                            marca = "-";
                        } else {
                            marca = v;
                        }
                    }
                    if (k === "cantidad") {
                        if (v === null) {
                            cantidad = "-";
                        } else {
                            cantidad = v;
                        }
                    }
                });


                if (tipo === "MANIOBRA") {
                    //Si el siguiente bloque se va a salir de la página, se crea una nueva
                    if (posicion >= 226) {
                        pdf.addPage();
                        this.añadirCabeceraAPdf(pdf);
                        this.añadirFooter(pdf);
                        posicion = -7;
                    }

                    pdf.setFont('Raleway-Bold', 'normal');
                    pdf.setFontSize(12);
                    pdf.text("INTERRUPTOR " + subtipo, 15, posicion + 42);

                    //Rearmable
                    pdf.setFillColor(235, 235, 235);
                    pdf.rect(13, posicion + 44, 180, 6, 'F');
                    pdf.setFont('Raleway-Bold', 'normal');
                    pdf.setFontSize(10);
                    pdf.text("Rearmable: ", 15, posicion + 48);
                    pdf.setFont('Raleway-Regular', 'normal');
                    pdf.text(rearmable + "", 38, posicion + 48);
                    pdf.line(103, posicion + 44, 103, posicion + 50);

                    //Nº Polos
                    pdf.setFont('Raleway-Bold', 'normal');
                    pdf.text("Nº Polos:", 105, posicion + 48);
                    pdf.setFont('Raleway-Regular', 'normal');
                    pdf.text(polaridad, 122, posicion + 48);

                    //Tensión
                    pdf.setFont('Raleway-Bold', 'normal');
                    pdf.text("Tensión de protección (Up): ", 15, posicion + 54);
                    pdf.setFont('Raleway-Regular', 'normal');
                    pdf.text(tension, 62, posicion + 54);
                    pdf.line(103, posicion + 50, 103, posicion + 56);

                    //Intensidad
                    pdf.setFont('Raleway-Bold', 'normal');
                    pdf.text("Intensidad (A):", 105, posicion + 54);
                    pdf.setFont('Raleway-Regular', 'normal');
                    pdf.text(intensidad, 131, posicion + 54);

                    //Sensibilidad
                    pdf.setFillColor(235, 235, 235);
                    pdf.rect(13, posicion + 56, 180, 6, 'F');
                    pdf.setFont('Raleway-Bold', 'normal');
                    pdf.text("Sensibilidad (mA): ", 15, posicion + 60);
                    pdf.setFont('Raleway-Regular', 'normal');
                    pdf.text(sensibilidad + "", 48, posicion + 60);
                    pdf.line(103, posicion + 56, 103, posicion + 62);

                    //Marca
                    pdf.setFont('Raleway-Bold', 'normal');
                    pdf.text("Marca:", 105, posicion + 60);
                    pdf.setFont('Raleway-Regular', 'normal');
                    pdf.text(marca, 118, posicion + 60);

                    //Poder de corte
                    pdf.setFont('Raleway-Bold', 'normal');
                    pdf.text("Poder de corte (kA): ", 15, posicion + 66);
                    pdf.setFont('Raleway-Regular', 'normal');
                    pdf.text("-", 50, posicion + 66);
                    pdf.line(103, posicion + 62, 103, posicion + 68);              

                    //Cantidad
                    pdf.setFillColor(235, 235, 235);
                    pdf.rect(13, posicion + 68, 180, 6, 'F');
                    pdf.setFont('Raleway-Bold', 'normal');
                    pdf.text("Cantidad: ", 15, posicion + 72);
                    pdf.setFont('Raleway-Regular', 'normal');
                    pdf.text(cantidad + "", 33, posicion + 72);
                    pdf.line(103, posicion + 56, 103, posicion + 74);

                    posicion = posicion + 40;
                }
            });
        }

        //Añadimos las medidas generales
        this.añadirMediciones(pdf, posicion + 10);
    }

    //Medidas generales
    añadirMediciones(pdf: jsPDF, posicion: number) {

        //Si el siguiente bloque se va a salir de la página, se crea una nueva
        if (posicion > 260) {
            pdf.addPage();
            this.añadirCabeceraAPdf(pdf);
            this.añadirFooter(pdf);
            posicion = 0;
        }

        pdf.setFont('Raleway-Bold', 'normal');
        pdf.setFontSize(14);
        pdf.text("Medidas generales", 10, posicion + 35);

        //Fase R
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.setFontSize(12);
        pdf.text("Fase R", 15, posicion + 42);

        //Tensión
        pdf.setFillColor(235, 235, 235);
        pdf.rect(13, posicion + 44, 180, 6, 'F');
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.setFontSize(10);
        pdf.text("Tensión (V): ", 15, posicion + 48);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text(this.tensionFaseR, 36, posicion + 48);
        pdf.line(103, posicion + 44, 103, posicion + 50);

        //Intensidad
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Intensidad (A):", 105, posicion + 48);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text(this.intensidadFaseR, 131, posicion + 48);

        //Potencia activa
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Potencia activa (W): ", 15, posicion + 54);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text(this.potenciaActivaFaseR + "", 51, posicion + 54);
        pdf.line(103, posicion + 50, 103, posicion + 56);

        //Potencia reactiva
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Potencia reactiva:", 105, posicion + 54);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text(this.potenciaReactivaFaseR, 138, posicion + 54);

        //Potencia aparente
        pdf.setFillColor(235, 235, 235);
        pdf.rect(13, posicion + 56, 180, 6, 'F');
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Potencia aparente: ", 15, posicion + 60);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text(this.potenciaAparenteFaseR, 50, posicion + 60);
        pdf.line(103, posicion + 56, 103, posicion + 62);

        //Factor de potencia
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Factor de potencia:", 105, posicion + 60);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text(this.factorPotenciaFaseR, 141, posicion + 60);

        posicion = posicion + 60;

        //Si el siguiente bloque se va a salir de la página, se crea una nueva
        if (posicion > 270) {
            pdf.addPage();
            this.añadirCabeceraAPdf(pdf);
            this.añadirFooter(pdf);
            posicion = 26;
        }

        //Fase S
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.setFontSize(12);
        pdf.text("Fase S", 15, posicion + 9);

        //Tensión
        pdf.setFillColor(235, 235, 235);
        pdf.rect(13, posicion + 11, 180, 6, 'F');
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.setFontSize(10);
        pdf.text("Tensión (V): ", 15, posicion + 15);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text(this.tensionFaseS, 36, posicion + 15);
        pdf.line(103, posicion + 11, 103, posicion + 17);

        //Intensidad
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Intensidad (A):", 105, posicion + 15);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text(this.intensidadFaseS, 131, posicion + 15);

        //Potencia activa
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Potencia activa (W): ", 15, posicion + 21);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text(this.potenciaActivaFaseS + "", 51, posicion + 21);
        pdf.line(103, posicion + 17, 103, posicion + 22);

        //Potencia reactiva
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Potencia reactiva:", 105, posicion + 21);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text(this.potenciaReactivaFaseS, 138, posicion + 21);

        //Potencia aparente
        pdf.setFillColor(235, 235, 235);
        pdf.rect(13, posicion + 23, 180, 6, 'F');
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Potencia aparente: ", 15, posicion + 27);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text(this.potenciaAparenteFaseS, 50, posicion + 27);
        pdf.line(103, posicion + 23, 103, posicion + 29);

        //Factor de potencia
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Factor de potencia:", 105, posicion + 27);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text(this.factorPotenciaFaseS, 141, posicion + 27);

        posicion = posicion + 30;

        //Si el siguiente bloque se va a salir de la página, se crea una nueva
        if (posicion > 270) {
            pdf.addPage();
            this.añadirCabeceraAPdf(pdf);
            this.añadirFooter(pdf);
            posicion = 26;
        }

        //Fase T
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.setFontSize(12);
        pdf.text("Fase T", 15, posicion + 9);

        //Tensión
        pdf.setFillColor(235, 235, 235);
        pdf.rect(13, posicion + 11, 180, 6, 'F');
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.setFontSize(10);
        pdf.text("Tensión (V): ", 15, posicion + 15);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text(this.tensionFaseT, 36, posicion + 15);
        pdf.line(103, posicion + 11, 103, posicion + 17);

        //Intensidad
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Intensidad (A):", 105, posicion + 15);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text(this.intensidadFaseT, 131, posicion + 15);

        //Potencia activa
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Potencia activa (W): ", 15, posicion + 21);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text(this.potenciaActivaFaseT + "", 51, posicion + 21);
        pdf.line(103, posicion + 17, 103, posicion + 23);

        //Potencia reactiva
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Potencia reactiva:", 105, posicion + 21);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text(this.potenciaReactivaFaseT, 138, posicion + 21);

        //Potencia aparente
        pdf.setFillColor(235, 235, 235);
        pdf.rect(13, posicion + 23, 180, 6, 'F');
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Potencia aparente: ", 15, posicion + 27);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text(this.potenciaAparenteFaseT, 50, posicion + 27);
        pdf.line(103, posicion + 23, 103, posicion + 29);

        //Factor de potencia
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Factor de potencia:", 105, posicion + 27);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text(this.factorPotenciaFaseT, 141, posicion + 27);

        posicion = posicion + 30;

        //Si el siguiente bloque se va a salir de la página, se crea una nueva
        if (posicion > 270) {
            pdf.addPage();
            this.añadirCabeceraAPdf(pdf);
            this.añadirFooter(pdf);
            posicion = 26;
        }

        //Total
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.setFontSize(12);
        pdf.text("Total", 15, posicion + 9);

        //Potencia activa total (W)
        pdf.setFillColor(235, 235, 235);
        pdf.rect(13, posicion + 11, 180, 6, 'F');
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.setFontSize(10);
        pdf.text("Potencia activa total (W): ", 15, posicion + 15);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text(this.potenciaActivaTotal, 60, posicion + 15);
        pdf.line(103, posicion + 11, 103, posicion + 17);

        //Potencia reactiva total (VAr)
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Potencia reactiva total (VAr):", 105, posicion + 15);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text(+this.potenciaReactivaFaseR + +this.potenciaReactivaFaseS + +this.potenciaReactivaFaseT + "", 156, posicion + 15);

        //Potencia aparente total
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Potencia aparente total (VA): ", 15, posicion + 21);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text(this.potenciaAparenteTotal + "", 66, posicion + 21);
        pdf.line(103, posicion + 17, 103, posicion + 23);

        //Factor de potencia total
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Factor de potencia total:", 105, posicion + 21);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text("-", 153, posicion + 21);

        //Intensidad neutra (A)
        pdf.setFillColor(235, 235, 235);
        pdf.rect(13, posicion + 23, 180, 6, 'F');
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Intensidad neutra (A): ", 15, posicion + 27);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text(this.intensidadNeutra, 54, posicion + 27);
        pdf.line(103, posicion + 23, 103, posicion + 29);

        //Observaciones
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Observaciones: ", 15, posicion + 34);
        pdf.setFont('Raleway-Regular', 'normal');
        //Si observaciones es demasiado largo, lo vamos separando en líneas de 60 caracteres (máximo 3 líneas)
        if (this.observacionesMediciones.length <= 60) { //60
            pdf.text(this.observacionesMediciones, 44, posicion + 34);
        } else if (this.observacionesMediciones.length > 60 && this.observacionesMediciones.length <= 120) {
            pdf.text(this.observacionesMediciones.substring(0, 60), 44, posicion + 34);
            pdf.text(this.observacionesMediciones.substring(60), 44, posicion + 40);
        } else if (this.observacionesMediciones.length > 120) {
            pdf.text(this.observacionesMediciones.substring(0, 60), 44, posicion + 34);
            pdf.text(this.observacionesMediciones.substring(60, 120), 44, posicion + 40);
            pdf.text(this.observacionesMediciones.substring(120, 180), 44, posicion + 46);
        }

        posicion = posicion + 40;

        //Si el siguiente bloque se va a salir de la página, se crea una nueva
        if (posicion > 280) {
            pdf.addPage();
            this.añadirCabeceraAPdf(pdf);
            this.añadirFooter(pdf);
            posicion = 26;
        }

        //Batería de condensadores
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.setFontSize(14);
        pdf.text("Batería de condensadores", 10, posicion + 9);

        //Existencia
        pdf.setFillColor(235, 235, 235);
        pdf.rect(13, posicion + 11, 180, 6, 'F');
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.setFontSize(10);
        pdf.text("Existencia: ", 15, posicion + 15);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text("-", 35, posicion + 15);
        pdf.line(103, posicion + 11, 103, posicion + 17);

        //Potencia reactiva total (kVAr)
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Potencia reactiva total (kVAr):", 105, posicion + 15);
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.text("-", 157, posicion + 15);
    }

    //Footer
    añadirFooter(pdf: jsPDF) {
        //Footer
        pdf.setFont('Raleway-Regular', 'normal');
        pdf.setFontSize(9);
        pdf.text(pdf.getCurrentPageInfo().pageNumber + "", pdf.internal.pageSize.width - 10, pdf.internal.pageSize.height - 10);
    }

    //Anexo
    private async añadirAnexo(pdf: jsPDF, fotoPosicion: number):Promise<void>
    {
        let foto = this.arrayFotos[fotoPosicion];

        let numeroFoto: number = fotoPosicion + 1;

        pdf.addPage();
        this.añadirCabeceraAPdf(pdf);
        this.añadirFooter(pdf);
        pdf.setFontSize(14);
        pdf.setFont('Raleway-Bold', 'normal');
        pdf.text("Anexo. Foto " + numeroFoto, 10, 35);

        //Comprobamos el aspect ratio de la foto, y la redimensionamos
        let img = new Image();

        img.src = foto;

        await new Promise<void>(resolve => img.onload = () => resolve());

        let anchoFoto = 200;
        let altoFoto = (img.height * anchoFoto) / img.width;
        let margenIzquierdo = (pdf.internal.pageSize.getWidth() - anchoFoto) / 2;

        if (altoFoto > 250)
        {
            altoFoto = 220;
            anchoFoto = (img.width * altoFoto) / img.height;
            margenIzquierdo = (pdf.internal.pageSize.getWidth() - anchoFoto) / 2;
        }

        pdf.addImage(foto, margenIzquierdo, 40, anchoFoto, altoFoto);

        //Si hay más fotos, seguimos añadiéndolas
        if (this.arrayFotos.length > fotoPosicion + 1)
        {
            await this.añadirAnexo(pdf, fotoPosicion + 1);
        } 
        else
        {
            //Si no hay más fotos

            //Antes de guardar el pd, enlazamos las fotos con sus miniaturas de la segunda página
            pdf.setPage(this.paginaConFotosActual);

            if (this.arrayFotos.length === 1)
            {
                pdf.link(4, 129, 66, 66, { pageNumber: pdf.getNumberOfPages() });
            }
            else if (this.arrayFotos.length === 2)
            {
                pdf.link(4, 129, 66, 66, { pageNumber: pdf.getNumberOfPages() - 1 });
                pdf.link(72, 129, 66, 66, { pageNumber: pdf.getNumberOfPages() });
            } 
            else if (this.arrayFotos.length === 3)
            {
                pdf.link(4, 129, 66, 66, { pageNumber: pdf.getNumberOfPages() - 2 });
                pdf.link(72, 129, 66, 66, { pageNumber: pdf.getNumberOfPages() - 1 });
                pdf.link(140, 129, 66, 66, { pageNumber: pdf.getNumberOfPages() });
            }

            //Guardamos el index del centro de mando actual en el array de centros de mando seleccionados
            let indexActual: number = this.centros_mando_seleccionados.indexOf(this.numeroCuadro);

            //Si todavía no es el último centro de mando del array
            if (indexActual + 1 < this.centros_mando_seleccionados.length)
            {
                //Obtenemos el nombre del siguiente centro de mando
                let siguienteCM = this.centros_mando_seleccionados[indexActual + 1];

                //Llamamos a la función para crear otra ficha
                await this.fichaCentroMando(siguienteCM, pdf);
            }
            else
            {
                //Si es el último centro de mando
                pdf.save('FichasCentroMando.pdf');

                this._spinnerService.hide();
                this._spinnerService.cleanText();
            }
        }
       
    }

    //Función que recogerá los datos recibidos del backend
    rellenarDatosCM(res: any, cm: string) {

        //Reseteamos las variables
        this.reiniciarValoresCM();

        this.numeroCuadro = cm;

        if (res.datos.caja_proteccion) {
            //Recorremos el diccionario de caja de protección
            Object.entries(res.datos.caja_proteccion).forEach(([key, value]) => {
                Object.entries(value).forEach(([k, v]) => {
                    if (k === "situacion") {
                        this.situacionCajaProteccion = v;
                    }
                    if (k === "grado_proteccion_ip") {
                        this.proteccionIp = v;
                    }
                    if (k === "grado_proteccion_ik") {
                        this.proteccionIk = v;
                    }
                    if (k === "alto") {
                        this.altoCuadroProteccion = v;
                    }
                    if (k === "ancho") {
                        this.anchoCuadroProteccion = v;
                    }
                    if (k === "profundidad") {
                        this.fondoCuadroProteccion = v;
                    }
                    if (k === "material") {
                        this.materialCajaProteccion = v;
                    }
                });
            });
        }
        //Recorremos el diccionario de puesta a tierra
        this.existenciaPuestaTierra = "No";
        if (res.datos.puesta_tierra) {
            Object.entries(res.datos.puesta_tierra).forEach(([key, value]) => {
                Object.entries(value).forEach(([k, v]) => {
                    this.existenciaPuestaTierra = "Si"; //Si entra al diccionario, es porque existe puesta a tierra
                    if (k === "tipo") {
                        this.tipoPuestaTierra = v + "";
                    }
                    if (k === "resistencia") {
                        this.resistenciaPuestaTierra = v + "";
                    }
                    if (k === "seccion") {
                        this.seccionPuestaTierra = v + "";
                    }
                });
            });
        }

        //Recogemos las fotos
        this.arrayFotos = [];
        if (res.datos.fotos) {
            Object.entries(res.datos.fotos).forEach(([key, value]) => {
                //Guardaremos como máximo 3 fotos
                if (this.arrayFotos.length < 3) {
                    //Comprobamos si la imagen existe, en cuyo caso la añadimos al array
                    let image = new Image();
                    image.src = value + "";
                    image.onload = () => {
                        this.arrayFotos.push(value + "");
                    };
                }
            });
        }

        if (res.datos.info) {
            //Recorremos el diccionario de información general
            Object.entries(res.datos.info).forEach(([key, value]) => {
                if (key === "localizacion") {
                    this.localizacionCM = value + "";
                }
                if (key === "estado") {
                    this.estadoCM = value + "";
                }
                if (key === "modulo_medida") {
                    this.numeroSuministro = value + "";
                }
                if (key === "tension") {
                    this.tension = value + "";
                }
                if (key === "fecha_instalacion") {
                    this.fechaInstalacionCM = value + "";
                }
                if (key === "horas_dia") {
                    this.horasDia = value + "";
                }
                if (key === "horas_ahorro") {
                    this.horasAhorro = value + "";
                }
                if (key === "hora_inicio") {
                    this.horaInicio = value + "";
                }
                if (key === "hora_fin") {
                    this.horaFin = value + "";
                }
                if (key === "observaciones") {
                    this.observaciones = value + "";
                }
                if (key === "nombre_via") {
                    this.direccion = value + "";
                }
                if (key === "coordenadas") {
                    this.coordenadas = value + "";

                    let coordX: number = +this.coordenadas.split(',')[0];
                    let coordY: number = +this.coordenadas.split(',')[1];

                    this.coordenadas = coordX.toLocaleString() + " ; " + coordY.toLocaleString();
                }
                if (key === "seccion_acometida") {
                    this.seccionAcometida = value + "";
                }

                if (key === "tipo_regulacion") {
                    this.tipoRegulacion = value + "";
                }
                if (key === "marca_regulacion") {
                    this.marcaRegulacion = value + "";
                }
                if (key === "tipo_telegestion") {
                    this.tipoTelegestion = value + "";
                }
                if (key === "marca_telegestion") {
                    this.marcaTelegestion = value + "";
                }
                if (key === "tipo_reloj") {
                    this.tipoReloj = value + "";
                }
                if (key === "marca_reloj") {
                    this.marcaReloj = value + "";
                }
                if (key === "interruptor_manual") {
                    if (value === true) {
                        this.tipoInterruptorManual = "Sí";
                    } else {
                        this.tipoInterruptorManual = "No";
                    }
                }
                if (key === "marca_interruptor_manual") {
                    this.marcaInterruptorManual = value + "";
                }
                if (key === "celula") {
                    if (value === true) {
                        this.tipoCelula = "Sí";
                    } else {
                        this.tipoCelula = "No";
                    }
                }
                if (key === "marca_celula") {
                    this.marcaCelula = value + "";
                }
                if (key === "numero_contador") {
                    this.numeroContador = value + "";
                }
            });
        }

        let potActivaR = 0;
        let potReactivaR = 0;
        let potActivaS = 0;
        let potReactivaS = 0;
        let potActivaT = 0;
        let potReactivaT = 0;
        if (res.datos.medicion) {
            //Recorremos el diccionario de mediciones
            Object.entries(res.datos.medicion).forEach(([key, value]) => {
                Object.entries(value).forEach(([k, v]) => {
                    if (k === "tension_normal_vrs") {
                        this.tensionFaseR = v + "";
                    }
                    if (k === "intensidad_normal_fase_r") {
                        this.intensidadFaseR = v + "";
                    }
                    if (k === "potencia_normal_fase_r") {
                        this.potenciaActivaFaseR = v + "";
                        potActivaR = v;
                    }
                    if (k === "reactiva_normal_fase_r") {
                        this.potenciaReactivaFaseR = v + "";
                        potReactivaR = v;
                    }
                    if (k === "factor_potencia_normal_fase_r") {
                        this.factorPotenciaFaseR = v + "";
                    }

                    if (k === "tension_normal_vst") {
                        this.tensionFaseS = v + "";
                    }
                    if (k === "intensidad_normal_fase_s") {
                        this.intensidadFaseS = v + "";
                    }
                    if (k === "potencia_normal_fase_s") {
                        this.potenciaActivaFaseS = v + "";
                        potActivaS = v;
                    }
                    if (k === "reactiva_normal_fase_s") {
                        this.potenciaReactivaFaseS = v + "";
                        potReactivaS = v;
                    }
                    if (k === "factor_potencia_normal_fase_s") {
                        this.factorPotenciaFaseS = v + "";
                    }

                    if (k === "tension_normal_vtr") {
                        this.tensionFaseT = v + "";
                    }
                    if (k === "intensidad_normal_fase_t") {
                        this.intensidadFaseT = v + "";
                    }
                    if (k === "potencia_normal_fase_t") {
                        this.potenciaActivaFaseT = v + "";
                        potActivaT = v;
                    }
                    if (k === "reactiva_normal_fase_t") {
                        this.potenciaReactivaFaseT = v + "";
                        potReactivaT = v;
                    }
                    if (k === "factor_potencia_normal_fase_t") {
                        this.factorPotenciaFaseT = v + "";
                    }
                    if (k === "reactiva_total") {
                        this.potenciaReactivaTotal = v + "";
                    }
                    if (k === "intensidad_neutra_general") {
                        this.intensidadNeutra = v + "";
                    }
                    if (k === "observaciones") {
                        if (v === null) {
                            this.observacionesMediciones = "-";
                        } else {
                            this.observacionesMediciones = v + "";
                        }
                    }
                });
            });
        }
        //Caculamos la potencia aparente de las 3 fases (raíz cuadrada de la suma de las potencias)
        this.potenciaAparenteFaseR = Math.sqrt(Math.pow(potActivaR, 2) + Math.pow(potReactivaR, 2)).toLocaleString();
        this.potenciaAparenteFaseS = Math.sqrt(Math.pow(potActivaS, 2) + Math.pow(potReactivaS, 2)).toLocaleString();
        this.potenciaAparenteFaseT = Math.sqrt(Math.pow(potActivaT, 2) + Math.pow(potReactivaT, 2)).toLocaleString();

        //Calculamos la potencia activa total y aparente
        this.potenciaActivaTotal = potActivaR + potActivaS + potActivaT + "";
        this.potenciaAparenteTotal = Math.sqrt(Math.pow(+this.potenciaActivaTotal, 2) + Math.pow(+this.potenciaReactivaTotal, 2)) + "";
    }

    //Reseteamos la variables del centro de mando
    reiniciarValoresCM() {

        this.localizacionCM = "-";
        this.estadoCM = "-";
        this.numeroSuministro = "-";
        this.numeroContador = "-";
        this.tension = "-";
        this.fechaInstalacionCM = "-";
        this.horasDia = "-";
        this.horasAhorro = "-";
        this.horaInicio = "-";
        this.horaFin = "-";
        this.observaciones = "-";
        this.direccion = "-";
        this.coordenadas = "-";
        this.numeroCups = "-";
        this.seccionAcometida = "-";
        this.situacionCajaProteccion = "";
        this.proteccionIp = "-";
        this.proteccionIk = "-";
        this.altoCuadroProteccion = "-";
        this.anchoCuadroProteccion = "-";
        this.fondoCuadroProteccion = "-";
        this.materialCajaProteccion = "-";
        this.existenciaPuestaTierra = "-";
        this.tipoPuestaTierra = "-";
        this.resistenciaPuestaTierra = "-";
        this.seccionPuestaTierra = "-";
        this.arrayFotos = [];

        this.tipoRegulacion = "-";
        this.marcaRegulacion = "-";
        this.tipoTelegestion = "-";
        this.marcaTelegestion = "-";
        this.tipoReloj = "-";
        this.marcaReloj = "-";
        this.tipoInterruptorManual = "-";
        this.marcaInterruptorManual = "-";
        this.tipoCelula = "-";
        this.marcaCelula = "-";

        this.tensionFaseR = "-";
        this.intensidadFaseR = "-";
        this.potenciaActivaFaseR = "-";
        this.potenciaReactivaFaseR = "-";
        this.potenciaAparenteFaseR = "-";
        this.factorPotenciaFaseR = "-";

        this.tensionFaseS = "-";
        this.intensidadFaseS = "-";
        this.potenciaActivaFaseS = "-";
        this.potenciaReactivaFaseS = "-";
        this.potenciaAparenteFaseS = "-";
        this.factorPotenciaFaseS = "-";

        this.tensionFaseT = "-";
        this.intensidadFaseT = "-";
        this.potenciaActivaFaseT = "-";
        this.potenciaReactivaFaseT = "-";
        this.potenciaAparenteFaseT = "-";
        this.factorPotenciaFaseT = "-";

        this.potenciaActivaTotal = "-";
        this.potenciaReactivaTotal = "-";
        this.potenciaAparenteTotal = "-";
        this.intensidadNeutra = "-";
        this.observacionesMediciones = "-";
    }

}