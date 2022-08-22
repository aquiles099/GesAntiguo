import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ConfiguracionDeProyecto, InformacionDeModulos, Project } from '../../interfaces/project';
import proj4 from 'proj4';
import { environment } from '../../../environments/environment';
import { polygon } from '@turf/helpers';
import { invertGeometry } from '../../shared/helpers';
import booleanWithin from '@turf/boolean-within';
import { ObjectUtility } from '../../shared/object-utility';
import { ApiService } from '../api.service';

@Injectable({
  providedIn: "root"
})
export class ProjectService {

  private projectSubject:BehaviorSubject<Project>;
  public projectObservable:Observable<Project>;

  public configuration:ConfiguracionDeProyecto = null;

  public moduleInformation:InformacionDeModulos;

  public layerStyles:{[layerStructure:string]:string};

  constructor(
    private _apiService:ApiService,
  )
  {
    this.projectSubject = new BehaviorSubject(null);
    this.projectObservable = this.projectSubject.asObservable();
    this.initiate();
  }

  get isStarted():boolean
  {
    return this.project  !== null && this.configuration !== null;
  }

  private initiate():void
  {
    if( localStorage.getItem("project") )
      this.projectSubject.next( JSON.parse(localStorage.getItem("project")) );
  }

  public next(project:Project):void
  {
    localStorage.setItem("project", JSON.stringify(project));
    this.projectSubject.next(ObjectUtility.simpleCloning(project));
  }

  get project():Project
  {
    return this.projectSubject.getValue();
  }
  
  get bbox():number[][]
  {
    return [
      (this.configuration.bbox as number[]).slice(0,2).reverse(),
      (this.configuration.bbox as number[]).slice(2,4).reverse()
    ]; 
  }

  get baseUrl():string
  {
    return this.project.url_base.split('wms?')[0] + "wms?";
  }

  get province():string
  {
    let province = this.configuration?.datos_municipio.provincia;

    if( province === "Illes Balears")
        province = "Baleares"
        
    return province;
  }

  public async loadInformationAndConfiguration():Promise<void>
  {
    try
    {
      await this.loadInformation();
      await this.loadConfiguration();
    }
    catch (error)
    {
      throw error;
    }
  }

  public async loadInformation():Promise<void>
  {
    try
    {
      const data = (await  this._apiService.postWithAuthentication({
        funcion: "web_configurar_proyecto_informacion",
        id_proyecto: this.project.id_proyecto
      })).datos;

      this.setConfiguration( data );
    }
    catch (error)
    {
      throw error;
    }
  }

  public async loadConfiguration():Promise<void>
  {
    try
    {
      this.moduleInformation = (await this._apiService.postWithAuthentication({
        funcion: "informacion_modulos_proyecto",
        id_proyecto: this.project.id_proyecto,
      }));
      
      this.layerStyles = this.moduleInformation.estilos;
    }
    catch (error)
    {
      throw error;
    }
  }

  public setConfiguration(data:any):void
  {
    this.configuration = data;
  }

  public checkIfTheFeaturesAreWithinTheMunicipality(features:any[]):boolean
  {
    const municipalityPolygon = polygon( this.getMunicipalityGeometry() );

    return features.every(
      feature => {

        const featureGeometry = invertGeometry( feature );

        let elementIsWithinTheMunicipality;

        switch (feature.geometry.type)
        {
          case "Point":
          case "Polygon":
            elementIsWithinTheMunicipality = booleanWithin( 
              {type: feature.geometry.type, coordinates: featureGeometry}, municipalityPolygon 
            );
            break;
          // en caso de linea y multilinea se debe hacer comprobacion llevandolos a puntos
          // debido a comportamiento extraño en funcion "booleanWithin".
          case "LineString":
            elementIsWithinTheMunicipality = featureGeometry.every(
              point => booleanWithin( { type: "Point", coordinates: point }, municipalityPolygon )
            );
            break;
          case "MultiLineString":
            elementIsWithinTheMunicipality = featureGeometry.every(
              points => points.every(
                point => booleanWithin( { type: "Point", coordinates: point }, municipalityPolygon )
              )
            );
            break;
          //
          case "MultiPolygon":
            elementIsWithinTheMunicipality = featureGeometry.every(
              pointListingArray => pointListingArray.every(
                points => booleanWithin( { type: "LineString", coordinates: points }, municipalityPolygon )
              )
            )
            break;
        }

        return elementIsWithinTheMunicipality;
      }
    );

  }

  public getMunicipalityGeometry():number[][][]
  {
    let start = 15, // "MULTIPOLYGON(((" = posicion 15 en cadena.
        end = this.configuration.datos_municipio.geometria.indexOf(")"); // 1er parentesis de cierre en cadena.

    // devolver arreglo de puntos dentro de [] (como multipoligono).
    return [this.configuration.datos_municipio.geometria
                .substring(start, end)
                .split(",")
                .map(
                  pointInString => pointInString.split(" ").map(coordInString => Number.parseFloat(coordInString))
                )
                .map(
                  point => proj4(
                    this.configuration.datos_municipio.nombre_proj4,
                    environment.defaultProj4Crs,
                    point
                  )
                  .reverse()
                )];
  }

  public clear():void
  {
    this.next(null);
    this.configuration = null;
    this.moduleInformation = null;
    this.layerStyles = null;
  }
}
