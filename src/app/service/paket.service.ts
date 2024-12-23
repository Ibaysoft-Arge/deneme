// src/app/service/paket.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';

@Injectable({
    providedIn: 'root', // Bu şekilde service'i kök modülde sağlayabiliriz
})
export class PaketService {
    private apiUrl = environment.baseappurl + '/api/paket'; // API URL'sini buraya ekleyin
    private apiUrlAdmin = environment.baseappurl + '/api';

    constructor(private http: HttpClient) { }

    // Yetkilendirme başlıklarını ayarla
    private getAuthHeaders(): HttpHeaders {
        const token = localStorage.getItem('token');
        return new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        });
    }

    getSayfalar(): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.get(`${this.apiUrl}/getSayfalar`, { headers });
    }


    getSayfalarUser(): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.get(`${this.apiUrl}/getSayfalarUser`, { headers });
    }
    getUserPayment(): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.get(`${this.apiUrl}/getPaketlerByUserId`, { headers });
    }

    getUserPaymentHistory(): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.get(`${this.apiUrl}/getPaymentHistory`, { headers });
    }

    getFirmaInfo(): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.get(`${this.apiUrlAdmin}/firma/getByFirma`, { headers });
    }

    updateFirmaInfo(id: string, firmaAdi: string, adres: string, telefon: string, email: string): Observable<any> {
        const body = { firmaAdi, adres, telefon, email };
        const headers = this.getAuthHeaders();
        return this.http.put(`${this.apiUrlAdmin}/firma/update/${id}`, body, { headers });
    }

    addPaket(paketAdi: string, aylikFiyati: number, yillikFiyati: number, kullaniciSayisi: number,magazaSayisi: number, aktifmi: boolean): Observable<any> {
        const body = { paketAdi, aylikFiyati, yillikFiyati, kullaniciSayisi,magazaSayisi, aktifmi };
        const headers = this.getAuthHeaders();

        // Kullanıcı ID'sini URL'ye ekleyin
        return this.http.post(`${this.apiUrlAdmin}/paket/addPaket`, body, { headers });
    }

    updatePaket(paketId: string, paketAdi: string, aylikFiyati: number, yillikFiyati: number, kullaniciSayisi: number,magazaSayisi: number, aktifmi: boolean): Observable<any> {
        const body = { paketAdi, aylikFiyati, yillikFiyati, kullaniciSayisi,magazaSayisi, aktifmi };
        const headers = this.getAuthHeaders();
        // paketId'yi URL'ye ekleyerek güncelleme işlemi yapın
        return this.http.put(`${this.apiUrlAdmin}/paket/updatePaket/${paketId}`, body, { headers });
    }


    getPaketler(): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.get(`${this.apiUrl}/getPaket`, { headers });
    }

    getPaketlerWithoutAuth(): Observable<any> {
        const headers = new HttpHeaders({
            'Content-Type': 'application/json',
        });
        return this.http.get(`${this.apiUrl}/getPaketler`, { headers });
    }

    getModuller(): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.get(`${this.apiUrl}/getModuller`, { headers });
    }

    addModul(name: string, kodu: string, fiyat: number, yillikFiyat: number, aktifmi: boolean, freemi: boolean, paket: string[]): Observable<any> {
        const body = { name, kodu, fiyat, yillikFiyat, aktifmi, freemi, paket };
        const headers = this.getAuthHeaders();
        // Kullanıcı ID'sini URL'ye ekleyin
        return this.http.post(`${this.apiUrl}/addModul`, body, { headers });
    }

    // Modül güncelleme servisi
    updateModul(id: string, updatedModul: any): Observable<any> {
        const headers = this.getAuthHeaders();
        // PUT request ile güncellemeyi gerçekleştiriyoruz
        return this.http.put(`${this.apiUrl}/updateModul/${id}`, updatedModul, { headers });
    }
    updateAltModul(id: string, name: string, modul: string[]): Observable<any> {
        const body = { name, modul };
        const headers = this.getAuthHeaders();
        return this.http.put(`${this.apiUrl}/updateAltModul/${id}`, body, { headers });
    }
    updateSayfa(id: string, name: string, kod: string, aktifmi: boolean, fiyat: number, yillikFiyat: number, paketeDahilmi: boolean, altModul: string[], roller: string[]): Observable<any> {
        const body = { name, kod, aktifmi, fiyat, yillikFiyat, paketeDahilmi, altModul ,roller};
        const headers = this.getAuthHeaders();
        return this.http.put(`${this.apiUrl}/updateSayfa/${id}`, body, { headers });
    }
    addAltModul(name: string, modul: string[]): Observable<any> {
        const body = { name, modul };
        const headers = this.getAuthHeaders();
        // Kullanıcı ID'sini URL'ye ekleyin
        return this.http.post(`${this.apiUrl}/addAltModul`, body, { headers });
    }

    getAltModul(): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.get(`${this.apiUrl}/getAltModuller`, { headers });
    }
    getAll(): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.get(`${this.apiUrl}/getAll`, { headers });
    }
    addSayfa(kod: string, name: string, aktifmi: boolean, fiyat: number, yillikFiyat: number, paketeDahilmi: boolean, altModul: string[], roller: string[]): Observable<any> {
        const body = { kod, name, aktifmi, fiyat, yillikFiyat, paketeDahilmi, altModul ,roller};
        const headers = this.getAuthHeaders();
        // Kullanıcı ID'sini URL'ye ekleyin
        return this.http.post(`${this.apiUrl}/addSayfa`, body, { headers });
    }



    getSayfa(): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.get(`${this.apiUrl}/getSayfa`, { headers });
    }



    paketModulRelation(paketId: string, modulId: string): Observable<any> {
        const body = { paketId, modulId };
        const headers = this.getAuthHeaders();
        // Kullanıcı ID'sini URL'ye ekleyin
        return this.http.post(`${this.apiUrl}/paketModulRelation`, body, { headers });
    }

    modulAltModulRelation(modulId: string, altModulId: string): Observable<any> {
        const body = { modulId, altModulId };
        const headers = this.getAuthHeaders()
        // Kullanıcı ID'sini URL'ye ekleyin
        return this.http.post(`${this.apiUrl}/moduLAltModulRelation`, body, { headers });
    }

    altModulSayfaRelation(altModulId: string, sayfaId: string): Observable<any> {
        const body = { altModulId, sayfaId };
        const headers = this.getAuthHeaders();
        // Kullanıcı ID'sini URL'ye ekleyin
        return this.http.post(`${this.apiUrl}/altModulSayfaRelation`, body, { headers });
    }
}
