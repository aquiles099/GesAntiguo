import { NgModule } from '@angular/core';
import { SharedModule } from '../../../../../shared/shared.module';
import { MapaRoutingModule } from './mapa-routing.module';

// material
import { MatCheckboxModule } from '@angular/material/checkbox';

// 
import { MapaComponent } from './mapa.component';
import { CabeceraComponent } from './cabecera/cabecera.component';
import { ZoomAjustarComponent } from './herramientas/zoom-ajustar/zoom-ajustar.component';
import { StreetViewMapComponent } from './herramientas/street-view-map/street-view-map.component';
import { SolicitudComponent } from './herramientas/solicitud/solicitud.component';
import { PlanimetriaComponent } from './herramientas/planimetria/planimetria.component';
import { ModalConfiguracionDePlanoComponent } from './herramientas/planimetria/modal-configuracion-de-plano/modal-configuracion-de-plano.component';
import { ModalConfiguracionDeCajetinComponent } from './herramientas/planimetria/modal-configuracion-de-cajetin/modal-configuracion-de-cajetin.component';
import { CajetinDePlanoComponent } from './herramientas/planimetria/cajetin-de-plano/cajetin-de-plano.component';
import { NuevoElementoComponent } from './herramientas/nuevo-elemento/nuevo-elemento.component';
import { MoverElementoComponent } from './herramientas/mover-elemento/mover-elemento.component';
import { InformacionElementoComponent } from './herramientas/informacion-elemento/informacion-elemento.component';
import { GestionCentroDeMandoComponent } from './herramientas/gestion-centro-de-mando/gestion-centro-de-mando.component';
import { SeccionPuestaATierraComponent } from './herramientas/gestion-centro-de-mando/seccion-puesta-a-tierra/seccion-puesta-a-tierra.component';
import { SeccionProteccionesManiobraComponent } from './herramientas/gestion-centro-de-mando/seccion-protecciones-maniobra/seccion-protecciones-maniobra.component';
import { SeccionProteccionesGeneralesComponent } from './herramientas/gestion-centro-de-mando/seccion-protecciones-generales/seccion-protecciones-generales.component';
import { SeccionOtrosComponent } from './herramientas/gestion-centro-de-mando/seccion-otros/seccion-otros.component';
import { SeccionInformacionPrincipalComponent } from './herramientas/gestion-centro-de-mando/seccion-informacion-principal/seccion-informacion-principal.component';
import { SeccionElementosManiobraComponent } from './herramientas/gestion-centro-de-mando/seccion-elementos-maniobra/seccion-elementos-maniobra.component';
import { SeccionCircuitosComponent } from './herramientas/gestion-centro-de-mando/seccion-circuitos/seccion-circuitos.component';
import { SeccionCajaDeProteccionComponent } from './herramientas/gestion-centro-de-mando/seccion-caja-de-proteccion/seccion-caja-de-proteccion.component';
import { GestionCircuitoComponent } from './herramientas/gestion-centro-de-mando/gestion-circuito/gestion-circuito.component';
import { GestionArchivoExternoComponent } from './herramientas/gestion-archivo-externo/gestion-archivo-externo.component';
import { GaleriaDeElementoComponent } from './herramientas/galeria-de-elemento/galeria-de-elemento.component';
import { FiltroDeElementosComponent } from './herramientas/filtro-de-elementos/filtro-de-elementos.component';
import { TablaDeElementosComponent } from './herramientas/tabla-de-elementos/tabla-de-elementos.component';
import { FichasCentrosDeMandoComponent } from './herramientas/fichas-centros-de-mando/fichas-centros-de-mando.component';
import { GeneradorFichasCentrosDeMandoComponent } from './herramientas/fichas-centros-de-mando/generador-fichas-centros-de-mando/generador-fichas-centros-de-mando.component';
import { ExportarArchivoComponent } from './herramientas/exportar-archivo/exportar-archivo.component';
import { FichaElementoComponent } from './herramientas/exportacion-informacion/ficha-elemento/ficha-elemento.component';
import { ExportacionElementoCapaComponent } from './herramientas/exportacion-informacion/exportacion-elemento-capa/exportacion-elemento-capa.component';
import { ModalConfiguracionDeListadoComponent } from './herramientas/exportacion-informacion/exportacion-elemento-capa/modal-configuracion-de-listado/modal-configuracion-de-listado.component';
import { ModalConfiguracionDeFichaComponent } from './herramientas/exportacion-informacion/exportacion-elemento-capa/modal-configuracion-de-ficha/modal-configuracion-de-ficha.component';
import { EliminarElementoComponent } from './herramientas/eliminar-elemento/eliminar-elemento.component';
import { EditarElementoComponent } from './herramientas/editar-elemento/editar-elemento.component';
import { EdicionMultipleComponent } from './herramientas/edicion-multiple/edicion-multiple.component';
import { CopiarElementoComponent } from './herramientas/copiar-elemento/copiar-elemento.component';
import { ControladorCapasBaseComponent } from './herramientas/controlador-capas-base/controlador-capas-base.component';
import { ControlObraFuturaComponent } from './herramientas/control-obra-futura/control-obra-futura.component';
import { ControlObraDefinirInstaladorComponent } from './herramientas/control-obra-definir-instalador/control-obra-definir-instalador.component';
import { CategorizadoComponent } from './herramientas/categorizado/categorizado.component';
import { SeccionEstilosPersonalizadosComponent } from './herramientas/categorizado/seccion-estilos-personalizados/seccion-estilos-personalizados.component';
import { ModalCreacionDeCategoriasComponent } from './herramientas/categorizado/modal-creacion-de-categorias/modal-creacion-de-categorias.component';
import { AnalisisGraficoComponent } from './herramientas/analisis-grafico/analisis-grafico.component';
import { VistaExportacionComponent } from './herramientas/analisis-grafico/vista-exportacion/vista-exportacion.component';
import { ModalDeConfiguracionComponent } from './herramientas/analisis-grafico/modal-de-configuracion/modal-de-configuracion.component';
import { GraficoComponent } from './herramientas/analisis-grafico/grafico/grafico.component';
import { IndicadorLinealComponent } from './herramientas/analisis-grafico/indicador-lineal/indicador-lineal.component';
import { ResaltarLuminariasPorCmComponent } from './herramientas/resaltar-luminarias-por-cm/resaltar-luminarias-por-cm.component';

