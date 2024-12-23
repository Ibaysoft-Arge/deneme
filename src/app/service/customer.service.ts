import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';

@Injectable({
    providedIn: 'root'
})
export class CustomerService {
    private apiUrl = environment.baseappurl + '/api/customers';

    constructor(private http: HttpClient) { }
    // Yetkilendirme başlıklarını ayarla
    private getAuthHeaders(): HttpHeaders {
        const token = localStorage.getItem('token');
        return new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        });
    }

    getCustomer(): Observable<any[]> {
        const headers = this.getAuthHeaders();
        return this.http.get<any[]>(`${this.apiUrl}/get`, { headers });
    }

    getCustomerById(cumstomerID: string): Observable<any[]> {
        const headers = this.getAuthHeaders();
        return this.http.get<any[]>(`${this.apiUrl}/get/${cumstomerID}`, { headers });
    }
    addCustomer(customer: any): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.post<any>(`${this.apiUrl}/addCustomer`, customer, { headers });
    }
    updateCustomer(customerId: string, customerData: any): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.put<any>(`${this.apiUrl}/updateCustomer`, { id: customerId, ...customerData }, { headers });
      }

    // searchCustomer(searchTerm: string): Observable<any[]> {
    //   const headers = this.getAuthHeaders();
    //   let params = new HttpParams().set('search', searchTerm);
    //   return this.http.get<any[]>(`${this.apiUrl}/searchcustomers`, { headers, params });
    // }

    searchCustomer(phone: string): Observable<any[]> {
        const headers = this.getAuthHeaders();
        const params = new HttpParams().set('phone', phone); // 'phone' parametresi sorgu parametresi olarak ekleniyor
        const url = `${this.apiUrl}/searchcustomers`; // API endpoint
        return this.http.get<any[]>(url, { headers, params });
    }

}
