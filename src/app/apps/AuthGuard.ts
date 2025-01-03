import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../service/auth.service';


@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {

    // Kullanıcı doğrulaması yapılmış mı kontrol et
    if (this.authService.isAuthenticated()) {
      return true;
    }

    // Eğer kullanıcı doğrulama yapmamışsa, login sayfasına yönlendir
    this.router.navigate(['auth/landing']);
    return false;
  }
}
