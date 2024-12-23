import { Component } from '@angular/core';
import { toggleAnimation } from 'src/app/shared/animations';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { AppService } from 'src/app/service/app.service';
import { AuthService } from 'src/app/service/auth.service'; // AuthService'i içe aktarın
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { NotificationService } from '../apps/NotificationService';

@Component({
    templateUrl: './cover-register.html',
    animations: [toggleAnimation],
})
export class CoverRegisterComponent {
    store: any;
    currYear: number = new Date().getFullYear();
    kullaniciAdi: string = '';
    kullaniciAdsoyad: string = '';
    sifre: string = '';
    email: string = '';
    telefon: string = '';
    constructor(
        public translate: TranslateService,
        public storeData: Store<any>,
        public router: Router,
        private appSetting: AppService,
        private authService:AuthService,
        private notificationService: NotificationService,
    ) {
        this.initStore();
    }
    async initStore() {
        this.storeData
            .select((d) => d.index)
            .subscribe((d) => {
                this.store = d;
            });
    }

    changeLanguage(item: any) {
        this.translate.use(item.code);
        this.appSetting.toggleLanguage(item);
        if (this.store.locale?.toLowerCase() === 'ae') {
            this.storeData.dispatch({ type: 'toggleRTL', payload: 'rtl' });
        } else {
            this.storeData.dispatch({ type: 'toggleRTL', payload: 'ltr' });
        }
        window.location.reload();
    }

    onRegister() {
        this.authService.register(this.kullaniciAdsoyad,this.kullaniciAdi, this.sifre, this.email, this.telefon, true).pipe(
            catchError((error) => {
                // Hata durumunda yapılacak işlemler
                if (error?.error?.msg === 'Bu kullanıcı adı zaten alınmış') {
                    this.notificationService.showNotification(this.translate.instant("Kullanıcı Adı alınmış lütfen başka bir kullanıcı adı girin."), 'danger', 'top-end');
                } else {
                    this.notificationService.showNotification(this.translate.instant("Hata Oluştu. Lütfen Tekrar Deneyin."), 'danger', 'top-end');
                }                console.error('Register failed', error);
                return of(null); // Hata durumunda bir Observable döndürün
            })
        ).subscribe(response => {
            if (response) {
                // Başarılı girişte yapılacak işlemler (örneğin, yönlendirme)
                this.router.navigate(['./auth/cover-login']);
            }
        });
    }
}
