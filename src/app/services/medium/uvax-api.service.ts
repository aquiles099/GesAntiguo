import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable()
export class UvaxApiService
{
  private credentials:{user:string, password:string} =
  {
    user: "admin",
    password: "1234"
  };

  private headers:HttpHeaders;

  private apiURL = "http://srv.uvax.es:8084/API/web/index.php";

  private loggedIn:boolean = false;

  constructor(
    private httpClient: HttpClient
  )
  {
    this.headers = new HttpHeaders({
      'Content-Type':  'application/json',
      "Authorization": `Basic ${btoa(this.credentials.user + ':' + this.credentials.password)}`
    });
  }

  get isLoggedIn():boolean
  {
    return this.loggedIn;
  }

  get apiUrl():string
  {
    return this.apiURL;
  }

  public async login():Promise<void>
  {
    try
    {
      const response = await this.httpClient.get<any>(`${this.apiURL}/logs`, {
        headers: this.headers
      }).toPromise();
    
      if( ! response.token )
        throw new Error("No se ha podido iniciar sesion en UVAX.");

      this.credentials.password = response.token;

      this.loggedIn = true;
    }
    catch (error)
    {
      console.error(error.message);
      throw error;
    }
  }
}
