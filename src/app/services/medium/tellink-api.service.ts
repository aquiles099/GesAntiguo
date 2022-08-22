import { Injectable } from '@angular/core';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { Contract } from '../../interfaces/medium/tellink/contract';
import { CommandCenter } from '../../interfaces/medium/tellink/command-center';
import { PerformanceProfile } from '../../interfaces/medium/tellink/performance-profile';
import { AlarmProfile } from '../../interfaces/medium/tellink/alarm-profile';
import { DailyMonthlyMeasure, QuarterHourMeasure } from '../../interfaces/medium/tellink/measures';
import { Operation } from '../../interfaces/medium/tellink/operation';
import { ReceivedAlarm } from '../../interfaces/medium/tellink/received-alarm';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: "root"
})
export class TellinkApiService
{
  private credentials:{user:string, password:string} =
  {
    user: "rafa.yeguas@fisotec.es",
    password: "yns7nbjoej"
  };

  private apiURL = "https://tsmart-tellink.com/api";

  public userContracts:Contract[] = [];

  private loggedIn:boolean = false;

  private selectedContractSubject:BehaviorSubject<Contract>;
  public selectedContractObservable:Observable<Contract>;

  constructor(
    private httpClient: HttpClient,
  )
  {
    this.selectedContractSubject = new BehaviorSubject(null);
    this.selectedContractObservable = this.selectedContractSubject.asObservable();
  }

  get isLoggedIn():boolean
  {
    return this.loggedIn;
  }

  get apiUrl():string
  {
    return this.apiURL;
  }

  get urlOfSelectedContract():string
  {
    return this.apiURL + `/v2/contracts/${this.selectedContract.id}`;
  }

  get selectedContract():Contract
  {
    return this.selectedContractSubject.getValue();
  }

  public async login():Promise<void>
  {
    try
    {
      const response = await this.httpClient.post<any>(`${this.apiURL}/auth`,{}, {
        headers: this.getHeaders()
      }).toPromise();
    
      if( ! response.token )
        throw new Error("No se ha podido iniciar sesion en Tellink.");

      if( ! response.contracts || ! response.contracts.length  )
        throw new Error("El usuario no tiene contratos asociados.");

      this.credentials.user = response.token;

      this.userContracts = response.contracts;

      if( this.userContracts.length )
        this.setContract( this.userContracts[0] );

      this.loggedIn = true;
    }
    catch (error)
    {
      console.error(error);
      throw new Error("No se ha podido iniciar sesión en tellink. Comuniquese con el administrador del sitio.");
    }
  }

  public setContract(contract:Contract|number):void
  {
    if( typeof contract === "number" )
      contract = this.userContracts.find(_contract => _contract.id === contract);

    this.selectedContractSubject.next( contract );
  }

  /* CENTROS DE MANDO */

  /**
   * Obtener centros de mando por contrato y provincia.
   * @param province : provincia de proyecto que se este consultando.
   * @param id : (opcional) id de contrato. Si no se especifica se seleccionara el primer contrato del usuario.
   * @returns 
   */
  public async getCmsByProvince(province:string, contractId?:number):Promise<CommandCenter[]>
  {
    try
    {
      let baseUrl = contractId ? this.apiURL + `/v2/contracts/${contractId}` : this.urlOfSelectedContract;

      return await this.httpClient.get<CommandCenter[]>(`${baseUrl}/panels?search={"province":"${province}"}`,{
        headers: this.getHeaders()
      }).toPromise();

    }
    catch (error)
    {
      console.error(error);
      throw error; 
    } 
  }

  public async createCm(data:any):Promise<any>
  {
    try
    {
      return await this.httpClient.post<any>(
        `${this.urlOfSelectedContract}/panels`,
        data,
        {
          headers: this.getHeaders()
        }
      ).toPromise();

    }
    catch (error)
    {
      console.error(error);
      throw error;
    } 
  }
 
  public async findCm(cmId:number):Promise<CommandCenter>
  {
    try
    {
      return (await this.httpClient.get<CommandCenter>(
        `${this.urlOfSelectedContract}/panels/${cmId}`,
        {
          headers: this.getHeaders()
        }
      ).toPromise())[0];

    }
    catch (error)
    {
      console.error(error);
      throw error;
    } 
  }

  public async updateCm(cmId:number, data:CommandCenter):Promise<CommandCenter>
  {
    try
    {
      return (await this.httpClient.patch<any>(
        `${this.urlOfSelectedContract}/panels/${cmId}`,
        data,
        {
          headers: this.getHeaders()
        }
      ).toPromise())[0];

    }
    catch (error)
    {
      console.error(error);
      throw error;
    } 
  }
 
  public async deleteCm(cmId:number):Promise<CommandCenter>
  {
    try
    {
      return await this.httpClient.delete<CommandCenter>(
        `${this.urlOfSelectedContract}/panels/${cmId}`,
        {
          headers: this.getHeaders()
        }
      ).toPromise();

    }
    catch (error)
    {
      console.error(error);
      throw error;
    } 
  }

  /* PERFILES DE ACTUACIONES */

