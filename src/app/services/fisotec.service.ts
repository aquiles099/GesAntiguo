import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FisotecService {
  private url = environment.baseUrl + environment.api;

  private headers = new HttpHeaders({

    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'

  });


  constructor(private http: HttpClient) { }

  //Método que realiza una petición al Backend. Recibe un objeto JSON
  conexionBackend(datos: any): Promise<any> {
    //Se deben de codificar los datos para que no haya error en la petición al servidor.
    var params = 'datos=' + encodeURIComponent(datos);

    return this.http
      .post<any>(this.url, params, { headers: this.headers })
      .pipe(
        map((result) => {
          return result;
        })
      )
      .toPromise();
  }

  //Método para logearse
  login(datos: any): Promise<any> {
    //Se deben de codificar los datos para que no haya error en la petición al servidor.
    var params = 'datos=' + encodeURIComponent(datos);

    return this.http
      .post<any>(this.url, params, { headers: this.headers })
      .pipe(
        map((result) => {
          sessionStorage.setItem('usuario', JSON.stringify(result.datos));
          return result;
        })
      )
      .toPromise();
  }

  //Devuelve un observable con la lista de proyectos
  listaProjectos(datos: any): Observable<any> {
    var params = 'datos=' + encodeURIComponent(JSON.stringify(datos));
    return this.http
      .post<any>(this.url, params, { headers: this.headers })
      .pipe(
        map((result) => {
          return result;
        })
      );
  }


  listaUsuarios(datos: any): Observable<any> {
    var params = 'datos=' + encodeURIComponent(JSON.stringify(datos));
    return this.http
      .post<any>(this.url, params, { headers: this.headers })
      .pipe(
        map((result) => {
          return result;
        })
      );
  }
  agregar_quitar_favorito(data) {

    return this.http.post(this.url, `datos=${encodeURIComponent(JSON.stringify(data))}`, { headers: this.headers });
  }
  subir_foto_elemento(data) {

    return this.http.post(this.url, `datos=${encodeURIComponent(JSON.stringify(data))}`, { headers: this.headers });

  }
  eliminar_foto_elemento(data) {
    return this.http.post(this.url, `datos=${encodeURIComponent(JSON.stringify(data))}`, { headers: this.headers });
  }
  listar_divisiones(data) {
    return this.http.post(this.url, `datos=${encodeURIComponent(JSON.stringify(data))}`, { headers: this.headers });
  }
  crear_usuario(data) {
    return this.http.post(this.url, `datos=${encodeURIComponent(JSON.stringify(data))}`, { headers: this.headers });
  }
  informacion_usuario(data) {
    return this.http.post(this.url, `datos=${encodeURIComponent(JSON.stringify(data))}`, { headers: this.headers });
  }
  modificar_usuario(data) {
    return this.http.post(this.url, `datos=${encodeURIComponent(JSON.stringify(data))}`, { headers: this.headers });
  }
  eliminar_usuario(data) {
    return this.http.post(this.url, `datos=${encodeURIComponent(JSON.stringify(data))}`, { headers: this.headers });
  }
  informacion_crear_empresa(data: any): Promise<any> {
    var params = 'datos=' + encodeURIComponent(data);

    return this.http
      .post<any>(this.url, params, { headers: this.headers })
      .pipe(
        map((result) => {
          return result;
        })
      )
      .toPromise();
  }
  crear_empresa_administrador(data: any): Promise<any> {
    var params = 'datos=' + encodeURIComponent(data);

    return this.http
      .post<any>(this.url, params, { headers: this.headers })
      .pipe(
        map((result) => {
          return result;
        })
      )
      .toPromise();
  }
  modificar_empresa_administrador_informacion(data: any): Promise<any> {
    var params = 'datos=' + encodeURIComponent(data);

    return this.http
      .post<any>(this.url, params, { headers: this.headers })
      .pipe(
        map((result) => {
          return result;
        })
      )
      .toPromise();
  }
  modificar_empresa_administrador_total(data: any): Promise<any> {
    var params = 'datos=' + encodeURIComponent(data);

    return this.http
      .post<any>(this.url, params, { headers: this.headers })
      .pipe(
        map((result) => {
          return result;
        })
      )
      .toPromise();
  }
  informacion_centro_mando(datos: any): Promise<any> {
    //Se deben de codificar los datos para que no haya error en la petición al servidor.
    var params = 'datos=' + encodeURIComponent(datos);

    return this.http
      .post<any>(this.url, params, { headers: this.headers })
      .pipe(
        map((result) => {
          return result;
        })
      )
      .toPromise();
  }
  modificar_centro_mando(datos: any): Promise<any> {
    //Se deben de codificar los datos para que no haya error en la petición al servidor.
    var params = 'datos=' + encodeURIComponent(datos);

    return this.http
      .post<any>(this.url, params, { headers: this.headers })
      .pipe(
        map((result) => {
          return result;
        })
      )
      .toPromise();
  }
}
