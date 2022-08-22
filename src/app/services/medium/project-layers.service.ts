import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Capa, Modulo, Grupo } from '../../interfaces/medium/mapa/Modulo';
import { isset, isNumeric } from '../../shared/helpers';
import { ApiService } from '../api.service';
import { Project } from '../../interfaces/project';
import LeafletWms from 'leaflet.wms';

@Injectable()
export class ProjectLayersService
{
  private modulos:Modulo[];

  private observadorDeCapas:BehaviorSubject<Capa[]>;
  public capa$:Observable<Capa[]>;
  public capasProyectada$:Observable<Capa[]>;

  constructor(
    private _apiService:ApiService
  )
  {
    this.observadorDeCapas = new BehaviorSubject([]);
    this.capa$ = this.observadorDeCapas.asObservable();
    this.capasProyectada$ = this.observadorDeCapas.asObservable().pipe(map(capas => capas.filter(capa => capa.proyectado)));
  }

  get modulesNumber():number
  {
    return this.modulos.length;
  }

  get thereIsOnlyOneModule():boolean
  {
    return this.modulos.length === 1;
  }

  get thereIsMoreThanOneModule():boolean
  {
    return this.modulos.length > 1;
  }

  public next(modulos:Modulo[]):void{
    const capas:Capa[] = [];
    this.modulos = modulos;
    modulos.forEach(
      modulo => modulo.grupos.forEach(
        grupo => grupo.capas.forEach(
          capa => capas.push(capa)
        )
      )
    );

    capas.forEach(capa => {

      capa.refrescar = () => capa.capaWms.setParams(({fake: Date.now()} as any));

      //
      capa.obtenerFiltro =  () => {

        let filter = {}, cqlFilter = capa.capaWms.wmsParams.cql_filter;
    
        if( cqlFilter )
        {
          cqlFilter.split(" AND ").forEach((filterStatement:string) => {

            // "atributo" IN (...)
            let attribute = filterStatement.substring(1, filterStatement.indexOf(" IN") - 1);

            // remover parentesis final ")"
            filterStatement = filterStatement.substring(0, filterStatement.length - 1);
      
            filter[attribute] =  filterStatement.substring( filterStatement.indexOf("(") + 1).split(", ").map(
              value => isNumeric(value) ? Number.parseFloat(value) : value.substring(1, value.length - 1)
            );

          });
        }

        if(capa.nombre_formateado === "control_obra" || capa.nombre_formateado === "gmao")
          filter = "";

        return filter;
      };

    });

    this.observadorDeCapas.next(capas);
  }

  public get():Capa[]
  {
    return this.observadorDeCapas.getValue();
  }

  public notificarCambioEnObservador():void
  {
    this.next(this.modulos);
  }

    /**
   * Obtener filtros de capas (proyectadas o desproyectadas).
   * @param proyectado:boolean 
   * @returns object
   */
    public obtenerFiltrosDeCapas(proyectado:boolean = true):{[filtroCapa:string]:string}
    {
      return this.get()
                .filter(capa => proyectado ? capa.proyectado : ! capa.proyectado )
                .reduce((obj, capa) => {

                  if( capa.nombre_formateado !== 'secciones' && capa.nombre_formateado !== 'control_obra' && capa.nombre_formateado !== 'gmao')
                    obj[capa.filtro_capa] = capa.capaWms.wmsParams.cql_filter ?? "";

                  return obj;

                }, {});
    }

  /**
   *  Obtener capas (todas proyectadas o desproyectadas, por modulo y por modulo y grupo).
   * @param datos 
   * @returns Capa[]
   */
    public obtenerCapas(datos?:{modulo:string, grupo:string, proyectado: boolean}):Capa[]
    {
      let capas = this.get().filter(capa => ! datos || datos.proyectado ? capa.proyectado : ! capa.proyectado);
            
      if( datos)
      {
        switch( true )
        {
          case isset(datos.modulo) && isset(datos.grupo):
            capas = capas.filter(capa => capa.modulo === datos.modulo && capa.grupo === datos.grupo);
            break;
  
          case isset(datos.modulo) && ! isset(datos.grupo):
            capas = capas.filter(capa => capa.modulo === datos.modulo);
            break;
        }
      }

      return capas;
    }

  /**
   *  Obtener modulos (donde todas sus capas esten proyectadas o no).
   * @param proyectado
   * @returns string[]
   */
    public obtenerModulos(proyectado:boolean = true):Modulo[]
    {
      return proyectado ? this.modulos.filter(
        modulo => modulo.grupos.some(
          grupo => ! grupo.capas.every(
            capa => ! capa.proyectado
          )
        )
      ) :
      this.modulos;
    }

