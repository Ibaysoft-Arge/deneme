import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';

@Injectable({
    providedIn: 'root',
})
export class SkuService {
    private apiUrl = environment.baseappurl + '/api';

    constructor(private http: HttpClient) {}

    // Yetkilendirme başlıklarını ayarla
    private getAuthHeaders(): HttpHeaders {
        const token = localStorage.getItem('token');
        return new HttpHeaders({
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        });
    }

    getSKUs(): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.get(`${this.apiUrl}/skuRoutes/sku/skuget`, { headers });
    }

    addSKU(sku: any): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.post(`${this.apiUrl}/skuRoutes/sku/skuadd`, sku, { headers });
    }

    updateSKU(id: string, sku: any): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.put(`${this.apiUrl}/skuRoutes/sku/skuupdate/${id}`, sku, { headers });
    }

    deleteSKU(id: string): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.delete(`${this.apiUrl}/skuRoutes/sku/skudelete/${id}`, { headers });
    }

    // Kategorileri yüklemek için yöntem
    getKategoriler(): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.get(`${this.apiUrl}/kategoriRoutes/kategori/get`, { headers });
    }
    addKategori(kategori: any): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.post(`${this.apiUrl}/kategoriRoutes/kategori/add`, kategori, { headers });
    }

    // Alt kategori ekleme servisi
    addAltKategori(altKategori: any): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.post(`${this.apiUrl}/kategoriRoutes/altkategori/add`, altKategori, { headers });
    }

    // Alt kategorileri tüm kategoriler için yüklemek için yöntem
    getAltKategoriler(): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.get(`${this.apiUrl}/kategoriRoutes/altkategori/get`, { headers });
    }

    // Belirli bir kategoriye ait alt kategorileri yüklemek için yöntem
    getAltKategorilerByKategoriId(kategoriId: string): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.get(`${this.apiUrl}/kategoriRoutes/altkategori/getByKategori/${kategoriId}`, { headers });
    }

    searchSkus(searchTerm: string): Observable<any[]> {
        const headers = this.getAuthHeaders();
        const params = new HttpParams().set('search', searchTerm);
        return this.http.get<any[]>(`${this.apiUrl}/skuRoutes/searchskus`, { headers, params });
    }

    searchSkusAlis(searchTerm: string): Observable<any[]> {
        const headers = this.getAuthHeaders();
        const params = new HttpParams().set('search', searchTerm);
        return this.http.get<any[]>(`${this.apiUrl}/skuRoutes/searchskusAlis`, { headers, params });
    }

    searchSkusSatis(searchTerm: string): Observable<any[]> {
        const headers = this.getAuthHeaders();
        const params = new HttpParams().set('search', searchTerm);
        return this.http.get<any[]>(`${this.apiUrl}/skuRoutes/searchskusSatis`, { headers, params });
    }

    // Alış Fiyatı Ekleme veya Güncelleme
    addOrUpdateAlisFiyat(skuId: string, baslangicTarihi: string, bitisTarihi: string, fiyat: number): Observable<any> {
        const headers = this.getAuthHeaders();
        const body = { skuId, baslangicTarihi, bitisTarihi, fiyat };
        return this.http.post(`${this.apiUrl}/skuRoutes/sku/alisfiyatadd`, body, { headers });
    }

    // SKU'ya Göre Alış Fiyatlarını Getirme
    getAlisFiyatlariBySkuId(skuId: string): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.get(`${this.apiUrl}/skuRoutes/sku/alisfiyatlari/${skuId}`, { headers });
    }

    // Satış Fiyatı Ekleme veya Güncelleme
    addOrUpdateSatisFiyat(skuId: string, baslangicTarihi: string, bitisTarihi: string, fiyat: number): Observable<any> {
        const headers = this.getAuthHeaders();
        const body = { skuId, baslangicTarihi, bitisTarihi, fiyat };
        return this.http.post(`${this.apiUrl}/skuRoutes/sku/satisfiyatadd`, body, { headers });
    }

    // SKU'ya Göre Satış Fiyatlarını Getirme
    getSatisFiyatlariBySkuId(skuId: string): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.get(`${this.apiUrl}/skuRoutes/sku/satisfiyatlari/${skuId}`, { headers });
    }
}
