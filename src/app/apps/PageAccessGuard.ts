import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { err } from '@matheo/text-mask/core/conformToMask';
import { environment } from 'src/environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class PageAccessGuard implements CanActivate {

  private apiUrl = environment.baseappurl+'/api'; // Backend URL, uygun şekilde değiştirin

  constructor(private http: HttpClient, private router: Router) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    let pageCode = route.routeConfig?.path;

    if (pageCode) {
      pageCode = pageCode.replace('apps/', ''); // "apps/" kısmını kaldırıyoruz
    }

    console.log('Access check for page:', pageCode);
    return this.getPageRoutes(pageCode!).pipe(
      tap(response => {
        // Yanıtın kontrol edilmesi
        console.log('API Response:', response);
      }),
      map((response: any) => {
        // Yanıt kontrolü burada yapılıyor
        if (response && response.accessGranted) {
          return true;
        } else {
          // Yanıt beklenmeyen formatta veya erişim izni yoksa hata oluştur
          throw new Error('Erişim izni verilmedi');
        }
      }),
      catchError((error) => {
        console.error('Error during access check:', error);
        if (error.status === 403) {
          const errorMessage = error.error?.message || 'Access denied or subscription expired.';
          alert(errorMessage);
        } else if (error.status !== 200) {
            if(error.status == 401)
            {
                this.router.navigate(['/auth/cover-login']);
                return of(false); // Erişimi reddet
            }
          const errorMessage = error.error?.message || 'Access denied or subscription expired.';
          alert(errorMessage);
        }

        this.router.navigate(['/users/profile']);
        return of(false);
      })
    );
  }

  getPageRoutes(pageCode: string): Observable<any> {
    const token = localStorage.getItem('token'); // LocalStorage'dan token'i al
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // Token'i Authorization başlığına ekle
    });

    return this.http.get(`${this.apiUrl}/pageRoutes/sayfa/${pageCode}`, { headers });
  }
}