// compartido
import { LayerSelectorsSectionComponent } from './herramientas/shared/layer-selectors-section/layer-selectors-section.component';

@NgModule({
  declarations: [
    MapaComponent,
    // herramientas
    ZoomAjustarComponent,
    StreetViewMapComponent,
    SolicitudComponent,
    PlanimetriaComponent,
    ModalConfiguracionDePlanoComponent,
    ModalConfiguracionDeCajetinComponent,
    CajetinDePlanoComponent,
    NuevoElementoComponent,
    MoverElementoComponent,
    InformacionElementoComponent,
    // gestion CM
    GestionCentroDeMandoComponent,
    SeccionPuestaATierraComponent,
    SeccionProteccionesManiobraComponent,
    SeccionProteccionesGeneralesComponent,
    SeccionOtrosComponent,
    SeccionInformacionPrincipalComponent,
    SeccionElementosManiobraComponent,
    SeccionCircuitosComponent,
    SeccionCajaDeProteccionComponent,
    GestionCircuitoComponent,
    //
    GestionArchivoExternoComponent,
    GaleriaDeElementoComponent,
    FiltroDeElementosComponent,
    FichasCentrosDeMandoComponent,
    GeneradorFichasCentrosDeMandoComponent,
    ExportarArchivoComponent,
    FichaElementoComponent,
    ExportacionElementoCapaComponent,
    ModalConfiguracionDeListadoComponent,
    ModalConfiguracionDeFichaComponent,
    EliminarElementoComponent,
    EditarElementoComponent,
    EdicionMultipleComponent,
    CopiarElementoComponent,
    ControladorCapasBaseComponent,
    ControlObraFuturaComponent,
    ControlObraDefinirInstaladorComponent,
    CategorizadoComponent,
    SeccionEstilosPersonalizadosComponent,
    ModalCreacionDeCategoriasComponent,
    ResaltarLuminariasPorCmComponent,
    // graficos de analisis
    AnalisisGraficoComponent,
    VistaExportacionComponent,
    ModalDeConfiguracionComponent,
    GraficoComponent,
    IndicadorLinealComponent,
    CabeceraComponent,
    // compartido
    LayerSelectorsSectionComponent,
    TablaDeElementosComponent,
    // 
  ],
  imports: [
    SharedModule,
    MapaRoutingModule,
    MatCheckboxModule
  ]
})
export class MapaModule { }
