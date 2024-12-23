import { Component, OnInit } from '@angular/core';
import { toggleAnimation } from 'src/app/shared/animations';
import { Router, ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { AppService } from 'src/app/service/app.service';
import { AuthService } from 'src/app/service/auth.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { NotificationService } from 'src/app/apps/NotificationService';

@Component({
    templateUrl: './cover-password.html',
    animations: [toggleAnimation],
})
export class CoverPasswordComponent implements OnInit {
    store: any;

    guid: string = '';
    userId: string = '';
    newPassword: string = '';
    newPassword1: string = '';

    currYear: number = new Date().getFullYear();

    constructor(
        public translate: TranslateService,
        public storeData: Store<any>,
        public router: Router,
        private activatedRoute: ActivatedRoute, // ActivatedRoute servisini ekleyin
        private appSetting: AppService,
        private authService: AuthService,
        private notificationService:NotificationService
    ) {
        this.initStore();
    }

    ngOnInit(): void {
        // URL'den `g` ve `u` parametrelerini alalım
        this.activatedRoute.queryParams.subscribe(params => {
            this.guid = params['g'] || '';
            this.userId = params['u'] || '';
        });
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

    // Şifreleri karşılaştırma
    isPasswordMatch(): boolean {
        return this.newPassword === this.newPassword1;
    }

    resetPassword() {
        if (!this.isPasswordMatch()) {
            console.error('Passwords do not match');
            return;
        }

        this.authService.resetPassword(this.userId, this.guid, this.newPassword).pipe(
            catchError((error) => {
                if (error?.error?.msg === 'Şifre sıfırlama süresi doldu veya kullanılmış') {
                    this.notificationService.showNotification(this.translate.instant("Şifre sıfırlama süresi doldu veya kullanılmış"), 'danger', 'top-end');
                } 
                if (error?.error?.msg === 'Şifre sıfırlama süresi doldu.') {
                    this.notificationService.showNotification(this.translate.instant("Şifre sıfırlama süresi doldu."), 'danger', 'top-end');
                } 
                if (error?.error?.msg === 'Kullanıcı bulunamadı.') {
                    this.notificationService.showNotification(this.translate.instant("Kullanıcı bulunamadı."), 'danger', 'top-end');
                } 
            
                console.error('Reset password failed', error);
                return of(null);
            })
        ).subscribe(response => {
            if (response) {
                this.router.navigate(['auth/cover-login']);
            }
        });
    }
}
