// src/app/service/paket.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';

@Injectable({
    providedIn: 'root',
})
export class TrendyolService {
    private apiUrl = environment.baseappurl + '/api/trendyol'; 

    constructor(private http: HttpClient) { }

    private getAuthHeaders(): HttpHeaders {
        const token = localStorage.getItem('token');
        return new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        });
    }

    getTrendyolEntegrasyonBilgileri(): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.get(`${this.apiUrl}/trendyolBilgi`, { headers });
    }

    updateTrendyolEntegrasyon(entegrasyonBilgileri: any): Observable<any> {
        const body = { entegrasyonBilgileri };
        const headers = this.getAuthHeaders();
        return this.http.post(`${this.apiUrl}/updateTrendyolBilgileri`, body, { headers });
    }

    addTrendyolBilgileri(addTrendyolBilgileri: any): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.post(`${this.apiUrl}/addTrendyolBilgi`, addTrendyolBilgileri, { headers });
    }

}
