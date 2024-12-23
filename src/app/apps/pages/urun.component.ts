import { AfterViewInit, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { RecipeService } from 'src/app/service/RecipeService';
import { SkuService } from 'src/app/service/sku.service';
import { UrunService } from 'src/app/service/UrunService';
import { Subject, Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { slideDownUp, toggleAnimation } from 'src/app/shared/animations';
import { NotificationService } from '../NotificationService';
import { TranslateService } from '@ngx-translate/core';
import imageCompression from 'browser-image-compression';
import 'intro.js/introjs.css';
import { IntroJs } from 'intro.js/src/intro';
import introJs from 'intro.js';
import GLightbox from 'glightbox';
@Component({
    selector: 'app-urun',
    templateUrl: './urun.component.html',
    animations: [toggleAnimation, slideDownUp]
})
export class UrunComponent implements OnInit,AfterViewInit {
    intro!: IntroJs;
    urunForm!: FormGroup;
    urunler: any[] = [];
    isEditing: boolean = false;
    editingUrunId!: string;
    kategoriler: any[] = [];
    altKategoriler: any[] = [];
    @ViewChild('modal18') modal18!: any; // Modal referansı
    currentItemFormGroup!: FormGroup;
    currentItemType: string = 'SKU';
    searchTerm: string = '';
    previewImage: string | null = null;


    modalSearchTerm: string = ''; // Bu modal içindeki arama için
    itemList: any[] = [];
    isLoading: boolean = false;
    isFormOpen: boolean = false;
    activeTab: string = 'genel';
    validUnits: string[] = ['adet', 'kg', 'litre', 'paket', 'kutu', 'metre'];
    searchTerm$ = new Subject<string>();

    constructor(
        private fb: FormBuilder,
        private urunService: UrunService,
        private skuService: SkuService,
        private recipeService: RecipeService,
        private route: ActivatedRoute,
        private notificationService: NotificationService,
        private translate: TranslateService
    ) { }

    ngOnInit(): void {
        this.initializeForm();
        this.loadUrunler();
        this.loadKategoriler();

        this.searchTerm$.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            switchMap(term => this.searchItems(term))
        ).subscribe(data => {
            this.itemList = data;
            this.isLoading = false;
            
        //  this.startIntro();
        const tourCompleted = localStorage.getItem('urunTourCompleted');
        if (!tourCompleted) {
         //  this.startIntro();
        } else {
         // console.log('Kullanıcı turu zaten tamamlamış.');
        }
        });

        // Düzenleme kontrolü
        const urunId = this.route.snapshot.paramMap.get('id');
        if (urunId) {
            this.isEditing = true;
            this.editingUrunId = urunId;
            this.loadUrun(urunId);
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
            },
            {
                element: '#step4',
                intro: 'Bu alanda ürünlerinizi görebilir ve yönetebilirsiniz.',
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

        
        this.intro.onchange((element) => {
            const currentStep = this.intro._currentStep; // Mevcut adımı alır
            if (currentStep === 0) { // 0 tabanlı index (step3 = index 2)
                this.isFormOpen=true; // 'items' sekmesini aktif hale getirir
           }
          else  if (currentStep === 1) { // 0 tabanlı index (step3 = index 2)
                this.setActiveTab('genel'); // 'items' sekmesini aktif hale getirir
           } else if (currentStep ===2 ) { // 0 tabanlı index (step3 = index 2)
                this.setActiveTab('items'); // 'items' sekmesini aktif hale getirir
            } else if (currentStep === 3) { // 0 tabanlı index (step4 = index 3)
                this.setActiveTab('urunItems'); // 'odemetipi' sekmesini aktif hale getirir
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



    initializeForm(): void {
        this.urunForm = this.fb.group({
            urunAdi: ['', Validators.required],
            aciklama: [''],
            urunResmi: [''],
            qrcodeUrl: [''],
            barcode: [''],
            maxSecimSayisi: [null],
            standartFiyat: [null, [Validators.required, Validators.min(0)]], // Yeni alan
            urunKategori: ['', Validators.required],
            urunAltKategori: ['',Validators.required],
            items: this.fb.array([])  // Öğeler için FormArray
        });
    }

    get items(): FormArray<FormGroup> {
        return this.urunForm.get('items') as FormArray<FormGroup>;
    }

    setActiveTab(tabName: string): void {
        this.activeTab = tabName;
    }

    isActiveTab(tabName: string): boolean {
        return this.activeTab === tabName;
    }


    onFileSelected(event: any) {
        const file = event.target.files[0];
        if (file) {
            const options = {
                maxSizeMB: 1, // Maksimum boyut (1 MB)
                maxWidthOrHeight: 800, // Maksimum genişlik/yükseklik
                useWebWorker: true,
            };

            imageCompression(file, options)
                .then((compressedFile) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(compressedFile);
                    reader.onloadend = () => {
                        this.previewImage = reader.result as string;
                        this.urunForm.patchValue({ urunResmi: this.previewImage });
                    };
                })
                .catch((error) => {
                    console.error('Resim sıkıştırma hatası:', error);
                });
        }
    }



    // Ana arama
    onSearchChange(): void {
        if (this.searchTerm.trim() !== '') {
            this.urunService.searchUruns(this.searchTerm).subscribe({
                next: (data) => {
                    this.urunler = data;
                },
                error: (error) => {
                    console.error('Arama yapılırken hata oluştu:', error);
                }
            });
        } else {
            this.loadUrunler();
        }
    }

    // Modal arama
    onSearchTermChange(event: Event): void {
        const inputElement = event.target as HTMLInputElement;
        const value = inputElement.value;
        this.isLoading = true;
        this.searchTerm$.next(value);  // Arama terimi için observable'ı tetikleyelim
    }

    onSearchReset(): void {
        this.searchTerm = '';
        this.loadUrunler();
    }

    openItemSelectionModal(itemFormGroup: FormGroup): void {
        this.currentItemFormGroup = itemFormGroup;
        this.currentItemType = itemFormGroup.get('tip')?.value || 'SKU';
        this.modalSearchTerm = '';  // Modal aramasını sıfırlıyoruz
        this.itemList = [];
        this.isLoading = false;

        // NgxCustomModal açma
        this.modal18.open();  // Open fonksiyonu ile modalı açıyoruz
    }

    searchItems(term: string): Observable<any[]> {
        if (this.currentItemType === 'SKU') {
            return this.skuService.searchSkus(term);
        } else if (this.currentItemType === 'Recipe') {
            return this.recipeService.searchRecipes(term);
        } else if (this.currentItemType === 'Urun') {
            return this.urunService.searchUruns(term);
        }
        return of([]);  // Eğer tip belirtilmemişse boş bir array döndürür
    }

    selectItem(selectedItem: any, modal: any): void {
        this.currentItemFormGroup.patchValue({
            itemId: selectedItem._id,
            selectedItemName: selectedItem.urunAdi
        });
        modal.close();  // Modalı kapatıyoruz
    }

    addItem(): void {
        const itemGroup = this.fb.group({
            tip: ['SKU', Validators.required],
            itemId: ['', Validators.required],
            selectedItemName: ['',Validators.required],
            miktar: [1, Validators.required],
            birim: ['', Validators.required],
            ekFiyat: [0] // Varsayılan ek fiyat
        });
        this.items.push(itemGroup);  // FormArray'ye yeni item ekliyoruz
    }

    removeItem(index: number): void {
        this.items.removeAt(index);  // Item'ı silmek için
    }

    loadUrunler(): void {
        this.urunService.getUrunler().subscribe({
            next: (data) => {
                this.urunler = data;
            },
            error: (error) => {
                console.error('Ürünler yüklenirken hata oluştu:', error);
            }
        });
    }

    loadUrun(id: string): void {
        this.urunService.getUrunById(id).subscribe({
            next: (data) => {
                this.urunForm.patchValue({
                    ...data,
                    urunKategori: data.urunKategori?._id || data.urunKategori, // Kategori ID'si
                    urunAltKategori: data.urunAltKategori?._id || data.urunAltKategori, // Alt Kategori ID'si
                    standartFiyat: data.standartFiyat || 0 // Standart fiyat setleniyor
                });

                // Kategoriye bağlı alt kategorileri yükle
                if (data.urunKategori?._id) {
                    this.loadAltKategoriler(data.urunKategori._id);
                }

                if (data.urunResmi) {
                    this.previewImage = data.urunResmi; // Base64 formatında gelmeli
                } else {
                    this.previewImage = null; // Resim yoksa önizlemeyi sıfırla
                }
                // FormArray öğelerini temizleyip yeniden ekle
                while (this.items.length) {
                    this.items.removeAt(0);
                }

                data.items.forEach((item: any) => {
                    const itemGroup = this.fb.group({
                        tip: [item.tip, Validators.required],
                        itemId: [item.itemId?._id || item.itemId, Validators.required],
                        selectedItemName: [item.itemId?.urunAdi || ''],
                        miktar: [item.miktar, Validators.required],
                        birim: [item.birim, Validators.required],
                        ekFiyat: [item.ekFiyat || 0] // Ek fiyat setleniyor
                    });
                    this.items.push(itemGroup);
                });
            },
            error: (error) => {
                console.error('Ürün yüklenirken hata oluştu:', error);
            }
        });
    }


    loadKategoriler(): void {
        this.urunService.getKategoriler().subscribe({
            next: (data) => {
                this.kategoriler = data;
            },
            error: (error) => {
                console.error('Kategori yüklenirken hata oluştu:', error);
                this.notificationService.showNotification(this.translate.instant("thereisanerroronloadingcategories"), "danger", 'top-end');
            }
        });
    }

    // Yeni kategori eklemek için
    openAddKategoriModal(): void {
        const yeniKategori = prompt(this.translate.instant("addnewcategoryname"));
        if (yeniKategori) {
            this.addKategori(yeniKategori);
        }
    }

    addKategori(ad: string): void {
        this.urunService.addKategori({ ad }).subscribe({
            next: (kategori) => {
                this.kategoriler.push(kategori);
                this.notificationService.showNotification(this.translate.instant("categoryaddedsuccessfuly"), "success", 'top-end');
            },
            error: (error) => {
                console.error('Kategori ekleme hatası:', error);
                this.notificationService.showNotification(this.translate.instant("erroronaddingcategory"), "danger", 'top-end');
            }
        });
    }

    // Alt kategori ekleme
    openAddAltKategoriModal(): void {
        if (!this.urunForm.get('urunKategori')?.value) {
            alert(this.translate.instant("firstselectcategory"));
            return;
        }
        const yeniAltKategori = prompt(this.translate.instant("enternewsubcategoryname"));
        if (yeniAltKategori) {
            const kategoriId = this.urunForm.get('urunKategori')?.value;
            this.addAltKategori(kategoriId, yeniAltKategori);
        }
    }

    // Yeni alt kategori ekleme işlemi
    addAltKategori(kategoriId: string, ad: string): void {
        this.urunService.addAltKategori({ kategori: kategoriId, ad }).subscribe({
            next: (altKategori) => {
                this.altKategoriler.push(altKategori);
                this.notificationService.showNotification(this.translate.instant("subcategoryaddedsuccessfully"),"success", 'top-end');
            },
            error: (error) => {
                console.error('Alt Kategori ekleme hatası:', error);
                this.notificationService.showNotification(this.translate.instant("thereisanerroronaddingsubcategory"),"danger", 'top-end');
            }
        });
    }

    onKategoriChange(): void {
        const kategoriId = this.urunForm.get('urunKategori')?.value;
        this.loadAltKategoriler(kategoriId);
    }
    loadAltKategoriler(kategoriId: string): void {
        this.urunService.getAltKategorilerByKategoriId(kategoriId).subscribe({
            next: (data) => {
                this.altKategoriler = data;
            },
            error: (error) => {
                console.error('Alt kategori yüklenirken hata oluştu:', error);
                this.notificationService.showNotification(this.translate.instant("thereisanerroronloadingsubcategories"), "danger", 'top-end');
            }
        });
    }

    // Ürünleri kaydetme
    onSubmit(): void {
        if (this.urunForm.valid) {
            const urunData = this.urunForm.value;
            if (this.isEditing) {
                this.urunService.updateUrun(this.editingUrunId, urunData).subscribe({
                    next: () => {
                        this.resetForm();
                        this.loadUrunler();
                        this.isEditing = false;
                        this.notificationService.showNotification(this.translate.instant("Ürün başarılı bir şekilde eklendi."), "success", 'top-end');

                    },
                    error: (error) => {
                        console.error('Ürün güncellenirken hata oluştu:', error);
                    }
                });
            } else {
                this.urunService.addUrun(urunData).subscribe({
                    next: () => {
                        this.resetForm();
                        this.loadUrunler();
                    },
                    error: (error) => {
                        console.error('Ürün eklenirken hata oluştu:', error);
                    }
                });
            }
        }
    }

    resetForm(): void {
        this.urunForm.reset();
        this.previewImage = null;
        this.initializeForm();
        this.isEditing = false;
    }

    editUrun(urun: any): void {
        this.isEditing = true;
        this.editingUrunId = urun._id;
        this.isFormOpen = true; // Accordion'u açmak için ekledik
        this.loadUrun(urun._id);


        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    deleteUrun(id: string): void {
        if (confirm('Bu ürünü silmek istediğinize emin misiniz?')) {
            this.urunService.deleteUrun(id).subscribe({
                next: () => {
                    this.loadUrunler();
                },
                error: (error) => {
                    console.error('Ürün silinirken hata oluştu:', error);
                }
            });
        }
    }
    ngAfterViewInit(): void {
        const lightbox = GLightbox({
            selector: '.glightbox' // Replace with your selector as needed
        });
    }
}
