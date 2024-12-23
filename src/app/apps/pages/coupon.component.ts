import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CouponService } from 'src/app/service/coupon.service';
import { NotificationService } from '../NotificationService';
import { slideDownUp, toggleAnimation } from 'src/app/shared/animations';
import { UrunService } from 'src/app/service/UrunService';
import { TranslateService } from '@ngx-translate/core';
import { MagazaService } from 'src/app/service/magaza.service';
import { catchError, of } from 'rxjs';
import * as XLSX from 'xlsx';
import 'intro.js/introjs.css';
import { IntroJs } from 'intro.js/src/intro';
import introJs from 'intro.js';
import GLightbox from 'glightbox';

@Component({
    selector: 'app-coupon',
    templateUrl: './coupon.component.html',
    animations: [toggleAnimation, slideDownUp],
})
export class CouponComponent implements OnInit,AfterViewInit {
    intro!: IntroJs;
    coupons: any[] = [];
    satisKaynaklari: any[] = []; // Satış kaynakları verisi
    odemeTipleri: any[] = []; // Ödeme tipleri verisi
    urunler: any[] = []; // Ürünler verisi
    filteredProducts: any[] = []; // Filtrelenmiş ürünler
    selectedProducts: any[] = []; // Seçilen ürünler
    isLoading = false; // Ürün arama işlemi yükleniyor mu
    modalSearchTerm: string = ''; // Modal arama terimi
    couponForm: FormGroup;
    editMode = false;
    selectedCouponId: string | null = null;
    magazalar: any[] = [];
    searchTerm: string = '';

    filteredCoupons: any[] = [];
    itemsPerPage: number = 3;
    cols: any[] = [];

    activeTab: string = 'genel';
    accordians3: any = null;

    setColumnTitles(): void {
        const currentLang = this.translate.currentLang;
        this.cols = [
            { field: 'actions', title: this.translate.instant('transactions'), slot: 'actions' },
            { field: 'ad', title: this.translate.instant('couponname') },
            { field: 'kuponTipi', title: this.translate.instant('coupontype') },
            { field: 'indirimMiktari', title: this.translate.instant('discountamount') },
            { field: 'kuponOgesiSayisi', title: this.translate.instant('numberofcoupons') },
            { field: 'baslangicTarihi', title: this.translate.instant('startdate') },
            { field: 'bitisTarihi', title: this.translate.instant('enddate') },
        ];
    }

    @ViewChild('productModal') productModal!: any; // Modal referansı
    constructor(
        private couponService: CouponService,
        private urunService: UrunService,
        private fb: FormBuilder,
        private notificationService: NotificationService,
        private translate: TranslateService,
        private magazaService: MagazaService,
    ) {
        const today = this.formatDate(Date());

        this.couponForm = this.fb.group({
            ad: ['', Validators.required],
            aciklama: [''],
            kuponTipi: ['', Validators.required],
            indirimMiktari: [0],
            urunler: [[]],
            satisKaynaklari: [[]],
            odemeTipi: [[]],
            kuponOgesiSayisi: [1, Validators.required],
            baslangicTarihi: [today, Validators.required],
            bitisTarihi: [today, Validators.required],
            magazalar: [[], Validators.required],
        });

        this.setColumnTitles();

        this.translate.onLangChange.subscribe(() => {
            this.setColumnTitles();
        });
    }

    ngOnInit(): void {
        this.loadCoupons();
        this.loadSatisKaynaklari();
        this.loadOdemeTipleri();
        this.loadMagazalar();
        //  this.loadUrunler();
        //  this.startIntro();
        //  this.startIntro();
        const tourCompleted = localStorage.getItem('urunTourCompleted');
        if (!tourCompleted) {
           //   this.startIntro();
        } else {
            // console.log('Kullanıcı turu zaten tamamlamış.');
        }
    }

    // prepareDataForExcel(): any[] {
    //   const data = this.coupons.flatMap((coupon) => {
    //     return coupon.kuponOgesi.map((kupon: { kod: any; kullanildi: any; }) => {
    //       return {
    //         "Kupon Kodu": kupon.kod,
    //         "Kullanıldı": kupon.kullanildi ? 'Evet' : 'Hayır'
    //       };
    //     });
    //   });
    //   return data;
    // }