  /**
   *  Obtener grupos por modulo (donde todas sus capas esten proyectadas o no).
   * @returns Grupo[]
   */
    public obtenerGruposPorModulo(nombre:string, proyectado:boolean = true):Grupo[]
    {
      try
      {
        const modulo = this.modulos.find(modulo => modulo.nombre === nombre);

        if(! modulo)
          throw new Error("Modulo no existe.");
        
          return proyectado ? modulo.grupos.filter(
            grupo => grupo.capas.some(
              capa => capa.proyectado
            )
          ) :
          modulo.grupos;
      }
      catch (error)
      {
        throw error;  
      }
    }

    /**
   * Obtener capa.
   * @param informacionDeCapa
   * @returns Capa
   */
    public obtenerCapa(informacionDeCapa:{modulo:string;grupo:string;nombre:string;}| string):Capa{
      try{
        let capa:Capa;
        if( typeof informacionDeCapa === "string" ){
          capa = this.get().find(capa => capa.filtro_capa === informacionDeCapa);
        }
        else
        {
          capa = this.get().find(capa => 
            capa.modulo === informacionDeCapa.modulo &&
            capa.grupo  === informacionDeCapa.grupo &&
            capa.nombre === informacionDeCapa.nombre
          );
        }

        if(! capa)
          throw new Error("Capa no existe.");
        
        return capa;
      }
      catch (error)
      {
        throw error;  
      }
    }

    
  public async obtenerModulosDeAPI(project:Project, buildWMSLayer:boolean = true):Promise<Modulo[]>
  {
    try
    {
      const datos = await this._apiService.postWithAuthentication({
        funcion: "informacion_modulos_proyecto",
        id_proyecto: project.id_proyecto,
      });

      let url = project.url_base.split('wms?')[0] + "wms?";

      let layersZindex = 1;

      const crearYRetornarCapaWMS = (capa:Capa) => {

        const wmsLayer = LeafletWms.overlay(url, {
          layers: capa.filtro_capa.split('#').join('_'),
          styles: capa.estilo_por_defecto,
          className: capa.nombre_formateado,
          format: 'image/gif',
          crossOrigin: true,
          transparent: true,
          opacity: 1,
          maxNativeZoom: 22,
          maxZoom: 22,
          tiled: false,
          zIndex: 1000 - (layersZindex + 1),
          interactive: true
        });

        layersZindex++;

        return wmsLayer;
      };

      return datos.modulos.map(datosDeModulo => {

        return {
          nombre: datosDeModulo.modulo,
          nombre_formateado: datosDeModulo.modulo_formateado,
          grupos: Object.keys(datosDeModulo.dic_modulo).map(nombreGrupo => {

            return {
              nombre: nombreGrupo,
              nombre_formateado: datosDeModulo.grupos_formateados[nombreGrupo],
              capas: datosDeModulo.dic_modulo[nombreGrupo].map(nombreDeCapa => {

                const filtro_capa = Object.keys(datosDeModulo.tipos_geometria).find(
                  capaFiltro => capaFiltro.split("#")[capaFiltro.split("#").length - 1] === datosDeModulo.capas_formateadas[nombreDeCapa]
                );

                const leyenda = url + "REQUEST=GetLegendGraphic&transparent=true&"+
                "style=" + datos.estilos[filtro_capa] + "&SCALE=2000&VERSION=1.0.0&FORMAT=image/png&LAYER=gissmart_energy_gestlighting_centro_mando&LEGEND_OPTIONS=FontName:Raleway;fontSize:14;columnheight:199";

                const capa = {
                  modulo: datosDeModulo.modulo,
                  grupo: nombreGrupo,
                  nombre: nombreDeCapa,
                  nombre_formateado: datosDeModulo.capas_formateadas[nombreDeCapa],
                  filtro_capa: filtro_capa,
                  tipo_geometria: datosDeModulo.tipos_geometria[filtro_capa],
                  estilo_por_defecto: datos.estilos[filtro_capa] ?? "",
                  capaWms: null,
                  proyectado: true,
                  leyenda: leyenda
                };

                if( buildWMSLayer )
                  capa.capaWms = crearYRetornarCapaWMS(capa);

                return capa;

              }),
              proyectado: true
            };

          }),
          proyectado: true
        }

      });

    }
    catch (error)
    {
      throw error;
    }
  }

  
}
