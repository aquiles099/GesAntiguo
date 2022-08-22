import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AuthenticationService } from '../../authentication.service';

export class CrudService
{
    protected baseUrl: string;

    constructor(
        protected httpClient: HttpClient,
        protected _authenticationService: AuthenticationService,
        protected resourceUrl:string
    ) {
        this.baseUrl = `${environment.administrationApi}/${resourceUrl}`;
    }

    public async all(): Promise<any[]>
    {
        try
        {
            let headers = this._authenticationService.getBasicAuthenticationHeader();

            return (
                await this.httpClient.get<any>(`${this.baseUrl}`, { headers }).toPromise()
            ).data;

        }
        catch (error) {
            console.error(error.message);
            throw error;
        }
    }

    public async store(data: FormData|Object): Promise<any> {
        try {

            let headers = this._authenticationService.getBasicAuthenticationHeader();

            return (
                await this.httpClient.post<any>(`${this.baseUrl}`, data, { headers }).toPromise()
            ).data;

        }
        catch (error) {
            console.error(error.message);
            throw error;
        }
    }

    public async find(id: number): Promise<any> {
        try {
            let headers = this._authenticationService.getBasicAuthenticationHeader();

            return (
                await this.httpClient.get<any>(`${this.baseUrl}/${id}`, { headers }).toPromise()
            ).data;

        }
        catch (error) {
            console.error(error.message);
            throw error;
        }
    }

    public async update(id: number, data: FormData|Object): Promise<any> {
        try {
            let headers = this._authenticationService.getBasicAuthenticationHeader();

            data instanceof FormData ?
            data.append("_method", "PUT") :
            data["_method"] = "PUT";

            return (
                await this.httpClient.post<any>(`${this.baseUrl}/${id}`, data, { headers }).toPromise()
            ).data;

        }
        catch (error) {
            console.error(error.message);
            throw error;
        }
    }

    public async delete(id: number): Promise<any> {
        try {
            let headers = this._authenticationService.getBasicAuthenticationHeader();

            return (
                await this.httpClient.delete<any>(`${this.baseUrl}/${id}`, { headers }).toPromise()
            ).data;

        }
        catch (error) {
            console.error(error.message);
            throw error;
        }
    }
}
