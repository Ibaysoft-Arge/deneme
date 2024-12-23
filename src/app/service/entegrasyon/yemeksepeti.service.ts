// src/app/service/paket.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';

@Injectable({
    providedIn: 'root',
})
export class YemekSepetiService {
    private apiUrl = environment.baseappurl + '/api/yemeksepeti'; 

    constructor(private http: HttpClient) { }

    private getAuthHeaders(): HttpHeaders {
        const token = localStorage.getItem('token');
        return new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        });
    }

    getYemekSepetiEntegrasyonBilgileri(): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.get(`${this.apiUrl}/yemeksepetiBilgi`, { headers });
    }

    updateYemekSepetiEntegrasyon(entegrasyonBilgileri: any): Observable<any> {
        const body = { entegrasyonBilgileri };
        const headers = this.getAuthHeaders();
        return this.http.post(`${this.apiUrl}/updateYemekSepetiBilgileri`, body, { headers });
    }

    addYemekSepetiBilgileri(addYemekSepetiBilgileri: any): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.post(`${this.apiUrl}/addYemekSepetiBilgi`, addYemekSepetiBilgileri, { headers });
    }

}
