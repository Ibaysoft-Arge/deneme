// src/app/components/boxed-signin/boxed-signin.component.ts
import { Component } from '@angular/core';
import { toggleAnimation } from 'src/app/shared/animations';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { AppService } from 'src/app/service/app.service';
import { AuthService } from 'src/app/service/auth.service'; // AuthService'i içe aktarın
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
    templateUrl: './boxed-signin.html',
    animations: [toggleAnimation],
})
export class BoxedSigninComponent {
    store: any;
    email: string = '';
    password: string = '';

    constructor(
        public translate: TranslateService,
        public storeData: Store<any>,
        public router: Router,
        private appSetting: AppService,
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

    onSubmit() {
        this.authService.login(this.email, this.password).pipe(
          catchError((error) => {
            // Hata durumunda yapılacak işlemler
            console.error('Login failed', error);
            return of(null); // Hata durumunda bir Observable döndürün
          })
        ).subscribe(response => {
          if (response) {
            // Başarılı girişte yapılacak işlemler (örneğin, yönlendirme)
            this.router.navigate(['/']);
          }
        });
}
}