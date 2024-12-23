// report.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';

@Injectable({
    providedIn: 'root',
})
export class ReportService {
    private apiUrl = environment.baseappurl + '/api/orderRoutes'; // Backend URL

    constructor(private http: HttpClient) { }

    // Yetkilendirme başlıklarını ayarla
    private getAuthHeaders(): HttpHeaders {
        const token = localStorage.getItem('token');
        return new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        });
    }
    getRegionSales(body: any): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.post<any>(`${this.apiUrl}/report/region-sales-report`, body, { headers });
      }
    getAvailableReports(): Observable<any[]> {
        const headers = this.getAuthHeaders();
        return this.http.get<any[]>(`${this.apiUrl}/reports`, { headers });
    }

    getReportDefinition(reportType: string): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.get<any>(`${this.apiUrl}/reports/${reportType}/definition`, { headers });
    }
    runReport(config: any): Observable<any[]> {
        const headers = this.getAuthHeaders();
        return this.http.post<any[]>(`${this.apiUrl}/reports/runDynamic`, config, { headers });
    }
    getTopProducts(body: any): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.post(`${this.apiUrl}/report/top-products`, body, { headers });
    }

    getSparisList(body: any): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.post(`${this.apiUrl}/report/listAll`, body, { headers });
    }
    getAdisyonlarSource(body: any): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.post(`${this.apiUrl}/report/adsiyons-by-source`, body, { headers });


      }
    // Gelir raporu (Revenue report) çoklu rapor tipi ile
    getRevenueReport(body: any): Observable<any> {
        const headers = this.getAuthHeaders();

        return this.http.post(`${this.apiUrl}/report/date-range`, body, { headers });
    }
    getStoreSources(body: any): Observable<any> {
        const headers = this.getAuthHeaders();

        return this.http.post(`${this.apiUrl}/report/store-sources`, body, { headers });
    }
    getVerimlilik(body: any): Observable<any> {
        const headers = this.getAuthHeaders();

        return this.http.post(`${this.apiUrl}/report/verimlilik`, body, { headers });
    }


    getDailyOrdersComparison(magazaKodlari: any): Observable<any> {
        const headers = this.getAuthHeaders();

        return this.http.post(`${this.apiUrl}/report/daily-orders-comparison`, magazaKodlari, { headers });
    }
    getLastOrders(magazaKodlari: any): Observable<any> {
        const headers = this.getAuthHeaders();

        return this.http.post(`${this.apiUrl}/report/recent-orders`, magazaKodlari, { headers });
    }
    getStoreProductSales(data: { magazaKodlari: string[], startDate?: string, endDate?: string }): Observable<any> {
        const headers = this.getAuthHeaders();

        return this.http.post(`${this.apiUrl}/report/store-product-sales-with-sub`, data, { headers });
    }
    getStoreRevenue(data: { magazaKodlari: string[], startDate?: string, endDate?: string }): Observable<any> {
        const headers = this.getAuthHeaders();

        return this.http.post(`${this.apiUrl}/report/store-revenue`, data, { headers });
    }

    getOdbData(body: any) {
        const headers = this.getAuthHeaders();
        return this.http.post(`${this.apiUrl}/report/odb`, body, { headers });
    }
    getMonthlyStoreRevenue(body: any) {
        const headers = this.getAuthHeaders();
        return this.http.post(`${this.apiUrl}/report/payment-type-revenue`, body, { headers });
    }

    getSourceOrders(body: any) {
        const headers = this.getAuthHeaders();
        return this.http.post<any[]>(`${this.apiUrl}/report/source-orders`, body, { headers });
    }

    getHourlyData(body: any) {
        const headers = this.getAuthHeaders();
        return this.http.post<any[]>(`${this.apiUrl}/report/hourly-data`, body, { headers });
    }
    getDailyStoreRevenueDate(body: any) {
        const headers = this.getAuthHeaders();
        return this.http.post<any[]>(`${this.apiUrl}/report/daily-store-revenue-date`, body, { headers });
    }



    getDailyStoreRevenueDateOdeme(body: any) {
        const headers = this.getAuthHeaders();
        return this.http.post<any[]>(`${this.apiUrl}/report/payment-type-revenue`, body, { headers });
    }

    getPaymentTypeReport(body: any) {
        const headers = this.getAuthHeaders();
        return this.http.post<any[]>(`${this.apiUrl}/report/payment-by-store`, body, { headers });
    }

    getDailyStoreRevenue(magazaKodlari: any): Observable<any> {
        const headers = this.getAuthHeaders();

        return this.http.post(`${this.apiUrl}/report/daily-store-revenue`, magazaKodlari, { headers });
    }
    getHourlySalesByStore(body: any): Observable<any> {
        const headers = this.getAuthHeaders();

        return this.http.post(`${this.apiUrl}/report/hourly-sales-by-store`, body, { headers });
    }

    getHourlySales(body: any): Observable<any> {
        const headers = this.getAuthHeaders();

        return this.http.post(`${this.apiUrl}/report/hourly-sales`, body, { headers });
    }


    getDailyEndExpected(storeId: string, date: string): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.get<any>(`${this.apiUrl}/report/daily-end?storeId=${storeId}&date=${date}`,{ headers });
      }

      getStockMovements(params: { skuId: string; startDate: string; endDate: string }): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.get<any>(`${this.apiUrl}/report/stock-movements`, {
          headers,
          params // Angular otomatik olarak skuCode, startDate, endDate query parametresi yapar.
        });
      }



      // Gün sonu raporunu kaydet
      submitDailyEndReport(data: { date: string, storeId: string, countedTotals: { [key: string]: number } }): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.post<any>(`${this.apiUrl}/report/daily-end`, data,{ headers });
      }

      revertDailyEnd(body:any): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.post<any>(`${this.apiUrl}/report/daily-end-revert`, body,{ headers });
      }


      // Gün sonu rapor geçmişi al
      getDailyEndHistory(storeId?: string, startDate?: string, endDate?: string): Observable<any> {
        const headers = this.getAuthHeaders();
        let params = [];
        if (storeId) params.push(`storeId=${storeId}`);
        if (startDate && endDate) params.push(`startDate=${startDate}&endDate=${endDate}`);
        const query = params.length > 0 ? '?' + params.join('&') : '';
        return this.http.get<any>(`${this.apiUrl}/report/daily-end-history${query}` ,{ headers });
      }



}