  public async getPerformanceProfilesByContract(id:number):Promise<PerformanceProfile[]>
  {
    try
    {
      return await this.httpClient.get<PerformanceProfile[]>(`${this.apiURL}/v2/contracts/${id}/panels/profiles`,{
        headers: this.getHeaders()
      }).toPromise();
    }
    catch (error)
    {
      console.error(error);
      throw error; 
    } 
  }

  /* PERFILES DE ALARMAS */

  public async getAlarmProfilesByContract(id?:number):Promise<AlarmProfile[]>
  {
    try
    {
      let baseUrl = id ? this.apiURL + `/v2/contracts/${id}` : this.urlOfSelectedContract;

      return await this.httpClient.get<AlarmProfile[]>(`${baseUrl}/panels/alarm_profiles`,{
        headers: this.getHeaders()
      }).toPromise();
    }
    catch (error)
    {
      console.error(error);
      throw error; 
    } 
  }

  public async createAlarmProfile(data:AlarmProfile):Promise<CommandCenter>
  {
    try
    {
      return await this.httpClient.post<any>(
        `${this.urlOfSelectedContract}/panels/alarm_profiles`,
        data,
        {
          headers: this.getHeaders()
        }
      ).toPromise();

    }
    catch (error)
    {
      console.error(error);
      throw error;
    } 
  }

  public async findAlarmProfile(id:number):Promise<CommandCenter>
  {
    try
    {
      // api devuelve un array.
      return (await this.httpClient.get<any>(
        `${this.urlOfSelectedContract}/panels/alarm_profiles/${id}`,
        { headers: this.getHeaders() }
      ).toPromise())[0];

    }
    catch (error)
    {
      console.error(error);
      throw error;
    } 
  }

  public async updateAlarmProfile(id:number, data:AlarmProfile):Promise<CommandCenter>
  {
    try
    {
      return await this.httpClient.patch<any>(
        `${this.urlOfSelectedContract}/panels/alarm_profiles/${id}`,
        data,
        {
          headers: this.getHeaders()
        }
      ).toPromise();

    }
    catch (error)
    {
      console.error(error);
      throw error;
    } 
  }
 
  public async deleteAlarmProfile(id:number):Promise<CommandCenter>
  {
    try
    {
      return await this.httpClient.delete<any>(
        `${this.urlOfSelectedContract}/panels/alarm_profiles/${id}`,
        {
          headers: this.getHeaders()
        }
      ).toPromise();

    }
    catch (error)
    {
      console.error(error);
      throw error;
    } 
  }

  /* ACTUACIONES */

  public async getLastTenOperationsFromACm(cmId:number):Promise<Operation[]>
  {
    try
    {
      return await this.httpClient.get<Operation[]>(`${this.urlOfSelectedContract}/panels/actions?search={"panel_id":"${cmId}"}`,{
        headers: this.getHeaders()
      }).toPromise();
    }
    catch (error)
    {
      console.error(error);
      throw error; 
    } 
  }
  
  public async createOperation(data: { type: number, panel_id: number, digital_output_number: number } ):Promise<any>
  {
    try
    {
      return await this.httpClient.post<any>(
        `${this.urlOfSelectedContract}/panels/actions`,
        data,
        { headers: this.getHeaders() }
      ).toPromise();
    }
    catch (error)
    {
      console.error(error);
      throw error; 
    } 
  }

  public async updateOperation(id:number, data: {type: number, panel_id: number, digital_output_number: number } ):Promise<any>
  {
    try
    {
      return await this.httpClient.patch<any>(
        `${this.urlOfSelectedContract}/panels/actions/${id}`,
        data,
        { headers: this.getHeaders() }
      ).toPromise();
    }
    catch (error)
    {
      console.error(error);
      throw error; 
    } 
  }

  public async findOperation(id:number):Promise<any>
  {
    try
    {
      // api devuelve un array.
      return (await this.httpClient.get<any>(
        `${this.urlOfSelectedContract}/panels/actions/${id}`,
        { headers: this.getHeaders() }
      ).toPromise())[0];
    }
    catch (error)
    {
      console.error(error);
      throw error; 
    } 
  }

  /* MEDIDAS */

  public async getMeasuresPerCm(id:number, data:{frecuency:"minute"|"day"|"month",from?:string,to?:string}):Promise<(QuarterHourMeasure|DailyMonthlyMeasure)[]>
  {
    try
    { 
      return await this.httpClient.get<any>(
        `${this.urlOfSelectedContract}/panels/${id}/measures`,
        { headers: this.getHeaders(), params: data },
        
      ).toPromise();
    }
    catch (error)
    {
      console.error(error);
      throw error; 
    } 
  }

  /* ALARMAS RECIBIDAS */
  public async getReceivedAlarmsPerCm(id:number, data:{from?:string,to?:string}):Promise<ReceivedAlarm[]>
  {
    try
    { 
      return await this.httpClient.get<any>(
        `${this.urlOfSelectedContract}/panels/${id}/alarms`,
        { headers: this.getHeaders(), params: data },
        
      ).toPromise();
    }
    catch (error)
    {
      console.error(error);
      throw error; 
    } 
  }

  private getHeaders():HttpHeaders
  {
    return  new HttpHeaders({
      "Authorization": `Basic ${btoa(this.credentials.user + ':' + this.credentials.password)}`
    });
  }

}
