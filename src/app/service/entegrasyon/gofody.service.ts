// src/app/service/paket.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';

@Injectable({
    providedIn: 'root',
})
export class GofodyService {
    private apiUrl = environment.baseappurl + '/api/gofody'; 

    constructor(private http: HttpClient) { }

    private getAuthHeaders(): HttpHeaders {
        const token = localStorage.getItem('token');
        return new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        });
    }

    getGofodyEntegrasyonBilgileri(): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.get(`${this.apiUrl}/gofodyBilgi`, { headers });
    }

    updateGofodyEntegrasyon(entegrasyonBilgileri: any): Observable<any> {
        const body = { entegrasyonBilgileri };
        const headers = this.getAuthHeaders();
        return this.http.post(`${this.apiUrl}/updateGofodyBilgileri`, body, { headers });
    }

    addGofodyBilgileri(addGofodyBilgileri: any): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.post(`${this.apiUrl}/addGofodyBilgi`, addGofodyBilgileri, { headers });
    }

}
