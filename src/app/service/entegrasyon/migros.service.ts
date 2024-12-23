// src/app/service/paket.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';

@Injectable({
    providedIn: 'root',
})
export class MigrosService {
    private apiUrl = environment.baseappurl + '/api/migros'; 

    constructor(private http: HttpClient) { }

    private getAuthHeaders(): HttpHeaders {
        const token = localStorage.getItem('token');
        return new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        });
    }

    getMigrosEntegrasyonBilgileri(): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.get(`${this.apiUrl}/migrosBilgi`, { headers });
    }

    updateMigrosEntegrasyon(entegrasyonBilgileri: any): Observable<any> {
        const body = { entegrasyonBilgileri };
        const headers = this.getAuthHeaders();
        return this.http.post(`${this.apiUrl}/updateMigrosBilgileri`, body, { headers });
    }

    addMigrosBilgileri(addMigrosBilgileri: any): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.post(`${this.apiUrl}/addMigrosBilgi`, addMigrosBilgileri, { headers });
    }

}
