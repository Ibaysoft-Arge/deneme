import { AfterViewInit, ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { catchError, of } from 'rxjs';
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
import { MagazaService } from 'src/app/service/magaza.service';
import GLightbox from 'glightbox';

@Component({
    selector: 'app-paket',
    templateUrl: './paket.component.html',
    animations: [toggleAnimation, slideDownUp],
})
export class PaketComponent implements OnInit,AfterViewInit {
    isFormOpen: boolean = true;
    activeTab: string = 'genel';
    intro!: IntroJs;
    adisyonlar: any[] = [];
    toplamTutar: number = 0;
    selectedStore: string = '';
    selectedSourceIds: string = '';
    selectedcluster: string | null = null;
    newArea = '';
    userRole = localStorage.getItem('role');
    @ViewChild('tableModal') tableModal!: any;
    @ViewChild('addAreaModal') addAreaModal!: any;
    sayfa: boolean = true;
    stores: any[] = [];
    customerForm: FormGroup;
    phoneList: any[] = [];
    customers: any[] = [];
    lokasyonSuggestions: any[] = [];
    selectedSource: string = 'paket';
    iller: any[] = [];
    ilceler: any[][] = [];
    mahalleler: any[][] = [];
    yollar: any[][] = [];
    selectedCustomerId: string | null = null;
    yolSearchResults: any[][] = [];
    showYolSearchDropdown: boolean[] = [];
    showAddressModal: boolean = false;
    editingAddressIndex: number | null = null;
    addressModalForm: FormGroup;
    modalIlceler: any[] = [];
    modalMahalleler: any[] = [];
    modalYollar: any[] = [];
    modalYolSearchResults: any[] = [];
    modalShowYolSearchDropdown: boolean = false;
    modalLokasyonSuggestions: any[] = [];
    selectedAddressIndex: number | null = null; // Seçili adresin indexi

    constructor(
        private translate: TranslateService,
        public router: Router,
        private routegelen: ActivatedRoute,
        private cdr: ChangeDetectorRef,
        private userService: UserService,
        private orderService: OrderService,
        private notificationService: NotificationService,
        private fb: FormBuilder,
        private customerService: CustomerService,
        private magazaService: MagazaService,
        private reportService: ReportService
    ) {
        this.customerForm = this.fb.group({
            ad: ['', Validators.required],
            soyad: ['', Validators.required],
            telefon: ['', [Validators.pattern(/^(\+?\d{1,4}[\s-]?)?\(?\d{1,4}\)?[\s-]?\d{1,4}\)?[\s-]?\d{1,9}$/)]],
            email: ['', [Validators.required, Validators.email]],
            aciklama: [''],
            adresler: this.fb.array([])
        });

        this.addressModalForm = this.fb.group({
            il: ['', Validators.required],
            ilce: ['', Validators.required],
            mahalle: ['', Validators.required],
            yolAdi: ['', Validators.required],
            adres: [''],
            adresAciklama: [''],
            postaKodu: [''],
            sehir: [''],
            ulke: ['Türkiye'],
            adresTipi: ['ev', Validators.required],
        });
    }

    get adresler(): FormArray {
        return this.customerForm.get('adresler') as FormArray;
    }

    createAdresForm(): FormGroup {
        return this.fb.group({
            il: ['', Validators.required],
            ilce: ['', Validators.required],
            mahalle: ['', Validators.required],
            yolAdi: ['', Validators.required],
            adres: [''],
            adresAciklama: [''],
            postaKodu: [''],
            sehir: [''],
            ulke: ['Türkiye'],
            adresTipi: ['ev', Validators.required],
        });
    }

    ngOnInit(): void {
        this.loadParametre();
        this.loadMagazalar();
        this.loadUserSettings();
        this.initializePhoneList();
        this.loadIller();
        const tourCompleted = localStorage.getItem('paketTourCompleted');
        if (!tourCompleted) {
          //  this.startIntro();
        }
    }

    startIntro(): void {
        this.intro = introJs();
        this.intro.setOptions({
          steps: [
            {
              element: '#step1',
              intro: 'Buradan ürünlerinizi ekleyebilir ve yönetebilirsiniz, ürün ekle butonuna basarak devam edebilirsiniz.',
              position: 'bottom'
            },
            {
              element: '#step2',
              intro: 'Bu alandan ürünün genel bilgilerini görebilirsiniz.',
              position: 'right'
            },
            {
              element: '#step3',
              intro: 'Bu alandan ürününüz içerisine stok, reçete veya tekrar ürün eklemesi yapabilirsiniz.',
              position: 'left'
            }
          ],
          showButtons: true,
          showBullets: false,
          showStepNumbers: true,
          doneLabel: 'Tur Tamamlandı',
          nextLabel: 'İleri',
          prevLabel: 'Geri',
        });

        this.intro.onexit(() => {
          this.markTourAsCompleted();
        });

        this.intro.oncomplete(() => {
          this.markTourAsCompleted();
        });

        this.intro.start();
    }

    markTourAsCompleted(): void {
        localStorage.setItem('paketTourCompleted', 'true');
    }

    loadParametre(): void {
        this.routegelen.queryParams.subscribe(params => {
            if (params['source'] && params['id'] && params['cluster'] && params['store']) {
                this.selectedStore = params['store'];
                this.selectedcluster = params['cluster'];
                this.selectedSource = 'paket';
                this.selectedSourceIds = params['source'];
                this.loadMagazalarbychangesiz();
                this.onStoreChange(this.selectedStore);
             } else {
                this.orderService.getSatisKaynak("paket").subscribe((data) => {
                    this.selectedSourceIds = data[0]._id;
                    this.selectedSource = 'paket';
                    this.getAdisyonlar();
                 });
            }
        });
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

    loadMagazalarbychangesiz(): void {
        const storedMagazalar = localStorage.getItem('magazalar');
        if (storedMagazalar) {
            this.stores = JSON.parse(storedMagazalar);
        } else {
            this.stores = [];
        }
    }

    onStoreChange(storeId: string): void {
        this.selectedStore = storeId;
        const selectedStoreData = this.stores.find(store => store._id === storeId);
        if (selectedStoreData) {
            this.selectedcluster = selectedStoreData.cluster;
            this.getAdisyonlar();
        } else {
            this.selectedcluster = null;
            this.getAdisyonlar();
        }
    }

    getAdisyonlar(): void {
        if (!this.selectedSource || !this.selectedStore || !this.selectedSourceIds) return;
        const currentDate = new Date().toISOString().split('T')[0];
        const body = {
            kaynakId: this.selectedSourceIds,
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

    navigateToOrder(): void {
        if (this.customerForm.invalid) {
            this.notificationService.showNotification('Formu eksiksiz doldurunuz.', 'warning', 'top-end');
            return;
        }

        // Adres seçili mi?
        if (this.selectedAddressIndex === null) {
            this.notificationService.showNotification('Lütfen bir adres seçiniz.', 'warning', 'top-end');
            return;
        }

        const formData = this.customerForm.value;
        const phone = formData.telefon?.trim() || '';
        const selectedAddress = this.adresler.at(this.selectedAddressIndex).value;

        if (!this.selectedStore) {
            this.notificationService.showNotification('Mağaza bilgisi eksik.', 'warning', 'top-end');
            return;
        }

        const source = 'paket';

        // Müşteri varsa update yoksa add
        if (this.selectedCustomerId) {
            this.updateCustomerAndNavigate(this.selectedCustomerId, formData, source, selectedAddress);
        } else {
            if (phone) {
                this.customerService.searchCustomer(phone).subscribe({
                    next: (data) => {
                        if (data && data.length > 0) {
                            const customerId = data[0]._id;
                            this.selectedCustomerId = customerId;
                            this.updateCustomerAndNavigate(customerId, formData, source, selectedAddress);
                        } else {
                            // Hiç müşteri yok, önce ekle
                            this.addCustomerAndNavigate(formData, source, selectedAddress);
                        }
                    },
                    error: (err) => {
                        console.error('Müşteri aranırken hata:', err);
                        this.addCustomerAndNavigate(formData, source, selectedAddress);
                    }
                });
            } else {
                this.addCustomerAndNavigate(formData, source, selectedAddress);
            }
        }
    }

    addCustomerAndNavigate(customerData: any, source: string, selectedAddress: any): void {
        this.customerService.addCustomer(customerData).subscribe({
            next: (addedCustomer) => {
                const customerId = addedCustomer._id;
                this.selectedCustomerId = customerId;
                this.goToOrderPage(customerId, source, selectedAddress);
            },
            error: (error) => {
                if (error?.error?.msg === 'Bu Müşteri zaten mevcut') {
                    const phone = customerData.telefon?.trim() || '';
                    if (phone) {
                        this.customerService.searchCustomer(phone).subscribe({
                            next: (data) => {
                                if (data && data.length > 0) {
                                    this.selectedCustomerId = data[0]._id;
                                    if (this.selectedCustomerId) {
                                        this.updateCustomerAndNavigate(this.selectedCustomerId, customerData, source, selectedAddress);
                                    } else {
                                        this.notificationService.showNotification('Müşteri ID eksik.', 'error', 'top-end');
                                    }
                                } else {
                                    this.notificationService.showNotification('Müşteri mevcut, ancak ID alınamadı.', 'error', 'top-end');
                                }
                            },
                            error: (err) => {
                                this.notificationService.showNotification('Müşteri aranırken hata oluştu.', 'error', 'top-end');
                            }
                        });
                    } else {
                        this.notificationService.showNotification('Müşteri mevcut ancak telefon numarası yok.', 'error', 'top-end');
                    }
                } else {
                    this.notificationService.showNotification('Müşteri eklenirken hata oluştu.', 'error', 'top-end');
                }
            }
        });
    }

    // updateCustomerAndNavigate fonksiyonunda da selectedAddress'i alıp goToOrderPage'e iletebilirsiniz:
    updateCustomerAndNavigate(customerId: string, customerData: any, source: string, selectedAddress: any): void {
        this.customerService.updateCustomer(customerId, customerData).subscribe({
            next: (updatedCustomer) => {
                this.goToOrderPage(customerId, source, selectedAddress);
            },
            error: (err) => {
                console.error('Müşteri güncellenirken hata:', err);
                this.notificationService.showNotification('Müşteri güncellenirken hata oluştu.', 'error', 'top-end');
            }
        });
    }

    goToOrderPage(customerId: string, source: string, selectedAddress: any): void {
        this.router.navigate(['/apps/order'], {
            queryParams: {
                source: source,
                cluster: this.selectedcluster,
                store: this.selectedStore,
                customerId: customerId,
                il: selectedAddress.il,
                ilce: selectedAddress.ilce,
                mahalle: selectedAddress.mahalle,
                yolAdi: selectedAddress.yolAdi,
                adres: selectedAddress.adres,
                adresAciklama: selectedAddress.adresAciklama,
                postaKodu: selectedAddress.postaKodu,
                ulke: selectedAddress.ulke,
                adresTipi: selectedAddress.adresTipi
            }
        });
    }
// gelal.component.ts içerisindeki class'a aşağıdaki fonksiyonu ekleyin

goToOrderDetails(adisyon: any): void {
    // Store, cluster vs. zaten elinizde var, adisyon kaynağına göre satır mantığı order list'tekine benzer yapılabilir.
    // Öncelikle satış kaynağı bilgisi (adisyon.satisKaynakId) var mı kontrol edin.
    // adisyon objesinde satisKaynakId yok ise backendde bunu da döndürmeniz gerekebilir.
    // Aksi halde mevcut logic'inize göre sabit bir source kullanabilirsiniz.

    // Örneğin adisyon içerisinden satış kaynağı ayarlamayı deneyelim:
    const satisKaynakId = adisyon.satisKaynak?._id || null;
    const source = adisyon.satisKaynak?.kaynakAdi || 'paket'; // veya tur alanına göre ayarlayın

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

    // Modal adres kaydı bittiğinde hemen DB'ye yansıtalım ki veri kaybı olmasın
    updateCustomerImmediately() {
        const customerData = this.customerForm.value;
        if (!this.selectedCustomerId) {
            // Müşteri yoksa önce ekle
            this.customerService.addCustomer(customerData).subscribe({
                next: (addedCustomer) => {
                    this.selectedCustomerId = addedCustomer._id;
                    // Artık müşteri var, update yapmaya gerek yok
                    console.log('Müşteri eklendi, ID:', this.selectedCustomerId);
                },
                error: (err) => {
                    console.error('Müşteri eklenirken hata:', err);
                    this.notificationService.showNotification('Müşteri eklenirken hata oluştu.', 'error', 'top-end');
                }
            });
        } else {
            // Müşteri var, update
            this.customerService.updateCustomer(this.selectedCustomerId, customerData).subscribe({
                next: (updatedCustomer) => {
                    console.log('Müşteri güncellendi.');
                },
                error: (err) => {
                    console.error('Müşteri güncellenirken hata:', err);
                    this.notificationService.showNotification('Müşteri güncellenirken hata oluştu.', 'error', 'top-end');
                }
            });
        }
    }



    onSearchChange(item: any): void {
        if (item.phone.trim() !== '') {
            this.customerService.searchCustomer(item.phone).subscribe({
                next: (data) => {
                    this.customers = data;
                    this.customerForm.reset({
                        ad: '',
                        soyad: '',
                        telefon: item.phone,
                        email: '',
                        aciklama: ''
                    });
                    this.adresler.clear();

                    if (this.customers.length > 0) {
                        const cust = this.customers[0];
                        this.selectedCustomerId = cust._id;
                        this.customerForm.patchValue({
                            ad: cust.ad || '',
                            soyad: cust.soyad || '',
                            telefon: cust.telefon || item.phone,
                            email: cust.email || '',
                            aciklama: cust.aciklama || ''
                        });
                        this.setAdresler(cust.adresler || []);
                    } else {
                        this.selectedCustomerId = null;
                        this.notificationService.showNotification(this.translate.instant("nouserrecordfound"), 'top-end');
                    }
                },
                error: (error) => {
                    console.error('Arama yapılırken hata oluştu:', error);
                }
            });
        }
    }

    setAdresler(adresler: any[]): void {
        this.adresler.clear();
        if (adresler.length === 0) {
            // hiçbir adres yok
        } else {
            adresler.forEach((adres, index) => {
                const group = this.createAdresForm();
                group.patchValue({
                  il: adres.il || '',
                  ilce: adres.ilce || '',
                  mahalle: adres.mahalle || '',
                  yolAdi: adres.yolAdi || '',
                  adres: adres.adres || '',
                  adresAciklama: adres.adresAciklama || '',
                  postaKodu: adres.postaKodu || '',
                  sehir: adres.sehir || '',
                  ulke: adres.ulke || 'Türkiye',
                  adresTipi: adres.adresTipi || 'ev'
                });
                this.adresler.push(group);

                this.ilceler[index] = [];
                this.mahalleler[index] = [];
                this.yollar[index] = [];
                this.yolSearchResults[index] = [];
                this.showYolSearchDropdown[index] = false;

                const il = adres.il || '';
                const ilce = adres.ilce || '';
                const mahalle = adres.mahalle || '';

                if (il) {
                  this.magazaService.getIlceler(il).subscribe({
                    next: (ilceData: any[]) => {
                      this.ilceler[index] = ilceData;
                      if (ilce) {
                        this.magazaService.getMahalleler(il, ilce).subscribe({
                          next: (mahalleData: any[]) => {
                            this.mahalleler[index] = mahalleData;
                            if (mahalle) {
                              this.magazaService.getYollar(il, ilce, mahalle).subscribe({
                                next: (yolData: any[]) => {
                                  this.yollar[index] = yolData;
                                },
                                error: (yErr) => console.error('Yol yükleme hatası:', yErr)
                              });
                            }
                          },
                          error: (mErr) => console.error('Mahalle yükleme hatası:', mErr)
                        });
                      }
                    },
                    error: (iErr) => console.error('İlçe yükleme hatası:', iErr)
                  });
                }
            });
        }
    }

    initializePhoneList(): void {
        this.phoneList = [
            { phone: '555-123-4567', id: 1 },
            { phone: '555-987-6543', id: 2 },
            { phone: '12345678', id: 3 }
        ];
    }

    loadIller(): void {
        this.magazaService.getIller().subscribe({
            next: (data: any[]) => {
                this.iller = data;
            },
            error: (err) => {
                console.error('İller yüklenirken hata:', err);
            }
        });
    }

    // Modal İşlemleri
    openAddressModal(isEdit: boolean = false, index?: number) {
        this.resetModalFields();
        if (isEdit && index !== undefined) {
            this.editingAddressIndex = index;
            const addr = this.adresler.at(index).value;
            this.addressModalForm.patchValue(addr);
            const il = addr.il || '';
            const ilce = addr.ilce || '';
            const mahalle = addr.mahalle || '';
            if (il) {
              this.magazaService.getIlceler(il).subscribe({
                next: (ilceData: any[]) => {
                  this.modalIlceler = ilceData;
                  if (ilce) {
                    this.magazaService.getMahalleler(il, ilce).subscribe({
                      next: (mahalleData: any[]) => {
                        this.modalMahalleler = mahalleData;
                        if (mahalle) {
                          this.magazaService.getYollar(il, ilce, mahalle).subscribe({
                            next: (yolData: any[]) => {
                              this.modalYollar = yolData;
                            },
                            error: (yErr) => console.error('Yol yükleme hatası (modal):', yErr)
                          });
                        }
                      },
                      error: (mErr) => console.error('Mahalle yükleme hatası (modal):', mErr)
                    });
                  }
                },
                error: (iErr) => console.error('İlçe yükleme hatası (modal):', iErr)
              });
            }
        } else {
            this.editingAddressIndex = null;
            this.addressModalForm.reset({
                il: '',
                ilce: '',
                mahalle: '',
                yolAdi: '',
                adres: '',
                adresAciklama: '',
                postaKodu: '',
                sehir: '',
                ulke: 'Türkiye',
                adresTipi: 'ev'
            });
        }
        this.showAddressModal = true;
    }

    closeAddressModal() {
        this.showAddressModal = false;
    }

    saveAddressFromModal() {
        if (this.addressModalForm.invalid) {
            this.notificationService.showNotification('Lütfen adres bilgilerini eksiksiz doldurunuz.', 'warning', 'top-end');
            return;
        }

        const addressData = this.addressModalForm.value;
        if (this.editingAddressIndex !== null) {
            // Düzenleme
            this.adresler.at(this.editingAddressIndex).patchValue(addressData);
            this.updateCustomerImmediately();
        } else {
            // Yeni ekleme
            const newAddressForm = this.createAdresForm();
            newAddressForm.patchValue(addressData);
            this.adresler.push(newAddressForm);
            // Son eklenen adresi seçili yapalım
            this.selectedAddressIndex = this.adresler.length - 1;
            this.updateCustomerImmediately();
        }
        this.closeAddressModal();
    }

    deleteAddress(index: number) {
        this.adresler.removeAt(index);
        this.ilceler.splice(index,1);
        this.mahalleler.splice(index,1);
        this.yollar.splice(index,1);
        this.yolSearchResults.splice(index,1);
        this.showYolSearchDropdown.splice(index,1);
        if (this.selectedAddressIndex === index) {
            this.selectedAddressIndex = null;
        }
        this.updateCustomerImmediately();
    }

    selectAddress(index: number) {
        this.selectedAddressIndex = index;
    }

    resetModalFields() {
        this.modalIlceler = [];
        this.modalMahalleler = [];
        this.modalYollar = [];
        this.modalYolSearchResults = [];
        this.modalShowYolSearchDropdown = false;
        this.modalLokasyonSuggestions = [];
    }

    // Modal içi eventler
    onModalIlChange() {
        const il = this.addressModalForm.get('il')?.value;
        if (il) {
            this.magazaService.getIlceler(il).subscribe({
                next: (data: any[]) => {
                    this.modalIlceler = data;
                    this.modalMahalleler = [];
                    this.modalYollar = [];
                    this.modalYolSearchResults = [];
                    this.modalShowYolSearchDropdown = false;

                    this.addressModalForm.patchValue({
                        ilce: '',
                        mahalle: '',
                        yolAdi: ''
                    });
                },
                error: (err) => {
                    console.error('İlçeler yüklenirken hata (modal):', err);
                }
            });
        } else {
            this.modalIlceler = [];
            this.modalMahalleler = [];
            this.modalYollar = [];
            this.modalYolSearchResults = [];
        }
    }

    onModalIlceChange() {
        const il = this.addressModalForm.get('il')?.value;
        const ilce = this.addressModalForm.get('ilce')?.value;
        if (il && ilce) {
            this.magazaService.getMahalleler(il, ilce).subscribe({
                next: (data: any[]) => {
                    this.modalMahalleler = data;
                    this.modalYollar = [];
                    this.modalYolSearchResults = [];
                    this.modalShowYolSearchDropdown = false;

                    this.addressModalForm.patchValue({
                        mahalle: '',
                        yolAdi: ''
                    });
                },
                error: (err) => {
                    console.error('Mahalleler yüklenirken hata (modal):', err);
                }
            });
        } else {
            this.modalMahalleler = [];
            this.modalYollar = [];
            this.modalYolSearchResults = [];
        }
    }

    onModalMahalleChange() {
        const il = this.addressModalForm.get('il')?.value;
        const ilce = this.addressModalForm.get('ilce')?.value;
        const mahalle = this.addressModalForm.get('mahalle')?.value;
        if (il && ilce && mahalle) {
            this.magazaService.getYollar(il, ilce, mahalle).subscribe({
                next: (data: any[]) => {
                    this.modalYollar = data;
                    this.modalYolSearchResults = [];
                    this.modalShowYolSearchDropdown = false;

                    this.addressModalForm.patchValue({
                        yolAdi: ''
                    });
                },
                error: (err) => {
                    console.error('Yollar yüklenirken hata (modal):', err);
                }
            });
        } else {
            this.modalYollar = [];
            this.modalYolSearchResults = [];
        }
    }

    onModalYolAdiInput() {
        const yolValue = this.addressModalForm.get('yolAdi')?.value || '';
        if (yolValue.length > 2) {
            this.magazaService.searchLokasyon(yolValue).subscribe({
                next: (results) => {
                    this.modalYolSearchResults = results;
                    this.modalShowYolSearchDropdown = true;
                },
                error: (err) => {
                    console.error('Lokasyon arama hatası (modal):', err);
                }
            });
        } else {
            this.modalYolSearchResults = [];
            this.modalShowYolSearchDropdown = false;
        }
    }

    selectModalLokasyonResult(lok: any): void {
        this.addressModalForm.patchValue({
            il: lok.il,
            ilce: lok.ilce,
            mahalle: lok.mahalle,
            yolAdi: lok.yolAdi
        });

        if (lok.il) {
          this.magazaService.getIlceler(lok.il).subscribe({
            next: (data: any[]) => {
              this.modalIlceler = data;
              if (lok.ilce) {
                this.magazaService.getMahalleler(lok.il, lok.ilce).subscribe({
                  next: (mData: any[]) => {
                    this.modalMahalleler = mData;
                    if (lok.mahalle) {
                      this.magazaService.getYollar(lok.il, lok.ilce, lok.mahalle).subscribe({
                        next: (yData: any[]) => {
                          this.modalYollar = yData;
                        },
                        error: (yErr) => console.error('Yol yükleme hatası (modal):', yErr)
                      });
                    }
                  },
                  error: (mErr) => console.error('Mahalle yükleme hatası (modal):', mErr)
                });
              }
            },
            error: (iErr) => console.error('İlçe yükleme hatası (modal):', iErr)
          });
        }

        this.modalYolSearchResults = [];
        this.modalShowYolSearchDropdown = false;
    }

    selectModalYolFromDropdown(yolAdiValue: string): void {
        const selectedYol = this.modalYollar?.find((y: any) => y === yolAdiValue || y.yolAdi === yolAdiValue);
        if (selectedYol && selectedYol.yolAdi) {
            this.addressModalForm.patchValue({
                yolAdi: selectedYol.yolAdi
            });
        }
    }

    onModalYolSearch(query: string) {
        if (query && query.length > 2) {
          this.magazaService.searchLokasyon(query).subscribe({
            next: (data) => {
              this.modalLokasyonSuggestions = data;
            },
            error: (err) => {
              console.error('Lokasyon arama hatası (modal):', err);
              this.modalLokasyonSuggestions = [];
            }
          });
        } else {
          this.modalLokasyonSuggestions = [];
        }
    }

    selectModalLokasyonFromSearch(lok: any) {
        this.addressModalForm.patchValue({
          il: lok.il,
          ilce: lok.ilce,
          mahalle: lok.mahalle,
          yolAdi: lok.yolAdi
        });

        if (lok.il) {
          this.magazaService.getIlceler(lok.il).subscribe({
            next: (ilceData: any[]) => {
              this.modalIlceler = ilceData;
              if (lok.ilce) {
                this.magazaService.getMahalleler(lok.il, lok.ilce).subscribe({
                  next: (mahalleData: any[]) => {
                    this.modalMahalleler = mahalleData;
                    if (lok.mahalle) {
                      this.magazaService.getYollar(lok.il, lok.ilce, lok.mahalle).subscribe({
                        next: (yolData: any[]) => {
                          this.modalYollar = yolData;
                        },
                        error: (yErr) => console.error('Yol yükleme hatası (modal):', yErr)
                      });
                    }
                  },
                  error: (mErr) => console.error('Mahalle yükleme hatası (modal):', mErr)
                });
              }
            },
            error: (iErr) => console.error('İlçe yükleme hatası (modal):', iErr)
          });
        }

        this.modalLokasyonSuggestions = [];
    }
    ngAfterViewInit(): void {
        const lightbox = GLightbox({
            selector: '.glightbox' // Replace with your selector as needed
        });
    }
}
