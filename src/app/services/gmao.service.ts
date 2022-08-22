import { Injectable } from '@angular/core';
import { Http,Headers,RequestOptions} from '@angular/http';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import 'rxjs/add/operator/map'
@Injectable({
  providedIn: 'root'
})
export class GmaoService {
  private url = 'https://api.dexcell.com/v3/'; // /api/  lo trae del proxy OJO
  private headers2 = new HttpHeaders({
    'X-dexcell-token': '49629639507e3b9caae7'
  });
  private headers3 = new HttpHeaders({
    'Content-Type': 'application/json',
    'X-dexcell-token': '49629639507e3b9caae7'
  });
  private headers = new Headers({
    'X-dexcell-token': '49629639507e3b9caae7'
  });
  private headers_gmao = new Headers({
    'Content-Type': 'application/json',
    /*'Content-Type': 'application/x-www-form-urlencoded'*/
  });
  url_gmao='https://saas.fisotecsolutions.com/gmao_api/public/api/';
	/*esta conexion es temporal, cambiará con la nueva API, pero ya están creados los servicios, se habia creado de esa manera ya que hubo muchos problemas con la conexion de valuekeep y se tomó via CURL*/
  constructor(private http: Http, private http2:HttpClient){}
  Login_valuekeep(datos){
     let datos2='client_id=VKCST-b5ad715b-979e-4faf-942f-3fa037e75f0a&client_secret=71d5a29a-8550-4e26-9803-5e1b7c900491b5ad715b-979e-4faf-942f-3fa037e75f0a561&grant_type=client_credentials';
    var variable_2=JSON.stringify(datos);
    var url = 'https://fisotec.tufreelance.net/index.php/fisotec/conectar_curl';
    var response = this.http.post(url,datos2, { headers: this.headers }).map(res =>  res.json());
    return response;
  }
  /* gmao_viejo */
  request(datos){
    let token=JSON.parse(localStorage.getItem('tokenVK'));
    let datos1={
      token:token
    }
    var url = 'https://fisotec.tufreelance.net/index.php/fisotec/get_request';
    var response = this.http.post(url,datos1,{headers: this.headers}).map(res =>  res.json());
    return response;
  }
  get_workOrders(datos){
    let token=JSON.parse(localStorage.getItem('tokenVK'));
    let datos1={
      token:token
    }
    var url = 'https://fisotec.tufreelance.net/index.php/fisotec/get_work_orders';
    var response = this.http.post(url,datos1,{headers: this.headers}).map(res =>  res.json());
    return response;
  }
  get_preventive_manteinance(datos){
    let token=JSON.parse(localStorage.getItem('tokenVK'));
    let datos1={
      token:token
    }
    var url = 'https://fisotec.tufreelance.net/index.php/fisotec/get_preventive_manteinance';
    var response = this.http.post(url,datos1,{headers: this.headers}).map(res =>  res.json());
    return response;
  }
  get_employees(datos){
    let token=JSON.parse(localStorage.getItem('tokenVK'));
    let datos1={
      token:token
    }
    var url = 'https://fisotec.tufreelance.net/index.php/fisotec/get_employees';
    var response = this.http.post(url,datos1,{headers: this.headers}).map(res =>  res.json());
    return response;
  }
  new_work_order(datos){
    let variable=JSON.stringify(datos);
    var url = 'https://fisotec.tufreelance.net/index.php/fisotec/new_work_order';
    var response = this.http.post(url,variable,{headers: this.headers}).map(res =>  res.json());
    return response;
  }
  get_equipment(datos){
    let token=JSON.parse(localStorage.getItem('tokenVK'));
    let datos1={
      token:token
    }
    var url = 'https://fisotec.tufreelance.net/index.php/fisotec/get_equipment';
    var response = this.http.post(url,datos1,{headers: this.headers}).map(res =>  res.json());
    return response;
  }
  get_locations(datos){
    let token=JSON.parse(localStorage.getItem('tokenVK'));
    let datos1={
      token:token
    }
    var url = 'https://fisotec.tufreelance.net/index.php/fisotec/get_locations';
    var response = this.http.post(url,datos1,{headers: this.headers}).map(res =>  res.json());
    return response;
  }
  get_warehouses(datos){
    let token=JSON.parse(localStorage.getItem('tokenVK'));
    let datos1={
      token:token
    }
    var url = 'https://fisotec.tufreelance.net/index.php/fisotec/get_warehouses';
    var response = this.http.post(url,datos1,{headers: this.headers}).map(res =>  res.json());
    return response; 
  }
  get_equipmentitems(datos){
    let token=JSON.parse(localStorage.getItem('tokenVK'));
    let datos1={
      token:token
    }
    var url = 'https://fisotec.tufreelance.net/index.php/fisotec/get_equipmentitems';
    var response = this.http.post(url,datos1,{headers: this.headers}).map(res =>  res.json());
    return response; 
  }
  get_piezas(datos){
    let token=JSON.parse(localStorage.getItem('tokenVK'));
    let datos1={
      token:token
    }
    var url = 'https://fisotec.tufreelance.net/index.php/fisotec/get_piezas';
    var response = this.http.post(url,datos1,{headers: this.headers}).map(res =>  res.json());
    return response; 
  }
  save_warehouses(datos){
    let variable=JSON.stringify(datos);
    var url = 'https://fisotec.tufreelance.net/index.php/fisotec/save_warehouses';
    var response = this.http.post(url,variable,{headers: this.headers}).map(res =>  res.json());
    return response;
  }
  save_request(datos){
    let variable=JSON.stringify(datos);
    var url = 'https://fisotec.tufreelance.net/index.php/fisotec/save_request';
    var response = this.http.post(url,variable,{headers: this.headers}).map(res =>  res.json());
    return response;
  }
  save_equipmentitems(datos){
    let variable=JSON.stringify(datos);
    var url = 'https://fisotec.tufreelance.net/index.php/fisotec/save_equipmentitems';
    var response = this.http.post(url,variable,{headers: this.headers}).map(res =>  res.json());
    return response;
  }
  /* ************************** */
  /* ***************** gmao nuevo *************************/
  get_empresa(datos){
    let datos1={
      datos:datos
    }
    var url = 'https://gmao.tufreelance.net/empresa/get_empresa';
    var response = this.http.post(url,datos1,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  guardar_empresa(datos){
    var variable_2=JSON.stringify(datos);
    var url = 'https://gmao.tufreelance.net/empresa/guardar_empresa';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  get_talleres(datos){
    var variable_2=JSON.stringify(datos);
    var url = this.url_gmao+'storage/get_talleres';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  get_talleres_id_empresa(datos){
    var variable_2=JSON.stringify(datos);
    var url = this.url_gmao+'storage/get_talleres_id_empresa';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  guardar_taller(datos){
    var variable_2=JSON.stringify(datos);
    var url = this.url_gmao+'storage/guardar_taller';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  get_marca(datos){
    var variable_2=JSON.stringify(datos);
    var url = this.url_gmao+'trademark/get_marca';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  get_marca_id_empresa(datos){
    var variable_2=JSON.stringify(datos);
    var url = this.url_gmao+'trademark/get_marca_id_empresa';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  guardar_marca(datos){
    var variable_2=JSON.stringify(datos);
    var url = this.url_gmao+'trademark/add_marca';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  get_modelo_id_empresa(datos){
    var variable_2=JSON.stringify(datos);
    var url = this.url_gmao+'pattern/get_modelo_id_empresa';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  get_modelo_id_marca(datos){
    var variable_2=JSON.stringify(datos);
    var url = this.url_gmao+'pattern/get_modelo_id_marca';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  guardar_modelo(datos){
    var variable_2=JSON.stringify(datos);
    var url = this.url_gmao+'pattern/add_modelo';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  get_inventario(datos){
    var variable_2=JSON.stringify(datos);
    var url = this.url_gmao+'inventory/get_inventario';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  
  get_inventario_id_empresa(datos){
    var variable_2=JSON.stringify(datos);
    var url = this.url_gmao+'inventory/get_inventario_id_empresa';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  get_inventario_id_tipo_inventario_id_empresa(datos){
    var variable_2=JSON.stringify(datos);
    var url = this.url_gmao+'inventory/get_inventario_id_tipo_inventario_id_empresa';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  get_det_inventario_id_inventario(datos){
    var variable_2=JSON.stringify(datos);
    var url = this.url_gmao+'det_inventory/get_det_inventario_id_inventario';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  guardar_inventario(datos){
    var variable_2=JSON.stringify(datos);
    var url = this.url_gmao+'inventory/guardar_inventario';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  guardar_entrada_salida(datos){
    var variable_2=JSON.stringify(datos);
    var url = this.url_gmao+'det_inventory/guardar_entrada_salida';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  resuelto_no_resuelto_solicitud(datos){
    var variable_2=JSON.stringify(datos);
    var url = this.url_gmao+'incidents/actualizar_resuelto_no_resuelto';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }

  actualizar_inventario(datos){
    var variable_2=JSON.stringify(datos);
    var url = this.url_gmao+'inventory/actualizar_inventario';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  get_tipo(datos){
    var variable_2=JSON.stringify(datos);
    var url = this.url_gmao+'/tipo/get_tipo';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  get_tipo_id_empresa(datos){
    var variable_2=JSON.stringify(datos);
    var url = this.url_gmao+'types/get_tipo_id_empresa';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  get_tipo_mantenimiento_preventivo_id_empresa(datos){
    var variable_2=JSON.stringify(datos);
    var url = this.url_gmao+'types_preventive_manteinance/get_tipo_mantenimiento_preventivo_id_empresa';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  add_tipo_mantenimiento_preventivo(datos){
    var variable_2=JSON.stringify(datos);
    var url = this.url_gmao+'types_preventive_manteinance/add_tipo_mantenimiento_preventivo';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  get_tipo_inventario_id_empresa(datos){
    var variable_2=JSON.stringify(datos);
    var url = this.url_gmao+'types_inventory/get_tipo_inventario_id_empresa';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  add_tipo_inventario(datos){
    var variable_2=JSON.stringify(datos);
    var url = this.url_gmao+'types_inventory/add_tipo_inventario';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  add_tipo_incidencia(datos){
    var variable_2=JSON.stringify(datos);
    var url = this.url_gmao+'types/add_tipo';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  actualizar_tipo_incidencia(datos){
    var variable_2=JSON.stringify(datos);
    var url = this.url_gmao+'types/edit_tipo';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  get_modulo(datos){
    var variable_2=JSON.stringify(datos);
    var url = this.url_gmao+'/modulo/get_modulo';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  get_estado(datos){
    var variable_2=JSON.stringify(datos);
    var url = 'https://gmao.tufreelance.net/estado/get_estado';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  get_elemento(datos){
    var variable_2=JSON.stringify(datos);
    var url = this.url_gmao+'elemento/get_elemento';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  get_prioridad(datos){
    var variable_2=JSON.stringify(datos);
    var url = this.url_gmao+'priority/get_prioridad';
    var response = this.http.get(url,variable_2).map(res =>  res.json());
    return response;
  }
  get_solicitudes(datos){
    var variable_2=JSON.stringify(datos);
    var url =  this.url_gmao+'incidents/get_solicitud';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  get_solicitudes_id_empresa(datos){
    var variable_2=JSON.stringify(datos);
    /*http://localhost:8000/api/incidents/*/
    var url = this.url_gmao+'incidents/get_solicitud_id_empresa';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  get_imagen_id_solicitud(datos){
    var variable_2=JSON.stringify(datos);
    var url = this.url_gmao+'incidents/get_imagen_id_solicitud';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  guardar_solicitud(datos){
    var variable_2=JSON.stringify(datos);
    var url = this.url_gmao+'incidents/guardar_solicitud';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  get_usuarios_id_empresa(datos){
    var variable_2=JSON.stringify(datos);
    var url = this.url_gmao+'users/get_usuario_id_empresa';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  rechazar_solicitud(datos){
    var variable_2=JSON.stringify(datos);
    var url = this.url_gmao+'incidents/actualizar_status_solicitud';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  /**************ordenes******************/
  get_ordenes(datos){
    var variable_2=JSON.stringify(datos);
    var url = this.url_gmao+'workorders/get_ordenes';
    var response = this.http.get(url,variable_2).map(res =>  res.json());
    return response;
  }
  get_ordenes_id_empresa(datos){
    var variable_2=JSON.stringify(datos);
    var url = this.url_gmao+'workorders/get_ordenes_trabajo_id_empresa';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  guardar_orden_trabajo(datos){
    var variable_2=JSON.stringify(datos);
    var url = this.url_gmao+'workorders/guardar_ordenes_trabajo';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  actualizar_orden(datos){
    var variable_2=JSON.stringify(datos);
    var url = this.url_gmao+'workorders/actualizar_orden_trabajo';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  guardar_ordenes_con_solicitud(datos){
    var variable_2=JSON.stringify(datos);
    var url = this.url_gmao+'workorders/guardar_ordenes_con_solicitud';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  get_imagen_id_orden(datos){
    var variable_2=JSON.stringify(datos);
    var url = this.url_gmao+'workorders/get_imagen_id_orden';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  get_det_orden_trabajo(datos){
    var variable_2=JSON.stringify(datos);
    var url = this.url_gmao+'workorders/get_det_orden_trabajo';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  /**********************************/
  get_mantenimiento_preventivo(datos){
    var variable_2=JSON.stringify(datos);
    var url = this.url_gmao+'preventive_manteinance/get_mantenimiento_preventivo_id_empresa';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
   get_mantenimiento_preventivo_id_empresa(datos){
    var variable_2=JSON.stringify(datos);
    var url = this.url_gmao+'preventive_manteinance/get_mantenimiento_preventivo_id_empresa';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  get_periodicidad(datos){
    var variable_2=JSON.stringify(datos);
    var url = this.url_gmao+'periodicity/get_periodicidad';
    var response = this.http.get(url,variable_2).map(res =>  res.json());
    return response;
  }
  guardar_mantenimiento_preventivo(datos){
    var variable_2=JSON.stringify(datos);
    var url = this.url_gmao+'preventive_manteinance/guardar_mantenimiento_preventivo';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  actualizar_status_mantenimiento_preventivo(datos){
    var variable_2=JSON.stringify(datos);
    var url = this.url_gmao+'preventive_manteinance/actualizar_status_mantenimiento_preventivo';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  guardar_plan_mantenimiento_preventivo(datos){
    var variable_2=JSON.stringify(datos);
    var url = this.url_gmao+'manteinance_plan/guardar_plan_mantenimiento';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  guardar_ordenes_con_solicitud_periodicidad(datos){
    var variable_2=JSON.stringify(datos);
    var url = this.url_gmao+'workorders/guardar_ordenes_con_solicitud_periodicidad';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  actualizar_plan_mantenimiento(datos){
    var variable_2=JSON.stringify(datos);
    var url = this.url_gmao+'plan_mantenimiento/actualizar_plan_mantenimiento';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  get_plan_mantenimiento_id_mantenimiento_preventivo(datos){
    var variable_2=JSON.stringify(datos);
    var url = this.url_gmao+'plan_mantenimiento/get_plan_mantenimiento_id_mantenimiento_preventivo';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  get_familia(datos){
    var variable_2=JSON.stringify(datos);
    var url = this.url_gmao+'family';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  get_familia_id_empresa(datos){
    var variable_2=JSON.stringify(datos);
    var url = this.url_gmao+'family/get_familia_id_empresa';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  get_sub_familia(datos){
    var variable_2=JSON.stringify(datos);
    var url = this.url_gmao+'subfamily';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  get_sub_familia_id_empresa(datos){
    var variable_2=JSON.stringify(datos);
    var url = this.url_gmao+'subfamily/get_sub_familia_id_empresa';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  guardar_familia(datos){
    var variable_2=JSON.stringify(datos);
    var url = this.url_gmao+'family/guardar_familia';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  guardar_sub_familia(datos){
    var variable_2=JSON.stringify(datos);
    var url = this.url_gmao+'subfamily/guardar_sub_familia';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  get_sub_familia_id_familia(datos){
    var variable_2=JSON.stringify(datos);
    var url = this.url_gmao+'subfamily/get_sub_familia_id_familia';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  eliminar_solicitud(datos){
    var variable_2=JSON.stringify(datos);
    var url = this.url_gmao+'incidents/eliminar_solicitud';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  get_tareas_id_empresa(datos){
    var variable_2=JSON.stringify(datos);
    var url =  this.url_gmao+'tags/get_tareas_id_empresa';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  guardar_tareas_id_empresa(datos){
    var variable_2=JSON.stringify(datos);
    var url =  this.url_gmao+'tags/guardar_tareas_id_empresa';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  actualizar_tarea(datos){
    var variable_2=JSON.stringify(datos);
    var url =  this.url_gmao+'tags/actualizar_tarea';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  get_solicitudes_todas(datos){
    var variable_2=JSON.stringify(datos);
    var url = this.url_gmao+'estadisticas/get_solicitudes_todas';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  get_procedencia_id_empresa(datos){
    var variable_2=JSON.stringify(datos);
    var url = this.url_gmao+'procedencia/get_procedencia_id_empresa';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
   get_solicitudes_todas_fecha(datos){
    var variable_2=JSON.stringify(datos);
    var url = this.url_gmao+'estadisticas/get_solicitudes_todas_fecha';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  get_ordenes_todas(datos){
    var variable_2=JSON.stringify(datos);
    var url = this.url_gmao+'estadisticas/get_ordenes_todas';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  get_ordenes_todas_fecha(datos){
    var variable_2=JSON.stringify(datos);
    var url = this.url_gmao+'estadisticas/get_ordenes_todas_fecha';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  get_mantenimiento_preventivo_todos(datos){
    var variable_2=JSON.stringify(datos);
    var url = this.url_gmao+'estadisticas/get_mantenimiento_preventivo_todos';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  get_mantenimiento_preventivo_todos_fecha(datos){
    var variable_2=JSON.stringify(datos);
    var url = this.url_gmao+'estadisticas/get_mantenimiento_preventivo_todos_fecha';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }


  /* ********************************************* */
  /****************** dexma**********************************/
  /*get_parameters(datos){
    var url = 'https://api.dexcell.com/v3/parameters';
    var response = this.http2.get(url,{headers: this.headers2}).map(res =>  res);
    return response;
  }
  get_devices(datos){
    var url = 'https://api.dexcell.com/v3/devices';
    var response = this.http2.get(url,{headers: this.headers2}).map(res =>  res);
    return response;
  }
  get_devices_pendientes(datos){
    var url = 'https://api.dexcell.com/v3/devices?status=PENDING';
    var response = this.http2.get(url,{headers: this.headers2}).map(res =>  res);
    return response;
  }
  get_devices_rechazados(datos){
    var url = 'https://api.dexcell.com/v3/devices?status=REJECTED';
    var response = this.http2.get(url,{headers: this.headers2}).map(res =>  res);
    return response;
  }
  get_datasources(datos){
    var url = 'https://api.dexcell.com/v3/datasources';
    var response = this.http2.get(url,{headers: this.headers2}).map(res =>  res);
    return response;
  }
  
  get_locations_dexma(datos){
    var url = 'https://api.dexcell.com/v3/locations';
    var response = this.http2.get(url,{headers: this.headers2}).map(res =>  res);
    return response;
  }
  cost_electricity(datos){
    var url = 'https://api.dexcell.com/v3/cost/electricity/consumption?device_id='+datos.device+'&from='+datos.inicio+'T00:00:00&to='+datos.fin+'T23:59:59&resolution=D';
    var response = this.http2.get(url,{headers: this.headers2}).map(res =>  res);
    return response;
  }
  cost_electricity_analisys(datos){
    var url = 'https://api.dexcell.com/v3/cost/electricity/consumption?device_id='+datos.device+'&from='+datos.inicio+'T00:00:00&to='+datos.fin+'T23:59:59&resolution='+datos.frecuencia;
    var response = this.http2.get(url,{headers: this.headers2}).map(res =>  res);
    return response;
  }
  analisis_delta_costo_consumo(datos){
    var url = 'https://api.dexcell.com/v3/readings?device_id='+datos.device+'&operation=DELTA&parameter_key=EACTIVE&resolution='+datos.frecuencia+'&from='+datos.inicio+'T00:00:00&to='+datos.fin+'T23:59:59';
    var response = this.http2.get(url,{headers: this.headers2}).map(res =>  res);
    return response;
  }
  save_device(datos){
    let token={
      datasource:{
        id:datos.datasource_id
      },
      name:datos.name,
      local_id:datos.local_id,
      description:datos.description
    };
    var url = 'https://api.dexcell.com/v3/devices';
    var response = this.http2.post(url,token,{headers: this.headers3}).map(res =>  res);
    return response;
  }
  save_virtual_datasources(datos){
    let data={
      key:datos.key,
      name:datos.name,
      type:datos.type,
      timezone:datos.timezone,
      status:datos.status
    };
    var url = 'https://api.dexcell.com/v3/datasources';
    var response = this.http2.post(url,data,{headers: this.headers3}).map(res =>  res);
    return response;
  }
  delete_virtual_datasources(datos){
    var url = 'https://api.dexcell.com/v3/datasources/'+datos.id;
    var response = this.http2.delete(url,{headers: this.headers3}).map(res =>  res);
    return response;
  }
  accept_reject_device(datos){
    let data={
      status:datos.status
    };
    var url = 'https://api.dexcell.com/v3/devices/'+datos.id;
    var response = this.http2.patch(url,data,{headers: this.headers3}).map(res =>  res);
    return response;
  }
  delete_device(datos){
    var url = 'https://api.dexcell.com/v3/devices/'+datos.id;
    var response = this.http2.delete(url,{headers: this.headers3}).map(res =>  res);
    return response;
  }*/
  /****************************************************************************/
  /*dexma nuevo*/
  get_dashboard(datos){
    var variable_2=JSON.stringify(datos);
    var url = 'https://gmao.tufreelance.net/setup/get_dashboard';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  dashboard_guardar(datos){
    var variable_2=JSON.stringify(datos);
    var url = 'https://gmao.tufreelance.net/setup/dashboard_guardar';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  get_dispositivos_id_dashboard(datos){
    var variable_2=JSON.stringify(datos);
    var url = 'https://gmao.tufreelance.net/setup/get_dispositivos_id_dashboard';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  guardar_dispositivo(datos){
    var variable_2=JSON.stringify(datos);
    var url = 'https://gmao.tufreelance.net/setup/guardar_dispositivo';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  get_parameters(datos){
    var variable_2=JSON.stringify(datos);
    var url = 'https://gmao.tufreelance.net/setup/get_parameters';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  get_locations_dexma(datos){
    var variable_2=JSON.stringify(datos);
    var url = 'https://gmao.tufreelance.net/setup/get_locations';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  get_devices(datos){
    var variable_2=JSON.stringify(datos);
    var url = 'https://gmao.tufreelance.net/setup/get_devices';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  get_devices_pendientes(datos){
    var variable_2=JSON.stringify(datos);
    var url = 'https://gmao.tufreelance.net/setup/get_devices_pendientes';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  get_devices_rechazados(datos){
    var variable_2=JSON.stringify(datos);
    var url = 'https://gmao.tufreelance.net/setup/get_devices_rechazados';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  get_virtual_datasources(datos){
    var variable_2=JSON.stringify(datos);
    var url = 'https://gmao.tufreelance.net/setup/get_virtual_datasources';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  cost_electricity(datos){
    var variable_2=JSON.stringify(datos);
    var url = 'https://gmao.tufreelance.net/setup/cost_electricity';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  cost_electricity_analisys(datos){
    var variable_2=JSON.stringify(datos);
    var url = 'https://gmao.tufreelance.net/setup/cost_electricity_analisys';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  analisis_delta_costo_consumo(datos){
    var variable_2=JSON.stringify(datos);
    var url = 'https://gmao.tufreelance.net/setup/analisis_delta_costo_consumo';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  save_device(datos){
    var variable_2=JSON.stringify(datos);
    var url = 'https://gmao.tufreelance.net/setup/save_device';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  save_virtual_datasources(datos){
    var variable_2=JSON.stringify(datos);
    var url = 'https://gmao.tufreelance.net/setup/save_virtual_datasources';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  delete_virtual_datasources(datos){
    var variable_2=JSON.stringify(datos);
    var url = 'https://gmao.tufreelance.net/setup/delete_virtual_datasources';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  accept_reject_device(datos){
    var variable_2=JSON.stringify(datos);
    var url = 'https://gmao.tufreelance.net/setup/accept_reject_device';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }
  delete_device(datos){
    var variable_2=JSON.stringify(datos);
    var url = 'https://gmao.tufreelance.net/setup/delete_device';
    var response = this.http.post(url,variable_2,{headers: this.headers_gmao}).map(res =>  res.json());
    return response;
  }

  /*************/
  

}
