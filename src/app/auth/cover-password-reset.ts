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
    templateUrl: './cover-password-reset.html',
    animations: [toggleAnimation],
})
export class CoverPasswordResetComponent {
    store: any;
    email: string = '';
    currYear: number = new Date().getFullYear();
    constructor(
        public translate: TranslateService,
        public storeData: Store<any>,
        public router: Router,
        private appSetting: AppService,
        private notificationService: NotificationService,
        private authService: AuthService // AuthService'i ekleyin
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

    sendEmail() {
        this.authService.sendEmail(this.email,"tr").pipe(
            catchError((error) => {
                // Hata durumunda yapılacak işlemler
                if (error.status === 400 && error.error?.msg) {
                    // Eğer hata mesajı varsa kullanıcıya göster
                    this.notificationService.showNotification(error.error.msg, 'danger', 'top-end');
                } else {
                    // this.notificationService.showNotification('Register failed', 'danger', 'top-end');
                }
                return of(null); 
            })
        ).subscribe(response => {
            if (response) {
                // Başarılı girişte yapılacak işlemler (örneğin, yönlendirme)
                this.router.navigate(['/']);
            }
        });
    }

}