    startIntro(): void {
        this.intro = introJs();
        this.intro.setOptions({
            steps: [
                {
                    element: '#step1',
                    intro: 'Bu alandan kuponlarınızı görebilir ve yönetebilirsiniz.',
                    position: 'bottom',
                },
                {
                    element: '#step2',
                    intro: 'Bu alandan gerekli alanlar doldurulduktan sonra kuponunuzu kaydetebilirsiniz.',
                    position: 'bottom',
                },
                {
                  element: '#step3',
                  intro: 'Bu alandan kuponlarınızı kaldırabilir ve güncelleyebilirsiniz.',
                  position: 'bottom',
              },
            ],
            showButtons: true,
            showBullets: false, // Alt nokta kontrolünü kaldır
            showStepNumbers: true,
            //  skipLabel: '<span style="font-weight: bold;">Tamamla👋</span>', // Daha farklı bir ifade
            doneLabel: 'Tur Tamamlandı',
            nextLabel: 'İleri',
            prevLabel: 'Geri',
        });

        this.intro.onchange((element) => {
          const currentStep = this.intro._currentStep; // Mevcut adımı alır
          if (currentStep === 0) { // 0 tabanlı index (step3 = index 2)
              this.accordians3=1; // 'items' sekmesini aktif hale getirir
         }
        else  if (currentStep === 1) { // 0 tabanlı index (step3 = index 2)
              this.setActiveTab('genel'); // 'items' sekmesini aktif hale getirir
            }
            else  if (currentStep === 2) { // 0 tabanlı index (step3 = index 2)
                  this.setActiveTab('Kupon Listesi'); // 'items' sekmesini aktif hale getirir
         //}// else if (currentStep ===2 ) { // 0 tabanlı index (step3 = index 2)
            //  this.setActiveTab('items'); // 'items' sekmesini aktif hale getirir
          //} else if (currentStep === 3) { // 0 tabanlı index (step4 = index 3)
           //   this.setActiveTab('urunItems'); // 'odemetipi' sekmesini aktif hale getirir
          }
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
        localStorage.setItem('urunTourCompleted', 'true');
    }

    // Excel dosyasını indirme fonksiyonu
    downloadExcel(coupon: any): void {
        this.selectedCouponId = coupon._id;

        // Seçilen kuponu filtreliyoruz
        const selectedCoupon = this.coupons.find((c) => c._id === this.selectedCouponId);

        // Seçilen kuponun kupon öğelerini alıyoruz
        const data = selectedCoupon
            ? selectedCoupon.kuponOgesi.map((kupon: any) => {
                  return {
                      'Kupon Kodu': kupon.kod,
                      Kullanıldı: kupon.kullanildi ? 'Evet' : 'Hayır',
                  };
              })
            : [];

        // Excel için hazırlanmış veri
        const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data); // JSON verisini sheet'e çeviriyoruz
        const wb: XLSX.WorkBook = XLSX.utils.book_new(); // Yeni bir workbook oluşturuyoruz
        XLSX.utils.book_append_sheet(wb, ws, 'Kuponlar'); // Sheet'i workbook'a ekliyoruz
        XLSX.writeFile(wb, 'Kuponlar.xlsx'); // Dosyayı indiriyoruz
    }

    loadCoupons(): void {
        this.couponService.getCoupons().subscribe(
            (data) => {
                // Tarihleri formatlıyoruz
                this.coupons = data.map((coupon) => ({
                    ...coupon,
                    baslangicTarihi: this.formatDate(coupon.baslangicTarihi),
                    bitisTarihi: this.formatDate(coupon.bitisTarihi),
                }));
                this.filteredCoupons = this.coupons; // Filtrelenmiş kuponları güncelliyoruz
            },
            (error) => this.notificationService.showNotification(this.translate.instant('couponscouldnotbeload'), 'error', 'topRight'),
        );
    }

    loadSatisKaynaklari(): void {
        this.couponService.getSatisKaynaklari().subscribe(
            (data) => (this.satisKaynaklari = data),
            (error) => this.notificationService.showNotification(this.translate.instant('saleresourcescouldnotbeload'), 'error', 'topRight'),
        );
    }

    loadOdemeTipleri(): void {
        this.couponService.getOdemeTipleri().subscribe(
            (data) => (this.odemeTipleri = data),
            (error) => this.notificationService.showNotification(this.translate.instant('paymenttypescouldnotbeload'), 'error', 'topRight'),
        );
    }

    loadUrunler(): void {
        this.isLoading = true;
        this.urunService.getUrunler().subscribe(
            (data) => {
                this.urunler = data;
                this.filteredProducts = data;
                this.isLoading = false;
            },
            (error) => {
                this.notificationService.showNotification(this.translate.instant('productscouldnotbeload'), 'error', 'topRight');
                this.isLoading = false;
            },
        );
    }

    saveCoupon(): void {
        if (this.selectedCouponId || this.couponForm.invalid) {
            this.updateCoupon();
        } else {
            this.addCoupon();
        }
    }

    addCoupon(): void {
        if (this.couponForm.invalid) return;
        const formValue = { ...this.couponForm.value, urunler: this.selectedProducts.map((p) => p._id) };
        this.couponService.addCoupon(formValue).subscribe(
            (response) => {
                this.coupons.push(response);
                this.notificationService.showNotification(this.translate.instant('couponadded'), 'success', 'topRight');
                this.resetForm();
                this.loadCoupons();
            },
            (error) => this.notificationService.showNotification(this.translate.instant('couponcouldnotbeadded'), 'error', 'topRight'),
        );
    }

    editCoupon(coupon: any): void {
        this.editMode = true;
        this.selectedCouponId = coupon._id;
        this.selectedProducts = coupon.urunler || [];
        this.couponForm.patchValue({
            ad: coupon.ad,
            aciklama: coupon.aciklama,
            kuponTipi: coupon.kuponTipi,
            indirimMiktari: coupon.indirimMiktari,
            urunler: coupon.urunler,
            satisKaynaklari: coupon.satisKaynaklari.map((satisKaynak: any) => satisKaynak._id),
            odemeTipi: coupon.odemeTipi.map((odemeTip: any) => odemeTip._id),
            kuponOgesiSayisi: coupon.kuponOgesiSayisi,
            baslangicTarihi: coupon.baslangicTarihi ? new Date(coupon.baslangicTarihi) : null,
            bitisTarihi: coupon.bitisTarihi ? new Date(coupon.bitisTarihi) : null,
            magazalar: coupon.magazalar.map((magaza: any) => magaza._id),
        });
        this.accordians3 = 1;
    }

    formatDate(dateString: string): string {
        const date = new Date(dateString);
        const year = date.getFullYear(); // Yıl
        const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Ay (0'dan başlıyor, bu yüzden 1 ekliyoruz)
        const day = date.getDate().toString().padStart(2, '0'); // Gün

        return `${year}-${month}-${day}`; // yyyy-MM-dd formatında döndürüyoruz
    }

    updateCoupon(): void {
        if (!this.selectedCouponId || this.couponForm.invalid) return;
        const formValue = { ...this.couponForm.value, urunler: this.selectedProducts.map((p) => p._id) };
        this.couponService.updateCoupon(this.selectedCouponId, formValue).subscribe(
            (response) => {
                const index = this.coupons.findIndex((c) => c._id === this.selectedCouponId);
                this.coupons[index] = response;
                this.notificationService.showNotification(this.translate.instant('couponupdated'), 'success', 'topRight');
                this.resetForm();
                this.loadCoupons();
            },
            (error) => this.notificationService.showNotification(this.translate.instant('couponcouldnotbeupdated'), 'error', 'topRight'),
        );
    }

    deleteCoupon(coupon: any): void {
        this.selectedCouponId = coupon._id;
        this.couponService.deleteCoupon(this.selectedCouponId?.toString()!).subscribe(
            () => {
                this.coupons = this.coupons.filter((c) => c._id !== this.selectedCouponId?.toString()!);
                this.notificationService.showNotification(this.translate.instant('coupondeleted'), 'success', 'topRight');
                this.loadCoupons();
            },
            (error) => this.notificationService.showNotification(this.translate.instant('couponcouldnotbedelete'), 'error', 'topRight'),
        );
    }

    resetForm(): void {
        this.editMode = false;
        this.selectedCouponId = null;
        this.couponForm.reset();
        this.selectedProducts = [];
    }

    // Ürün Seçim Modali Açma
    openProductSelectionModal(): void {
        this.modalSearchTerm = '';
        this.filteredProducts = this.urunler;
        this.productModal.open();
    }

    // Ürün Arama
    searchProducts(): void {
        if (!this.modalSearchTerm) {
            this.filteredProducts = []; // Arama terimi yoksa sonuçları temizliyoruz
        } else {
            this.urunService.searchUruns(this.modalSearchTerm).subscribe({
                next: (data) => {
                    this.filteredProducts = data; // Gelen ürünleri `filteredProducts` içinde saklıyoruz
                },
                error: (error) => {
                    this.notificationService.showNotification(this.translate.instant('thereisanerroronsearch'), 'error', 'topRight');
                    console.error('Arama yapılırken hata oluştu:', error);
                },
            });
        }
    }

    // Ürün Seçme
    selectProduct(product: any): void {
        if (!this.selectedProducts.some((p) => p._id === product._id)) {
            this.selectedProducts.push(product);
        }
    }

    // Seçili Ürünü Kaldırma
    removeProduct(productId: string): void {
        console.log(productId);
        if (!productId) {
            console.error('Geçersiz ürün ID');
            return;
        }

        const initialLength = this.selectedProducts.length;
        this.selectedProducts = this.selectedProducts.filter((p) => p._id !== productId);

        if (this.selectedProducts.length === initialLength) {
            console.warn(`Ürün ID'si bulunamadı: ${productId}`);
        }
    }

    loadMagazalar(): void {
        this.magazaService
            .getMagazalarim()
            .pipe(
                catchError((error) => {
                    if (error?.error?.message && error.error.message.includes('yetkiniz yok')) {
                        this.notificationService.showNotification(this.translate.instant('thereisnoauthorizationforthisprocess'), 'danger', 'top-end');
                    } else {
                        this.notificationService.showNotification(this.translate.instant('thereisanerroronloadingstockdatas'), 'danger', 'top-end');
                    }
                    return of([]);
                }),
            )
            .subscribe((data) => {
                this.magazalar = data;
            });
    }

    setActiveTab(tab: string): void {
        this.activeTab = tab;
    }

    isActiveTab(tab: string): boolean {
        return this.activeTab === tab;
 
   }
   ngAfterViewInit(): void {
    const lightbox = GLightbox({
        selector: '.glightbox' // Replace with your selector as needed
    });
}
}
