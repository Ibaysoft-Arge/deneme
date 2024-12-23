// src/app/service/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { EMPTY, Observable, tap } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { of } from 'rxjs'; // of operatoru, bir Observable döndürmek için kullanılır
import { environment } from 'src/environments/environment.prod';

@Injectable({
    providedIn: 'root',
})
export class AuthService {

    private apiUrl = environment.baseappurl + '/api/auth';

    constructor(private http: HttpClient) { }

    login(kullaniciAdi: string, sifre: string): Observable<any> {
        const body = { kullaniciAdi, sifre };
        const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

        return this.http.post(`${this.apiUrl}/login`, body, { headers }).pipe(
            tap((response: any) => {
                if (response && response.token) {
                    this.setToken(response.token); // Token’i kaydeder
                }
            }),
            switchMap((response: any) => {
                if (response && response.token) {
                    return this.getUserFromServer().pipe(
                        catchError((error) => {
                            console.error('Kullanıcı verileri alınırken hata:', error);
                            return of(null); // Hata durumunda null döndür
                        })
                    );
                } else {
                    return EMPTY;
                }
            }),
            tap((userData) => {
                if (userData) {
                    // console.log('Kullanıcı verileri:', userData);
                } else {
                    console.log('Kullanıcı verileri alınamadı.');
                }
            })
        );
    }


    register(kullaniciAdsoyad: string, kullaniciAdi: string, sifre: string, email: string, telefon: string, kvkk: boolean): Observable<any> {
        const body = { kullaniciAdsoyad, kullaniciAdi, sifre, email, telefon, kvkk };
        const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
        return this.http.post(`${this.apiUrl}/register`, body, { headers });
    }

    // decodeToken(token: string): any {
    //     try {
    //       // Token geçerli bir JWT ise çözümleme yap
    //       const decoded: any = jwt_decode.jwtDecode(token);
    //       return decoded; // Çözümlemeden elde edilen veriyi döndür
    //     } catch (error) {
    //       console.error('Token çözümleme hatası:', error);
    //       return null; // Hata durumunda null döndür
    //     }
    //   }

    parseJwt(token: string): any {
        try {
            // Split the JWT to get the payload part
            const base64Url = token.split('.')[1];

            // Decode the Base64 URL encoded string
            const base64 = decodeURIComponent(
                atob(base64Url)
                    .split('')
                    .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );

            // Parse and return the JSON object
            return JSON.parse(base64);
        } catch (error) {
            console.error('Error parsing JWT:', error);
            return null; // Return null if there’s an error
        }
    }

    getUserFromServer(): Observable<any> {
        const token = localStorage.getItem('token'); // LocalStorage'dan token'i al
        const headers = new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // Token'i Authorization başlığına ekle
        });

        return this.http.get(`${this.apiUrl}/user`, { headers }).pipe(
            tap((response: any) => {
                if (response) {

                    // Gelen veriden avatar ve kullaniciAdi'yi al ve localStorage'a kaydet
                    localStorage.setItem('avatar', response.avatar);
                    localStorage.setItem('parentUser', response.parentUser);
                    localStorage.setItem('kullaniciAdi', response.kullaniciAdi);
                    localStorage.setItem('userid', response._id);
                    localStorage.setItem('email', response.email);
                    localStorage.setItem('role', response.role.name);
                    localStorage.setItem('paketAdi', response.paketBilgisi.paketAdi);
                    localStorage.setItem('magazalar', JSON.stringify(response.magaza));
                }
            })
        );
    }

    // Token’i localStorage'a kaydetme işlevi
    private setToken(token: string): void {
        localStorage.setItem('token', token);
    }

    //LocalStorage’dan token’i silme işlevi (logout için)
    logout(): void {
        localStorage.removeItem('avatar');
        localStorage.removeItem('token');
        localStorage.removeItem('kullaniciAdi');
    }

    // Token’i kontrol etme işlevi (kullanıcı giriş yapmış mı diye kontrol edilebilir)
    isAuthenticated(): boolean {
        return !!localStorage.getItem('token'); // Token varsa true döner, yoksa false döner
    }

    sendEmail(email: string, lang: string): Observable<any> {
        const body = { email, lang };
        const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
        return this.http.post(`${this.apiUrl}/sendEmail`, body, { headers });
    }

    resetPassword(userId: string, guid: string, newPassword: string): Observable<any> {
        const body = { userId, guid, newPassword };
        const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
        return this.http.post(`${this.apiUrl}/resetPassword`, body, { headers });
    }

    updateProfile(userId: string, kullaniciAdi: string, email: string, telefon: string, faturaBilgileri: string, kvkk: boolean, paketBilgisi: string, avatar: string): Observable<any> {
        const body = { userId, kullaniciAdi, email, telefon, faturaBilgileri, kvkk, paketBilgisi, avatar };
        const token = localStorage.getItem('token');
        const headers = new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // Token'i Authorization başlığına ekle
        });
        return this.http.put(`${this.apiUrl}/updateByKullaniciId`, body, { headers });
    }

    getSayacBilgileri(): Observable<any> {
        const headers = new HttpHeaders({
            'Content-Type': 'application/json',
        });
        return this.http.get(`${this.apiUrl}/getSayacBilgileri`, { headers });
    }
}
