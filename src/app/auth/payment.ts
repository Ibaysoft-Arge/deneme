import { Component, HostListener } from '@angular/core';
import { toggleAnimation } from 'src/app/shared/animations';
import { ActivatedRoute, Router } from '@angular/router';
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
    templateUrl: './payment.html',
    animations: [toggleAnimation],
})
export class PaymentComponent {
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
        // window.location.reload();
    }
    
    scrollToSection(sectionId: string, event: Event): void {
        event.preventDefault(); // Prevents the default link behavior
        this.router.navigate(['/auth/landing']).then(() => {
          // Use setTimeout to ensure the navigation has fully completed
          setTimeout(() => {
            const section = document.querySelector(`#${sectionId}`);
            if (section) {
              section.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 100); // 100 ms delay, you can adjust this as needed
        });
        document.body.classList.remove('mobile-nav-active'); // Body'den sınıf kaldır
      }
      

    isNavbarOpen: boolean = false; // Mobil menü durumu

    toggleNavbar() {
        this.isNavbarOpen = !this.isNavbarOpen; // Menü durumunu tersine çevir
        if (this.isNavbarOpen) {
            document.body.classList.add('mobile-nav-active'); // Body'ye sınıf ekle
        } else {
            document.body.classList.remove('mobile-nav-active'); // Body'den sınıf kaldır
        }
    }

    navigateTo(path: string): void {
        if (this.router.url !== path) {
          this.router.navigateByUrl(path); // Yalnızca farklı bir sayfaya yönlendir
          document.body.classList.remove('mobile-nav-active'); // Body'den sınıf kaldır
        }
      }
    
   
      isDropdownOpen: boolean = true; // Main dropdown state
      isDropdownOpen2: boolean = true; // Nested dropdown state (e.g., 'entegree')
    
     toggleDropdown() {
        this.isDropdownOpen = !this.isDropdownOpen; // Toggle dropdown state
        const dropdown = document.querySelector('.dropdown-menu'); // Get dropdown menu element
        if (this.isDropdownOpen) {
          dropdown?.classList.add('mobile-dropdown-active'); // Add active class to dropdown
        } else {
          dropdown?.classList.remove('mobile-dropdown-active'); // Remove active class from dropdown
        }
      }
    
      toggleDropdown2() {
        this.isDropdownOpen2 = !this.isDropdownOpen2; // Toggle dropdown2 state
        const dropdown2 = document.querySelector('.dropdown-menu-2'); // Get second dropdown menu element
        if (this.isDropdownOpen2) {
          dropdown2?.classList.add('mobile-dropdown-active'); // Add active class to second dropdown
        } else {
          dropdown2?.classList.remove('mobile-dropdown-active'); // Remove active class from second dropdown
        }
      }
      
       // Ekran boyutu değiştiğinde genişliği kontrol eden dinleyici
    @HostListener('window:resize', ['$event'])
    onResize(event: any) {
      this.updateDropdownState(event.target.innerWidth);
    }
  
    // Mobil ve web görünümüne göre dropdown durumu güncelle
    private updateDropdownState(screenWidth: number) {
      if (screenWidth < 768) { // Mobil görünüm (768px altı)
        this.isDropdownOpen = false;
        this.isDropdownOpen2 = false;
      } else { // Web görünüm (768px ve üstü)
        this.isDropdownOpen = true;
        this.isDropdownOpen2 = true;
      }
    }
      
}