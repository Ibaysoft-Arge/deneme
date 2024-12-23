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
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment.prod';

@Component({
  templateUrl: './contact.html',
  animations: [toggleAnimation],
})
export class ContactComponent {
  store: any;
  currYear: number = new Date().getFullYear();
  email: string = '';
  password: string = '';
  yearlyPrice: number = 0;
  paketler: any[] = [];
  paketlerDataEk: any[] = [];
  contactForm: FormGroup;

  constructor(
    public translate: TranslateService,
    public storeData: Store<any>,
    public router: Router,
    private appSetting: AppService,
    private authService: AuthService,
    private notificationService: NotificationService, // Yeni eklenen servis
    private paketService: PaketService,
    public fb: FormBuilder,
    private http: HttpClient
  ) {
    this.initStore();
    this.contactForm = this.fb.group({
      namesurname: ['', Validators.required],
      companyname: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]*$')]],
      town: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      description: ['', [Validators.required]],
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

    // console.log(item);
    window.location.reload();
  }

  onSubmit(): void {
    if (this.contactForm.valid) {
      const formData = this.contactForm.value;
      console.log("formData:",this.contactForm.value);
      // API endpoint where the backend handles the email sending
      const apiUrl = 'http://localhost:5555/api/auth/getEmailFromCustomer';

      this.http.post(apiUrl, formData).subscribe({
        next: (response) => {
          console.log('Email sent successfully!', response);
          alert('E-posta başarıyla gönderildi!');
        },
        error: (error) => {
          console.error('Error sending email:', error);
          alert('E-posta gönderilirken bir hata oluştu.');
        },
      });
    } else {
      alert('Lütfen tüm zorunlu alanları doldurun!');
    }
  }
    

}
