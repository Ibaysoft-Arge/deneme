import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from 'src/environments/environment.prod';

@Injectable({
    providedIn: 'root',
})
export class CurrencyService {
    private selectedCurrency: string = 'TRY'; // Varsayılan para birimi
    private selectedCurrency$ = new BehaviorSubject<string>(this.selectedCurrency);

    private apiUrl = environment.baseappurl + '/api/user-settings';

    constructor(private http: HttpClient) {
        // Servis yüklenirken mevcut para birimini al
        
    }

    private getAuthHeaders(): HttpHeaders {
        const token = localStorage.getItem('token');
        return new HttpHeaders({
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        });
    }

    setCurrency(currency: string): void {
        this.selectedCurrency = currency;
        this.selectedCurrency$.next(currency);
    }

    getCurrency(): string {
        if (!this.selectedCurrency) {
            this.loadCurrencyFromApi();
            return this.selectedCurrency;
        } else {
            return this.selectedCurrency;
        }
    }

    getCurrencyForQR(userid: string): string {
        if (!this.selectedCurrency) {
            this.loadCurrencyQrFromApi(userid);
            return this.selectedCurrency;
        } else {
            return this.selectedCurrency;
        }
    }

    updateCurrency(currency: any): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.put<any>(`${this.apiUrl}/updateCurrency`, currency, { headers }).pipe(
            tap(() => {
                // Güncellemeden sonra local değişkene ve BehaviorSubject'e ata
                this.setCurrency(currency);
            }),
        );
    }

    private loadCurrencyQrFromApi(userid: string): void {
        this.gCurrencyForQR(userid).subscribe({
            next: (data) => {
                // console.log('Para birimi alındı:', data.currency);
                this.selectedCurrency = data.currency.toString();
                this.selectedCurrency$.next(this.selectedCurrency); // BehaviorSubject güncelle
            },
            error: (err: any) => {
                console.error('Para birimi alınırken hata oluştu:', err);
            },
        });
    }
    private loadCurrencyFromApi(): void {
        this.gCurrency().subscribe({
            next: (data) => {
                // console.log('Para birimi alındı:', data.currency);
                this.selectedCurrency = data.currency.toString();
                this.selectedCurrency$.next(this.selectedCurrency); // BehaviorSubject güncelle
            },
            error: (err: any) => {
                console.error('Para birimi alınırken hata oluştu:', err);
            },
        });
    }

    gCurrency(): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.get<any>(`${this.apiUrl}/getCurrency`, { headers });
    }

    gCurrencyForQR(id: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/getCurrencyForQR/${id}`);
    }
}
