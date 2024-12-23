import { Component, OnInit } from '@angular/core';
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
    templateUrl: './cover-login.html',
    animations: [toggleAnimation],
})
export class CoverLoginComponent implements OnInit{
    store: any;
    currYear: number = new Date().getFullYear();
    kullaniciAdi: string = '';
    password: string = '';
    rememberMe: boolean = false;

    constructor(
        public translate: TranslateService,
        public storeData: Store<any>,
        public router: Router,
        private appSetting: AppService,
        private authService: AuthService,
        private notificationService: NotificationService, // Yeni eklenen servis
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

        // console.log(item);
        window.location.reload();
    }

    onSubmit() {
        this.authService.login(this.kullaniciAdi, this.password).pipe(
            catchError((error) => {
                // Hata durumunda yapılacak işlemler
                console.error('Login failed', error);

                if (error.status === 400 && error.error?.msg) {
                    // Eğer hata mesajı varsa kullanıcıya göster

                    this.notificationService.showNotification(error.error.msg, 'danger', 'top-end');
                } else {
                    // Genel hata mesajı
                    this.notificationService.showNotification('An error occurred during login.', 'danger', 'top-end');

                }

                return of(null); // Hata durumunda bir Observable döndürün
            })
        ).subscribe(response => {
            if (response) {
                // Başarılı girişte yapılacak işlemler (örneğin, yönlendirme)
                console.log("giris:", localStorage.getItem('role'));
                if (localStorage.getItem('role') === 'Garson' || localStorage.getItem('role') === 'Mutfak') {
                    this.router.navigate(['/apps/masa']);
                }
                else {
                    this.router.navigate(['/dashboard']);
                }
            }
        });

        if (this.rememberMe) {
            // Kullanıcı bilgilerini kaydet
            localStorage.setItem('email2', this.kullaniciAdi);
            localStorage.setItem('password', this.password);
            localStorage.setItem('rememberMe', 'true');
        } else {
            // Kullanıcı bilgilerini temizle
            localStorage.removeItem('email2');
            localStorage.removeItem('password');
            localStorage.removeItem('rememberMe');
        }
    }

    ngOnInit() {
        const savedEmail = localStorage.getItem('email2');
        const savedPassword = localStorage.getItem('password');
        const savedRememberMe = localStorage.getItem('rememberMe') === 'true';

        if (savedRememberMe) {
            this.kullaniciAdi = savedEmail || ''; // Kullanıcı adı localStorage'dan yükleniyor
            this.password = savedPassword || ''; // Şifre localStorage'dan yükleniyor
            this.rememberMe = savedRememberMe;
        }
    }



}
