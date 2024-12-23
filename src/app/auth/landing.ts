import { Component, OnInit, AfterViewInit,HostListener } from '@angular/core';
import { toggleAnimation } from 'src/app/shared/animations';
import { NavigationEnd, Router  } from '@angular/router';
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
import * as AOS from 'aos';
import PureCounter from "@srexi/purecounterjs";
import GLightbox from 'glightbox';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';



@Component({
  templateUrl: './landing.html',
  animations: [toggleAnimation],
})
export class LandingComponent implements OnInit, AfterViewInit {
  store: any;
  currYear: number = new Date().getFullYear();
  email: string = '';
  password: string = '';
  yearlyPrice: number = 0;
  paketler: any[] = [];
  paketlerDataEk: any[] = [];
  contactForm!: FormGroup;
  sayacbilgileri: any;

  constructor(
    public translate: TranslateService,
    public storeData: Store<any>,
    public router: Router,
    private appSetting: AppService,
    private authService: AuthService,
    private notificationService: NotificationService, // Yeni eklenen servis
    private paketService: PaketService,
    private fb: FormBuilder,
    private http: HttpClient,
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

  ngOnInit() {
    this.getPaketler();
    this.getSayac();
    AOS.init({
      duration: 1200, // Animasyon süresi (ms)
      once: true,     // Sadece bir kere çalıştır
    });
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        AOS.refresh(); // Route değiştiğinde animasyonları yenile
      }
    });
    // Initialize PureCounter after the component is initialized
    new PureCounter();
    this.contactForm = this.fb.group({
      namesurname: ['', Validators.required],
      companyname: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]*$')]],
      town: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      subject: ['', Validators.required],
      message: ['', Validators.required],
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

  swiper: any;
  items = ['pizzalazza.png', 'saloonburger.png', 'pizzalazza.png', 'saloonburger.png', 'pizzalazza.png', 'saloonburger.png', 'pizzalazza.png', 'saloonburger.png'];


  ngAfterViewInit() {
    // Initialize Swiper after the view has been rendered
    this.swiper = new Swiper('.init-swiper', {
      modules: [Navigation, Pagination, Autoplay],
      navigation: {
        nextEl: '.swiper-button-next-ex5',
        prevEl: '.swiper-button-prev-ex5',
      },
      pagination: {
        el: '.swiper-pagination',
        type: 'bullets',
        clickable: true,
      },
      autoplay: {
        delay: 3000, // Autoplay delay in milliseconds
        disableOnInteraction: false,
      },
      breakpoints: {
        320: { slidesPerView: 1, spaceBetween: 20 },
        768: { slidesPerView: 2, spaceBetween: 40 },
        1024: { slidesPerView: 3, spaceBetween: 30 },
      },
    });
    const lightbox = GLightbox({
      selector: '.glightbox' // Replace with your selector as needed
    });

    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach((item) => {
      item.addEventListener('click', () => {
        // Eğer tıklanan öğe zaten aktifse, aktifliği kaldır
        if (item.classList.contains('faq-active')) {
          item.classList.remove('faq-active');
        } else {
          // Tüm aktif durumları kaldır
          faqItems.forEach((el) => el.classList.remove('faq-active'));
          // Tıklanan öğeyi aktif yap
          item.classList.add('faq-active');
        }
      });
    });

  }



  modules1 = {
    toolbar: [[{ header: [1, 2, false] }], ['bold', 'italic', 'underline', 'link'], [{ list: 'ordered' }, { list: 'bullet' }], ['clean']],
  };
  getPaketler() {
    this.paketService.getPaketlerWithoutAuth().subscribe(
      (response) => {
        console.log('Response:', response);
        this.paketler = response.map((paket: any) => ({
          ...paket,
          moduller: paket.moduller || [] // Modüller boş ise boş bir dizi atanır
        }));
        console.log('Paketler:', this.paketler);
      },
      (error) => {
        console.error('Sayfalar alınamadı:', error);
      }
    );
  }


  getSayac() {
    this.authService.getSayacBilgileri().subscribe(
      (response) => {
        console.log("Sayac Bilgileri", response);
        this.sayacbilgileri = response;
        console.log(this.sayacbilgileri);
      },
      (error) => {
        console.error('Sayac Bilgileri alınamadı:', error);
      }
    );
  }

  translateText(key: string): string {
    let translatedText = ''; // Çevrilen metni tutmak için değişken
    this.translate.get(key).subscribe((translation: string) => {
      translatedText = translation; // Seçili dile göre çeviriyi al
    });
    return translatedText; // Çeviriyi döndür
  }


  scrollToSection(sectionId: string, event: Event): void {
    event.preventDefault(); // Varsayılan bağlantı davranışını engeller
    const section = document.querySelector(`#${sectionId}`);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    document.body.classList.remove('mobile-nav-active'); // Body'den sınıf kaldır
    this.isNavbarOpen = false; // Navbar durumunu kapalı olarak ayarla
  }

  isNavbarOpen: boolean = false; // Mobil menü durumu
  isDropdownOpen: boolean = true; // Main dropdown state
  isDropdownOpen2: boolean = true; // Nested dropdown state (e.g., 'entegree')

  toggleNavbar() {
    this.isNavbarOpen = !this.isNavbarOpen; // Menü durumunu tersine çevir
    if (this.isNavbarOpen) {
      document.body.classList.add('mobile-nav-active'); // Body'ye sınıf ekle
    } else {
      document.body.classList.remove('mobile-nav-active'); // Body'den sınıf kaldır
    }
  }

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


  activeTab: number = 1; // Başlangıçta 1. sekme aktif

  setActiveTab(tabNumber: number): void {
    this.activeTab = tabNumber; // Tıklanan sekmeyi aktif yap
  }

  onSubmit(): void {
    if (this.contactForm.valid) {
      const formData = this.contactForm.value;
      console.log("formData:", this.contactForm.value);
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


  faqItems = [
    {
      title: this.translate.instant('question1'),
      content: this.translate.instant('answer1'),
      isActive: false
    },
    {
      title: this.translate.instant('question2'),
      content: this.translate.instant('answer2'),
      isActive: false
    },
    {
      title: this.translate.instant('question3'),
      content: this.translate.instant('answer3'),
      isActive: false
    },
    {
      title: this.translate.instant('question4'),
      content: this.translate.instant('answer4'),
      isActive: false
    },
    {
      title: this.translate.instant('question5'),
      content: this.translate.instant('answer5'),
      isActive: false
    }

  ];

  toggleFaq(item: any) {
    item.isActive = !item.isActive;
  }

  navigateTo(path: string): void {
    if (this.router.url !== path) {
      this.router.navigateByUrl(path); // Yalnızca farklı bir sayfaya yönlendir
      document.body.classList.remove('mobile-nav-active'); // Body'den sınıf kaldır
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
