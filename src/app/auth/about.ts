import { Component } from '@angular/core';
import { toggleAnimation } from 'src/app/shared/animations';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { AppService } from 'src/app/service/app.service';
import { AuthService } from 'src/app/service/auth.service'; // AuthService'i içe aktarın
import { catchError } from 'rxjs/operators';
import Swiper from 'swiper';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import { PaketService } from '../service/paket.service';

import { of } from 'rxjs';
import { NotificationService } from '../apps/NotificationService';

@Component({
  templateUrl: './about.html',
  animations: [toggleAnimation],
})
export class AboutComponent {
  store: any;
  currYear: number = new Date().getFullYear();
  email: string = '';
  password: string = '';
  yearlyPrice: number = 0;
  paketler: any[] = [];
  paketlerDataEk: any[] = [];

  constructor(
    public translate: TranslateService,
    public storeData: Store<any>,
    public router: Router,
    private appSetting: AppService,
    private authService: AuthService,
    private notificationService: NotificationService, // Yeni eklenen servis
    private paketService: PaketService
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

  


}
