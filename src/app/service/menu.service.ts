import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private apiUrl = environment.baseappurl + '/api/menu';

  constructor(private http: HttpClient) { }

  // Yetkilendirme başlıklarını ayarla
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // Yetkilendirme başlıklarını ayarla
  private getAuthHeadersForQR(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  // Yeni menü ekle
  addMenu(menu: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/add`, menu, { headers });
  }

  // Kullanıcıya ait menüleri getir
  getMenusByUser(userId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/getByUser`, { headers, params: { userId } });
  }

  // Menüye  ait ürün Kategorileri getir
  getProductCategories(menuId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/getProductCategories/${menuId}`, { headers });
  }

  // Menüye  ait ürün Kategorileri getir
  getProductCategoriesForQR(menuId: string, userId: string): Observable<any> {
    const headers = this.getAuthHeadersForQR();

    let params = new HttpParams()
      .set('menuId', menuId)
      .set('userID', userId);

    return this.http.get(`${this.apiUrl}/getProductCategoriesForQR`, { headers, params });
  }

  getDynamicPricingByMenuForQR(menuId: string, kategoriId: string, userId: string, clusterId?: string): Observable<any> {
    const headers = this.getAuthHeaders();
    
    let params = new HttpParams()
      .set('menuId', menuId)
      .set('kategoriId', kategoriId)
      .set('userID', userId);
      
    if (clusterId) {
      params = params.set('clusterId', clusterId);
    }

    return this.http.get(`${this.apiUrl}/getDynamicPricingByMenuForQR`, { headers, params });
  }

  getDynamicPricingByMenu(menuId: string, kategoriId: string, clusterId?: string): Observable<any> {
    const headers = this.getAuthHeaders();
    let params = new HttpParams()
      .set('menuId', menuId)
      .set('kategoriId', kategoriId);
    if (clusterId) {
      params = params.set('clusterId', clusterId);
    }

    return this.http.get(`${this.apiUrl}/getDynamicPricingByMenu`, { headers, params });
  }


  // Tüm menüleri getir
  getMenus(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/get`, { headers });
  }

  // Belirli bir menüyü getir
  getMenuById(id: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/get/${id}`, { headers });
  }

  // Menüyü güncelle
  updateMenu(id: string, menu: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put(`${this.apiUrl}/update/${id}`, menu, { headers });
  }

  // Menüyü sil
  deleteMenu(id: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete(`${this.apiUrl}/delete/${id}`, { headers });
  }
}
