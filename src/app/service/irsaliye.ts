import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';

@Injectable({
    providedIn: 'root'
})
export class IrsaliyeService {
    private apiUrl = environment.baseappurl + '/api';

    constructor(private http: HttpClient) { }


    // Yetkilendirme başlıklarını ayarla
    private getAuthHeaders(): HttpHeaders {
        const token = localStorage.getItem('token');
        return new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        });
    }

    getCikisIrsaliye(): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.get(`${this.apiUrl}/irsaliye/getCikisIrsaliye`, { headers });
    }

    addCikisIrsaliye(cikisIrsaliye: any): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.post(`${this.apiUrl}/irsaliye/addCikisIrsaliye`, cikisIrsaliye, { headers });
    }

    updateCikisIrsaliye(id: string, cikisIrsaliye: any): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.put(`${this.apiUrl}/irsaliye/updateCikisIrsaliye/${id}`, cikisIrsaliye, { headers });
    }

    deleteCikisIrsaliye(id: string): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.delete(`${this.apiUrl}/irsaliye/deleteCikisIrsaliye/${id}`, { headers });
    }

    
    getGirisIrsaliye(): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.get(`${this.apiUrl}/irsaliye/getGirisIrsaliye`, { headers });
    }

    addGirisIrsaliye(girisIrsaliye: any): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.post(`${this.apiUrl}/irsaliye/addGirisIrsaliye`, girisIrsaliye, { headers });
    }

    updateGirisIrsaliye(id: string, girisIrsaliye: any): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.put(`${this.apiUrl}/irsaliye/updateGirisIrsaliye/${id}`, girisIrsaliye, { headers });
    }

    deleteGirisIrsaliye(id: string): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.delete(`${this.apiUrl}/irsaliye/deleteGirisIrsaliye/${id}`, { headers });
    }

    addCikisIrsaliyeSku(cikisIrsaliye: any): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.post(`${this.apiUrl}/irsaliye/addCikisIrsaliyeSku`, cikisIrsaliye, { headers });
    }

    updateCikisIrsaliyeSku(id: string, cikisIrsaliye: any): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.put(`${this.apiUrl}/irsaliye/updateCikisIrsaliyeSku/${id}`, cikisIrsaliye, { headers });
    }

    getCikisIrsaliyeSku(id: string): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.get(`${this.apiUrl}/irsaliye/getCikisIrsaliyeSku/${id}`, { headers });
    }

    searchIrsaliye(searchTerm: string): Observable<any[]> {
        const headers = this.getAuthHeaders();
        let params = new HttpParams().set('search', searchTerm);
        return this.http.get<any[]>(`${this.apiUrl}/irsaliye/searchirsaliye`, { headers, params });
    }

    deleteCikisIrsaliyeSku(id: string): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.delete(`${this.apiUrl}/irsaliye/deleteCikisIrsaliyeSku/${id}`, { headers });
    }

    searchIrsaliyeGiris(searchTerm: string): Observable<any[]> {
        const headers = this.getAuthHeaders();
        let params = new HttpParams().set('search', searchTerm);
        return this.http.get<any[]>(`${this.apiUrl}/irsaliye/searchIrsaliyeGiris`, { headers, params });
    }

    updateGirisIrsaliyeSku(id: string, girisIrsaliye: any): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.put(`${this.apiUrl}/irsaliye/updateGirisIrsaliyeSku/${id}`, girisIrsaliye, { headers });
    }

    deleteGirisIrsaliyeSku(id: string): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.delete(`${this.apiUrl}/irsaliye/deleteGirisIrsaliyeSku/${id}`, { headers });
    }

}
