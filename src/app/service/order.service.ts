import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';

@Injectable({
    providedIn: 'root',
})
export class OrderService {
    private readonly baseUrl = environment.baseappurl + '/api/satiskaynak'; // API temel URL

    private readonly apiUrl = environment.baseappurl + '/api/orderRoutes'; // API temel URL
    constructor(private http: HttpClient) { }

    // Yetkilendirme başlıklarını ayarla
    private getAuthHeaders(): HttpHeaders {
        const token = localStorage.getItem('token');
        return new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        });
    }

    createOrder(orderData: any): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.post(`${this.apiUrl}/add`, orderData, { headers });
    }

    getOrder(orderId: string): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.get(`${this.apiUrl}/${orderId}`, { headers });
    }
    getOrderHesapFisi(orderId: string): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.get(`${this.apiUrl}/detay/${orderId}`, { headers });
    }

    getOrderItemStatus(orderId: string, itemId: string): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.get(
            `${this.apiUrl}/getstatus/${orderId}/item/${itemId}/status`,
            { headers }
        );
    }
    updateOrder(orderId: string, orderData: any): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.put(`${this.apiUrl}/update/${orderId}`, orderData, { headers });
    }
    /**
     * Satis kaynaklarını tek bir tip filtresiyle getirir.
     * @param tip Tip parametresi (örnek: 'masa', 'gelal')
     * @returns Satış kaynakları listesi
     */
    getSatisKaynak(tip: string): Observable<any> {
        const headers = this.getAuthHeaders();
        const params = new HttpParams().set('tip', tip); // Tip parametresini ayarla

        return this.http.get<any>(`${this.baseUrl}/getEkran`, { headers, params });
    }


    posthesapFisi(orderData: any): Observable<any> {


        return this.http.post<any>(`http://localhost:41411/api/receipt/print`, orderData);
    }


    getKitchenItems(storeId: string): Observable<any[]> {
        const headers = this.getAuthHeaders();
        return this.http.post<any[]>(`${this.apiUrl}/list`, { store: storeId }, { headers });
      }

    updateItemStatus(orderId: string, urunId: string, yeniStatu: string): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.put<any>(`${this.apiUrl}/updateItemStatus`, { orderId, urunId, yeniStatu },{headers});
    }

    getSatisKaynakForQR(tip: string, userID: string): Observable<any> {
        const params = new HttpParams()
            .set('tip', tip) // İlk parametre
            .set('userID', userID); // İkinci parametre

        return this.http.get<any>(`${this.baseUrl}/getEkranForQR`, { params });
    }



}
