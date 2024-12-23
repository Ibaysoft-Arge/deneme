import { AfterViewInit, ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { catchError, debounceTime, of, Subject } from 'rxjs';
import { MasaService } from 'src/app/service/masa.service';
import { UserService } from 'src/app/service/user.service';
import { CustomerService } from 'src/app/service/customer.service';
import { NotificationService } from 'src/app/apps/NotificationService';
import { slideDownUp, toggleAnimation } from 'src/app/shared/animations';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import 'intro.js/introjs.css';
import { IntroJs } from 'intro.js/src/intro';
import introJs from 'intro.js';
import { ReportService } from 'src/app/service/ReportService';
import { OrderService } from 'src/app/service/order.service';
import GLightbox from 'glightbox';
@Component({
    selector: 'app-gelal',
    templateUrl: './gelal.component.html',
    animations: [toggleAnimation, slideDownUp],
})
export class GelalComponent implements OnInit,AfterViewInit {
    intro!: IntroJs;
    adisyonlar: any[] = [];
    toplamTutar: number = 0;
    selectedStores: string[] = [];
    selectedStore: string = ''
    selectedcluster: string | null = null;
    selectedSource: string = ''; // Route'dan gelen source bilgisini saklayacağız

    newArea = '';
    userRole = localStorage.getItem('role');
    @ViewChild('tableModal') tableModal!: any;
    @ViewChild('addAreaModal') addAreaModal!: any;
    sayfa: boolean = true;
    stores: any[] = [];
    customerForm: FormGroup;
    constructor(
        private translate: TranslateService,
        public router: Router,
        private routegelen: ActivatedRoute,
        private cdr: ChangeDetectorRef,
        private userService: UserService,
        private notificationService: NotificationService,
        private reportService: ReportService,
        private fb: FormBuilder,
        private customerService: CustomerService,
        private orderService: OrderService,
    ) {
        this.customerForm = this.fb.group({
            ad: ['', Validators.required],
            soyad: ['', Validators.required],
            telefon: ['', [Validators.pattern(/^(\+?\d{1,4}[\s-]?)?\(?\d{1,4}\)?[\s-]?\d{1,4}[\s-]?\d{1,9}$/)]],
        });
    }

    ngOnInit(): void {
        this.loadParametre();
        this.loadMagazalar();
        this.loadUserSettings();
               //  this.startIntro();
               const tourCompleted = localStorage.getItem('gelalTourCompleted');
               if (!tourCompleted) {
                 this.startIntro();
               } else {
                // console.log('Kullanıcı turu zaten tamamlamış.');
               }
    }
    startIntro(): void {
        this.intro = introJs();
        this.intro.setOptions({
          steps: [
            {
              element: '#step1',
              intro: 'Buradan ürünlerinizi ekleyebilir ve yönetebilirsiniz,ürün ekle butonuna basarak devam edebilirsiniz.',
              position: 'bottom'
            },
            {
              element: '#step2',
              intro: 'Bu alandan ürünün genel bilgilerini görebilirsiniz.',
              position: 'right'
            },
            {
              element: '#step3',
              intro: 'Bu alandan ürününüz içerisine stok,reçete veya tekrar ürün eklemesi yapabilirsiniz.',
              position: 'left'
            }


          ],
          showButtons: true,
          showBullets: false, // Alt nokta kontrolünü kaldır
          showStepNumbers: true,
        //  skipLabel: '<span style="font-weight: bold;">Tamamla👋</span>', // Daha farklı bir ifade
          doneLabel: 'Tur Tamamlandı',
          nextLabel: 'İleri',
          prevLabel: 'Geri',

        });



        this.intro.onexit(() => {
          // Kullanıcı turu "Biliyorum" diyerek geçerse
          console.log('Kullanıcı turu tamamlamadan çıktı.');
          this.markTourAsCompleted();
        });

        this.intro.oncomplete(() => {
          // Kullanıcı turu tamamladı
          console.log('Kullanıcı turu tamamladı.');
          this.markTourAsCompleted();
        });

        this.intro.start();
      }

      markTourAsCompleted(): void {
        // Kullanıcı bu turu tamamladı olarak işaretleyin
        localStorage.setItem('gelalTourCompleted', 'true');
      }


    navigateToOrder(): void {

        if (!this.customerForm.invalid) {
            this.addCustomer(this.customerForm.value, 'gelal', this.selectedcluster!, this.selectedStore);
            // this.router.navigate(['/apps/order'], { queryParams: { source, cluster, store } });
        }
    }

    openAddAreaModal() {
        this.newArea = '';
        this.addAreaModal.open();
    }

    loadMagazalarbychangesiz(): void {
        const storedMagazalar = localStorage.getItem('magazalar');
        if (storedMagazalar) {
            this.stores = JSON.parse(storedMagazalar);
        } else {
            this.stores = [];
        }
    }

    loadUserSettings(): void {
        this.userService.getUserSettings().pipe(
            catchError((error) => {
                if (error?.error?.message && error.error.message.includes('yetkiniz yok')) {

                    this.notificationService.showNotification(this.translate.instant("thereisnoauthorizationforthisprocess"), 'danger', 'top-end');
                } else {
                    this.notificationService.showNotification(this.translate.instant("thereisanerroronloadingstockdatas"), 'danger', 'top-end');
                }
                return of([]);
            })
        ).subscribe((data) => {
            this.sayfa = data.takeAwayMusteriBilgileriKullanimi;
        });
    }

    loadMagazalar(): void {
        const storedMagazalar = localStorage.getItem('magazalar');
        if (storedMagazalar) {
            this.stores = JSON.parse(storedMagazalar);
            if (this.stores.length > 0) {
                this.selectedStore = this.stores[0]._id;
                this.selectedcluster = this.stores[0].cluster;

                this.onStoreChange(this.selectedStore);
            }
            this.getAdisyonlar();

        } else {
            this.stores = [];
        }
    }

// gelal.component.ts içerisindeki class'a aşağıdaki fonksiyonu ekleyin

goToOrderDetails(adisyon: any): void {
    // Store, cluster vs. zaten elinizde var, adisyon kaynağına göre satır mantığı order list'tekine benzer yapılabilir.
    // Öncelikle satış kaynağı bilgisi (adisyon.satisKaynakId) var mı kontrol edin.
    // adisyon objesinde satisKaynakId yok ise backendde bunu da döndürmeniz gerekebilir.
    // Aksi halde mevcut logic'inize göre sabit bir source kullanabilirsiniz.

    // Örneğin adisyon içerisinden satış kaynağı ayarlamayı deneyelim:
    const satisKaynakId = adisyon.satisKaynak?._id || null;
    const source = adisyon.satisKaynak?.kaynakAdi || 'gelal'; // veya tur alanına göre ayarlayın

    // Mağaza ve cluster bilgisi de adisyon objesinden veya component'ten (this.selectedStore, this.selectedcluster) alınabilir.
    // Örneğin adisyonun geldiği mağaza kodu, sipariş tarihi vs elinizde ise bunları query param olarak ekleyin
    // orderId da adisyon._id varsayıyoruz. Eğer adisyon içerisinde orderId yoksa backend'e ekleyin.
    // Aşağıda varsayımsal:
    const orderId = adisyon._id;
    const magazaKodu = this.selectedStore;
    const cluster = this.selectedcluster;
    const orderDate = adisyon.siparisTarihi;

    // Müşteri ID var mı?
    const customerId = adisyon.musteri?._id || '';

    // Query paramları hazırlıyoruz:
    const queryParams: any = {
      source: source,
      store: magazaKodu,
      cluster: cluster,
      orderId: orderId,
      orderStatus: adisyon.statu || 'siparisOlusturuldu',
      orderDate: orderDate
    };

    if (customerId) {
      queryParams.customerId = customerId;
    }

    // State'de adisyon bilgisini de geçebilirsiniz:
    this.router.navigate(['/apps/order'], { queryParams, state: { orderInfo: adisyon } });
}


    loadParametre(): void {
        this.routegelen.queryParams.subscribe(params => {
            // Parametreler var mı kontrol ediyoruz
            if (params['source'] && params['id'] && params['cluster'] && params['store']) {
                console.log('Gelen Query Parametreleri:', params);

                // Parametrelerden değerleri alıyoruz
                this.selectedStore = params['store'];
                this.selectedcluster = params['cluster'];
                this.selectedSource = params['source'];
                // Parametrelerden gelen mağazayı ve cluster'ı yükle
                this.loadMagazalarbychangesiz();
                this.onStoreChange(this.selectedStore);
                this.getAdisyonlar();
            } else {

                this.orderService.getSatisKaynak("gelal").subscribe((data) => {
                   // this.menus = data;
                   this.selectedSource = data[0]._id;

                   this.getAdisyonlar();
                });
                console.log('Query parametreleri bulunamadı, varsayılan işlem başlatılıyor.');
            }
        });
    }

    onStoreChange(storeId: string): void {
        this.selectedStore = storeId;
        console.log("selectedStore:", this.selectedStore);
        // Seçilen mağazayı bul ve cluster bilgisini güncelle
        const selectedStoreData = this.stores.find(store => store._id === storeId);
        if (selectedStoreData) {

            this.selectedcluster = selectedStoreData.cluster; // Cluster bilgisini güncelle

            this.getAdisyonlar(); // Adisyonları güncelle

        } else {

            this.selectedcluster = null; // Eğer mağaza bulunamazsa cluster'ı sıfırla
            this.getAdisyonlar(); // Adisyonları güncelle
        }

    }

    getAdisyonlar(): void {


        if (!this.selectedSource) {
            // Eğer source route param'dan gelmediyse, hata veya default handle edebilirsiniz.
            console.warn('Source bilgisi yok, adisyonlar getirilemez.');
            return;
        }

        const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD formatında tarih
        const body = {
            kaynakId: this.selectedSource,
            date: currentDate,
            magazaKodlari: this.selectedStore,
        };

        this.reportService.getAdisyonlarSource(body).pipe(
            catchError((error) => {
                console.error("Adisyonları alırken hata:", error);
                this.notificationService.showNotification(this.translate.instant("thereisanerroronfetchingbills"), 'danger', 'top-end');
                return of([]);
            })
        ).subscribe((data: any[]) => {
            this.adisyonlar = data || [];
            this.toplamTutar = this.adisyonlar.reduce((acc, curr) => acc + (curr.toplamVergiliFiyat || 0), 0);
        });
    }

    addCustomer(customer: any, source: string, cluster: string, store: string): void {
        this.customerService.addCustomer(customer).subscribe({
            next: (addedCustomer) => {
                const customerId=addedCustomer._id;
                this.router.navigate(['/apps/order'], { queryParams: { source, cluster, store,customerId } });

                this.notificationService.showNotification(this.translate.instant("customeradded"), 'top-end');
            },
            error: (error) => {
                if (error?.error?.msg === 'Bu Müşteri zaten mevcut') {
                    this.notificationService.showNotification(this.translate.instant("thisskucodealreadyexist"), 'top-end');
                } else {
                    this.notificationService.showNotification(this.translate.instant("thereisanerroronaddingsku"), 'top-end');
                }
            }
        });
    }
    ngAfterViewInit(): void {
        const lightbox = GLightbox({
            selector: '.glightbox' // Replace with your selector as needed
        });
    }


}
