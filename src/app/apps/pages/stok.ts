import { AfterViewInit, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { toggleAnimation, slideDownUp } from 'src/app/shared/animations'; // Animasyonları ekle
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Store } from '@ngrx/store';
import { PermissionService } from 'src/app/service/permission.service';
import { SkuService } from 'src/app/service/sku.service';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from 'src/app/apps/NotificationService';
import 'intro.js/introjs.css';
import { IntroJs } from 'intro.js/src/intro';
import introJs from 'intro.js';
import * as XLSX from 'xlsx';
import GLightbox from 'glightbox';

@Component({
    selector: 'app-stok',
    templateUrl: './stok.html',
    animations: [toggleAnimation, slideDownUp], // Animasyonları ekle
})
export class StokComponent implements OnInit,AfterViewInit {
    intro!: IntroJs;
    skus: any[] = [];
    filteredSkus: any[] = [];
    searchTerm: string = '';
    showPassive: boolean = false;
    itemsPerPage: number = 3;
    selectedKategori: string = ''; // Seçilen kategori ID'sini tutar
    cols: any[] = [];
    setColumnTitles(): void {
        const currentLang = this.translate.currentLang;
        this.cols = [
            { field: 'actions', title: this.translate.instant('transactions'), slot: 'actions' },
            { field: 'skuKod', title: this.translate.instant('skucode') },
            { field: 'urunAdi', title: this.translate.instant('productname') },
            { field: 'kategori.ad', title: this.translate.instant('category') },
            { field: 'altKategori.ad', title: this.translate.instant('subcategory') },
            { field: 'rafOmruGun', title: this.translate.instant('shelflife') },
            { field: 'sayimTipi', title: this.translate.instant('sayimTipi') },
            { field: 'sevkiyatTuru', title: this.translate.instant('shipmenttype') },
            { field: 'muhasebeKodu', title: this.translate.instant('accountingcode') },
            { field: 'anaBirim', title: this.translate.instant('mainunit') },
            { field: 'altBirimler', title: this.translate.instant('subunits') },
            // { field: 'barcode', title: this.translate.instant("barcode") },
            // { field: 'renk', title: this.translate.instant("color") },
            { field: 'aktif', title: this.translate.instant('activepassive'), slot: 'aktif' },
        ];
    }
    currentPage: number = 1; // Mevcut sayfa numarası
    kategoriler: any[] = [];
    altKategoriler: any[] = [];
    addSkuForm: FormGroup;
    editingSkuId: string | null = null; // Düzenleme durumunu takip etmek için
    permissionDenied: boolean = false;
    accordians3: any = null; // Accordion kontrolü için değişken
    validUnits: string[] = ['adet', 'kg', 'litre', 'paket', 'kutu', 'metre','koli'];
    activeTab: string = 'genel'; // Default aktif sekme 'genel'
    isAddingNew: boolean = true; // Yeni ekleme işlemini takip etmek için

    constructor(
        public fb: FormBuilder,
        public storeData: Store<any>,
        private permissionService: PermissionService,
        private skuService: SkuService,
        private cdr: ChangeDetectorRef,
        private translate: TranslateService,
        private notificationService: NotificationService,
    ) {
        // SKU ekleme formunu oluşturuyoruz
        this.addSkuForm = this.fb.group({
            skuKod: ['', Validators.required],
            urunAdi: ['', Validators.required],
            kategori: ['', Validators.required],
            altKategori: [''],
            rafOmruGun: ['', Validators.required],
            aciklama: [''],
            barcode: [''],
            renk: [''],
            muhasebeKodu: [''],
            anaBirim: ['', Validators.required],
            alisKdvOrani: [null],
            satisKdvOrani: [null],
            altBirimler: this.fb.array([]),
            alisFiyatlari: this.fb.array([]),
            satisFiyatlari: this.fb.array([]),
            aktif: [true], // Default olarak aktif durumda
            sayimTipi: [''],
            sevkiyatTuru: [''],
        });

        this.setColumnTitles();

        this.translate.onLangChange.subscribe(() => {
            this.setColumnTitles();
        });
    }

    onCategoryFilterChange(): void {
        this.applyFilter();
        this.loadAltKategoriler(this.selectedKategori);
    }

    ngOnInit(): void {
        this.loadSKUs();
        this.loadKategoriler();

        //  this.startIntro();
        const tourCompleted = localStorage.getItem('stokTourCompleted');
        if (!tourCompleted) {
          //   this.startIntro();
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
                    intro: 'Buradan stoklarınızı ekleyebilirsiniz.',
                    position: 'bottom',
                },
                {
                    element: '#step2',
                    intro: 'Stoklarınızın Genel Bilgilerini buradan kontrol edebilirsiniz.',
                    position: 'bottom',
                },
                {
                    element: '#step3',
                    intro: 'Stoklarınızın Alt Birimlerini buradan kontrol edebilirsiniz.',
                    position: 'bottom',
                },
                {
                    element: '#step4',
                    intro: 'Stoklarınızın Alış Fiyatlarını buradan kontrol edebilirsiniz.',
                    position: 'bottom',
                },
                {
                    element: '#step5',
                    intro: 'Stoklarınızın Satış Fiyatlarını buradan kontrol edebilirsiniz.',
                    position: 'bottom',
                },
                {
                    element: '#step6',
                    intro: 'Bu alanda stoklarınızı görebilir ve yönetebilirsiniz.',
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
            this.setActiveTab('genel');
            if (currentStep === 1) {
                this.accordians3 =1;
            }
            if (currentStep === 2) {
                // 0 tabanlı index (step3 = index 2)
                this.setActiveTab('altBirimler'); // 'items' sekmesini aktif hale getirir
                 this.accordians3 = 1;
            } else if (currentStep === 3) {
                // 0 tabanlı index (step4 = index 3)
                this.setActiveTab('alisFiyatlari'); // 'odemetipi' sekmesini aktif hale getirir
            } else if (currentStep === 4) {
                // 0 tabanlı index (step4 = index 3)
                this.setActiveTab('satisFiyatlari'); // 'odemetipi' sekmesini aktif hale getirir
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
        localStorage.setItem('stokTourCompleted', 'true');
    }

    downloadExcelTemplate(): void {
        const templateData = [
            {
                'SKU Kod': '',
                'Ürün Adı': '',
                'Kategori': '',
                'Alt Kategori': '',
                'Raf Ömrü (Gün)': '',
                'Açıklama': '',
                'Barcode': '',
                'Renk': '',
                'Muhasebe Kodu': '',
                'Ana Birim': '',
                'Alış KDV Oranı': '',
                'Satış KDV Oranı': '',
                'Sayım Tipi': '',
                'Sevkiyat Türü': '',
            },
        ];

        const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(templateData);
        const workbook: XLSX.WorkBook = { Sheets: { Template: worksheet }, SheetNames: ['Template'] };
        XLSX.writeFile(workbook, 'SKU_Template.xlsx');
    }

    onExcelUpload(event: any): void {
        const file = event.target.files[0];
        if (file) {
            const reader: FileReader = new FileReader();
            reader.onload = (e: any) => {
                const data: string = e.target.result;
                const workbook: XLSX.WorkBook = XLSX.read(data, { type: 'binary' });

                const firstSheetName: string = workbook.SheetNames[0];
                const worksheet: XLSX.WorkSheet = workbook.Sheets[firstSheetName];
                const excelData = XLSX.utils.sheet_to_json(worksheet);

                this.processExcelData(excelData);
            };
            reader.readAsBinaryString(file);
        }
    }

    processExcelData(data: any[]): void {
        const errorList: { skuKod: string; errorMessage: string }[] = []; // Hatalar için liste

        // Excel verilerini işleme
        data.forEach(async (row, index) => {
            try {
                const kategoriId = this.kategoriler.find((k) => k.ad === row['Kategori'])?._id || '';
                this.skuService.getAltKategorilerByKategoriId(kategoriId).subscribe({
                    next: (data) => {
                        this.altKategoriler = data;
                        console.log("AAAAAAAAAAAAAAAAAAAaa" + this.altKategoriler);
                        const altKategoriId = this.altKategoriler.find((ak) => ak.kategori === kategoriId && ak.ad === row['Alt Kategori'])?._id || '';
                        console.log("BBBBBBBBBBBBBBBBBBBbb" + altKategoriId);
                        const newSku = {
                            skuKod: row['SKU Kod'],
                            urunAdi: row['Ürün Adı'],
                            kategori: kategoriId,
                            altKategori: altKategoriId,
                            rafOmruGun: row['Raf Ömrü (Gün)'],
                            aciklama: row['Açıklama'],
                            barcode: row['Barcode'],
                            renk: row['Renk'],
                            muhasebeKodu: row['Muhasebe Kodu'],
                            anaBirim: row['Ana Birim'],
                            alisKdvOrani: row['Alış KDV Oranı'] || null,
                            satisKdvOrani: row['Satış KDV Oranı'] || null,
                            sayimTipi: row['Sayım Tipi'] || '', // Sayım Tipi sütunu
                            sevkiyatTuru: row['Sevkiyat Türü'] || '', // Sevkiyat Türü sütunu
                            aktif: true,
                        };

                        // Veriyi ekle
                        this.addSKU(newSku); // Mevcut `addSKU` fonksiyonunu çağırarak ekleme işlemi
                    },
                    error: (error) => {
                        this.notificationService.showNotification(this.translate.instant('thereisanerroronloadingsubcategory'), 'top-end');
                    },
                });
            } catch (error) {
                errorList.push({
                    skuKod: row['SKU Kod'] || `Satır ${index + 1}`,
                    errorMessage: `Hata: ${error || 'Bilinmeyen bir hata'}`,
                });
            }
        });

        // Hata mesajlarını kontrol et ve kullanıcıya göster
        if (errorList.length > 0) {
            const errorMessages = errorList.map((error) => `SKU Kod: ${error.skuKod}, Mesaj: ${error.errorMessage}`).join('\n');
            this.notificationService.showNotification(this.translate.instant('errorprocessingrows', { errors: errorMessages }), 'top-end', 'error');
        } else {
            // Hata yoksa başarı mesajı göster
            this.notificationService.showNotification(this.translate.instant('uploadsucceeded'), 'top-end', 'success');
        }
    }

    loadSKUs(): void {
        this.skuService
            .getSKUs()
            .pipe(
                catchError((error) => {
                    console.error('Veri yükleme hatası:', error);
                    if (error?.error?.message && error.error.message.includes('yetkiniz yok')) {
                        this.permissionDenied = true;
                        this.notificationService.showNotification(this.translate.instant('thereisnoauthorizationforthisprocess'), 'top-end');
                    } else {
                        this.notificationService.showNotification(this.translate.instant('thereisanerroronloadingstockdatas'), 'top-end');
                    }
                    return of([]);
                }),
            )
            .subscribe((data) => {
                if (!this.permissionDenied) {
                    this.skus = data;
                    this.applyFilter(); // İlk başta tüm SKU'lar gösterilir
                }
            });
    }

    applyFilter(): void {
        this.filteredSkus = this.skus.filter((sku) => {
            // Arama terimi ile eşleşme
            const matchesSearchTerm = this.searchTerm
                ? sku.skuKod.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                  sku.urunAdi.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                  (sku.kategori?.ad?.toLowerCase().includes(this.searchTerm.toLowerCase()) ?? false) ||
                  (sku.altKategori?.ad?.toLowerCase().includes(this.searchTerm.toLowerCase()) ?? false)
                : true;

            // Aktif/Pasif durumu kontrolü
            const matchesActiveStatus = this.showPassive ? true : sku.aktif;

            return matchesSearchTerm && matchesActiveStatus;
        });
    }

    onToggleShowPassive(): void {
        this.applyFilter(); // Toggle yapıldığında filtreyi güncelle
    }
    onSearchTermChange(): void {
        this.applyFilter();
    }

    pageChange(page: number): void {
        this.currentPage = page;
    }

    onSearchChange(): void {
        if (this.searchTerm) {
            this.filteredSkus = this.skus.filter(
                (sku) => sku.urunAdi.toLowerCase().includes(this.searchTerm.toLowerCase()) || sku.skuKod.toLowerCase().includes(this.searchTerm.toLowerCase()),
            );
        } else {
            this.filteredSkus = [...this.skus]; // Arama terimi boşsa tüm SKU'ları geri yükle
        }
    }

    loadKategoriler(): void {
        this.skuService.getKategoriler().subscribe({
            next: (data) => {
                this.kategoriler = data;
                this.cdr.detectChanges(); // Değişiklikleri tespit etmesi için ekledik
            },
            error: (error) => {
                console.error('Kategori yükleme hatası:', error);
                this.notificationService.showNotification(this.translate.instant('thereisanerroronloadingcategory'), 'top-end');
            },
        });
    }

    onCategoryChange(): void {
        const selectedCategoryId = this.addSkuForm.get('kategori')?.value;

        if (selectedCategoryId) {
            this.loadAltKategoriler(selectedCategoryId);
        } else {
            this.altKategoriler = []; // Kategori seçilmezse alt kategorileri temizle
        }
    }

    loadAltKategoriler(kategoriId: string): void {
        this.skuService.getAltKategorilerByKategoriId(kategoriId).subscribe({
            next: (data) => {
                this.altKategoriler = data;
            },
            error: (error) => {
                console.error('Alt kategori yükleme hatası:', error);
                this.notificationService.showNotification(this.translate.instant('thereisanerroronloadingsubcategory'), 'top-end');
            },
        });
    }

    saveSku(): void {
        if (this.addSkuForm.valid) {
            if (this.editingSkuId) {
                // Güncelleme işlemi
                const updatedSku = this.addSkuForm.value;
                updatedSku.altBirimler = this.altBirimler.value;
                updatedSku.alisFiyatlari = this.alisFiyatlari.value;
                updatedSku.satisFiyatlari = this.satisFiyatlari.value;
                this.updateSKU(this.editingSkuId, updatedSku);
                this.resetForm();
            } else {
                // Yeni SKU ekleme işlemi
                const newSku = this.addSkuForm.value;
                newSku.altBirimler = this.altBirimler.value;
                newSku.alisFiyatlari = this.alisFiyatlari.value;
                newSku.satisFiyatlari = this.satisFiyatlari.value;
                this.addSKU(newSku);
                this.resetForm();
            }
        } else {
            console.error('Form geçerli değil.');
        }
    }

    addSKU(newSKU: any): void {
        this.skuService.addSKU(newSKU).subscribe({
            next: (addedSKU) => {
                this.skus.push(addedSKU);
                this.applyFilter(); // Tüm SKU'ları yeniden listele
                this.notificationService.showNotification(this.translate.instant('skuaddedsuccessfully'), 'top-end');
                this.isAddingNew = false;
                this.editingSkuId = addedSKU._id;
                this.loadKategoriler(); // Kategorileri yeniden yükleyerek listeyi güncel tut
                this.loadSKUs();
                this.resetForm();
            },
            error: (error) => {
                if (error?.error?.msg === 'Bu SKU kodu zaten mevcut') {
                    this.notificationService.showNotification(this.translate.instant('thisskucodealreadyexist'), 'top-end');
                } else {
                    this.notificationService.showNotification(this.translate.instant('thereisanerroronaddingsku'), 'top-end');
                }
            },
        });
    }

    openAddKategoriModal(): void {
        // Açılır pencere için kullanıcıya kategori ekleme formu gösterilir
        const yeniKategori = prompt(this.translate.instant('addnewcategoryname'));

        if (yeniKategori) {
            this.addKategori(yeniKategori);
        }
    }

    // Yeni alt kategori ekleme modal'ını açma
    openAddAltKategoriModal(): void {
        if (!this.addSkuForm.get('kategori')?.value) {
            alert(this.translate.instant('firstselectcategory'));
            return;
        }
        const yeniAltKategori = prompt(this.translate.instant('enternewsubcategoryname'));
        if (yeniAltKategori) {
            const kategoriId = this.addSkuForm.get('kategori')?.value;
            this.addAltKategori(kategoriId, yeniAltKategori);
        }
    }

    addKategori(ad: string): void {
        this.skuService.addKategori({ ad }).subscribe({
            next: (kategori) => {
                this.kategoriler.push(kategori);
                this.notificationService.showNotification(this.translate.instant('categoryaddedsuccessfuly'), 'top-end');
            },
            error: (error) => {
                console.error('Kategori ekleme hatası:', error);
                this.notificationService.showNotification(this.translate.instant('erroronaddingcategory'), 'top-end');
            },
        });
    }

    // Yeni alt kategori ekleme
    addAltKategori(kategoriId: string, ad: string): void {
        this.skuService.addAltKategori({ kategori: kategoriId, ad }).subscribe({
            next: (altKategori) => {
                this.altKategoriler.push(altKategori);
                this.notificationService.showNotification(this.translate.instant('subcategoryaddedsuccessfully'), 'top-end');
            },
            error: (error) => {
                console.error('Alt Kategori ekleme hatası:', error);
                this.notificationService.showNotification(this.translate.instant('thereisanerroronaddingsubcategory'), 'top-end');
            },
        });
    }

    updateSKU(id: string, updatedSKU: any): void {
        this.skuService.updateSKU(id, updatedSKU).subscribe({
            next: (updatedSKUResponse) => {
                // Yerel `this.skus` listesindeki güncellenen SKU'yu bulup güncelleme yapıyoruz
                const index = this.skus.findIndex((s) => s._id === id);
                if (index !== -1) {
                    // Sadece ilgili alanları güncellemek için eski SKU'nun üzerine yeni gelen verileri ekliyoruz
                    this.skus[index] = {
                        ...this.skus[index],
                        ...updatedSKUResponse,
                        kategori: this.kategoriler.find((k) => k._id === updatedSKU.kategori) ?? this.skus[index].kategori,
                        altKategori: this.altKategoriler.find((a) => a._id === updatedSKU.altKategori) ?? this.skus[index].altKategori,
                    };
                }
                this.applyFilter(); // Filtreleri uygulayarak SKU'ların listesini güncelle
                this.notificationService.showNotification(this.translate.instant('skuupdatedsuccessfuly'), 'top-end');

                // Güncelleme sonrası UI'yı düzenlemek için bazı durum değerlerini değiştiriyoruz
                this.editingSkuId = id;
                this.isAddingNew = false;

                // Eğer kategori veya alt kategori bilgilerinde güncelleme yapılmışsa, mevcut listeyi güncelle.
                if (updatedSKU.kategori && updatedSKU.kategori !== this.skus[index].kategori) {
                    this.loadKategoriler(); // Eğer kategori güncellendiyse kategori verisini yeniden al
                }
                this.loadSKUs();
                this.resetForm();

                // Ekstra `loadSKUs()` kullanmaya gerek yok, çünkü zaten yerel olarak güncelleme yaptık
            },
            error: (error) => {
                console.error('SKU güncelleme hatası:', error);
                this.notificationService.showNotification(this.translate.instant('thereisanerroronskuupdate'), 'top-end');
            },
        });
    }

    editSKU(sku: any): void {
        this.addSkuForm.patchValue({
            skuKod: sku.skuKod,
            urunAdi: sku.urunAdi,
            kategori: sku.kategori?._id,
            altKategori: sku.altKategori?._id,
            rafOmruGun: sku.rafOmruGun,
            aciklama: sku.aciklama,
            barcode: sku.barcode,
            renk: sku.renk,
            muhasebeKodu: sku.muhasebeKodu,
            anaBirim: sku.anaBirim,
            alisKdvOrani: sku.alisKdvOrani,
            satisKdvOrani: sku.satisKdvOrani,
            aktif: sku.aktif,
            sayimTipi: sku.sayimTipi,
            sevkiyatTuru: sku.sevkiyatTuru,
        });

        this.altBirimler.clear();
        if (sku.altBirimler) {
            sku.altBirimler.forEach((altBirim: any) => {
                this.altBirimler.push(
                    this.fb.group({
                        birimAdi: [altBirim.birimAdi, Validators.required],
                        katsayi: [altBirim.katsayi, Validators.required],
                    }),
                );
            });
        }

        this.editingSkuId = sku._id;
        this.isAddingNew = false;
        this.accordians3 = 1;

        if (sku.kategori) {
            this.loadAltKategoriler(sku.kategori._id);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Alış ve Satış Fiyatları İşlemleri
    get alisFiyatlari(): FormArray {
        return this.addSkuForm.get('alisFiyatlari') as FormArray;
    }

    saveAlisFiyat(index: number): void {
        const alisFiyatGroup = this.alisFiyatlari.at(index) as FormGroup;

        // Formun geçerliliğini kontrol et
        if (alisFiyatGroup && alisFiyatGroup.valid) {
            const alisFiyat = alisFiyatGroup.value;

            if (this.editingSkuId) {
                this.addOrUpdateAlisFiyat(this.editingSkuId, alisFiyat);
            }
        } else {
            // Eğer form geçerli değilse, kullanıcıya bir bildirim göster.
            this.notificationService.showNotification(this.translate.instant('entervalidpurchaseinfo'), 'top-end');
        }
    }

    addAlisFiyat(): void {
        this.alisFiyatlari.push(
            this.fb.group({
                baslangicTarihi: ['', Validators.required],
                bitisTarihi: ['', Validators.required],
                fiyat: ['', Validators.required],
            }),
        );
        this.cdr.detectChanges(); // Değişikliklerin algılanması için
    }

    saveAlisFiyatlari(): void {
        if (this.addSkuForm.valid) {
            this.alisFiyatlari.controls.forEach((alisFiyatGroup) => {
                const alisFiyat = alisFiyatGroup.value;
                if (this.editingSkuId) {
                    this.addOrUpdateAlisFiyat(this.editingSkuId, alisFiyat);
                }
            });
        } else {
            this.notificationService.showNotification(this.translate.instant('requiredareas'), 'top-end');
        }
    }

    addOrUpdateAlisFiyat(skuId: string, alisFiyat: any): void {
        const { baslangicTarihi, bitisTarihi, fiyat } = alisFiyat;
        this.skuService.addOrUpdateAlisFiyat(skuId, baslangicTarihi, bitisTarihi, fiyat).subscribe({
            next: () => {
                this.notificationService.showNotification(this.translate.instant('purchasepriceaddupdate'), 'top-end');
            },
            error: (error) => {
                console.error('Alış fiyatı ekleme/güncelleme hatası:', error);
                this.notificationService.showNotification(this.translate.instant('erroronpurchaseprice'), 'top-end');
            },
        });
    }

    addOrUpdateSatisFiyat(skuId: string, satisFiyat: any): void {
        const { baslangicTarihi, bitisTarihi, fiyat } = satisFiyat;
        this.skuService.addOrUpdateSatisFiyat(skuId, baslangicTarihi, bitisTarihi, fiyat).subscribe({
            next: () => {
                this.notificationService.showNotification(this.translate.instant('salespriceaddupdate'), 'top-end');
            },
            error: (error) => {
                console.error('Satış fiyatı ekleme/güncelleme hatası:', error);
                this.notificationService.showNotification(this.translate.instant('erroronsaleprice'), 'top-end');
            },
        });
    }

    saveSatisFiyat(index: number): void {
        const satisFiyatGroup = this.satisFiyatlari.at(index) as FormGroup;

        // Formun geçerliliğini kontrol et
        if (satisFiyatGroup && satisFiyatGroup.valid) {
            const satisFiyat = satisFiyatGroup.value;

            if (this.editingSkuId) {
                this.addOrUpdateSatisFiyat(this.editingSkuId, satisFiyat);
            }
        } else {
            // Eğer form geçerli değilse, kullanıcıya bir bildirim göster.
            this.notificationService.showNotification(this.translate.instant('entervalidsaleinfo'), 'top-end');
        }
    }

    addSatisFiyat(): void {
        this.satisFiyatlari.push(
            this.fb.group({
                baslangicTarihi: ['', Validators.required],
                bitisTarihi: ['', Validators.required],
                fiyat: ['', Validators.required],
            }),
        );
        this.cdr.detectChanges(); // Değişikliklerin algılanması için
    }

    saveSatisFiyatlari(): void {
        if (this.addSkuForm.valid) {
            this.satisFiyatlari.controls.forEach((satisFiyatGroup) => {
                const satisFiyat = satisFiyatGroup.value;
                if (this.editingSkuId) {
                    this.addOrUpdateSatisFiyat(this.editingSkuId, satisFiyat);
                }
            });
        } else {
            this.notificationService.showNotification(this.translate.instant('requiredareas'), 'top-end');
        }
    }

    getSatisFiyatlariBySkuId(skuId: string): void {
        this.skuService.getSatisFiyatlariBySkuId(skuId).subscribe({
            next: (satisFiyatlari) => {
                this.satisFiyatlari.clear();
                satisFiyatlari.forEach((fiyat: any) => {
                    this.satisFiyatlari.push(
                        this.fb.group({
                            fiyat: [fiyat.fiyat, Validators.required],
                            baslangicTarihi: [this.formatDate(fiyat.baslangicTarihi), Validators.required],
                            bitisTarihi: [this.formatDate(fiyat.bitisTarihi), Validators.required],
                        }),
                    );
                });
            },
            error: (error) => {
                if (error.status !== 404) {
                    // Eğer 404 değilse hata göster
                    console.error('Satış fiyatları getirme hatası:', error);
                    this.notificationService.showNotification(this.translate.instant('thereisanerrorgetsaleprices'), 'top-end');
                }
            },
        });
    }

    getAlisFiyatlariBySkuId(skuId: string): void {
        this.skuService.getAlisFiyatlariBySkuId(skuId).subscribe({
            next: (alisFiyatlari) => {
                this.alisFiyatlari.clear();
                alisFiyatlari.forEach((fiyat: any) => {
                    this.alisFiyatlari.push(
                        this.fb.group({
                            fiyat: [fiyat.fiyat, Validators.required],
                            baslangicTarihi: [this.formatDate(fiyat.baslangicTarihi), Validators.required],
                            bitisTarihi: [this.formatDate(fiyat.bitisTarihi), Validators.required],
                        }),
                    );
                });
            },
            error: (error) => {
                if (error.status !== 404) {
                    // Eğer 404 değilse hata göster
                    console.error('Alış fiyatları getirme hatası:', error);
                    this.notificationService.showNotification(this.translate.instant('thereisanerrorgetpurchaseprices'), 'top-end');
                }
            },
        });
    }

    removeAlisFiyat(index: number): void {
        this.alisFiyatlari.removeAt(index);
        this.cdr.detectChanges(); // Değişiklikleri tespit etmesi için
    }

    get satisFiyatlari(): FormArray {
        return this.addSkuForm.get('satisFiyatlari') as FormArray;
    }

    removeSatisFiyat(index: number): void {
        this.satisFiyatlari.removeAt(index);
        this.cdr.detectChanges();
    }

    // Alt Birimler İşlemleri
    get altBirimler(): FormArray {
        return this.addSkuForm.get('altBirimler') as FormArray;
    }

    addAltBirim(): void {
        this.altBirimler.push(
            this.fb.group({
                birimAdi: ['', Validators.required],
                katsayi: [1, Validators.required],
            }),
        );
        this.cdr.detectChanges();
    }

    removeAltBirim(index: number): void {
        this.altBirimler.removeAt(index);
        this.cdr.detectChanges();
    }

    deleteSKU(skuId: string): void {
        if (confirm(this.translate.instant('areyousuretodeletethisku'))) {
            this.skuService.deleteSKU(skuId).subscribe({
                next: () => {
                    this.skus = this.skus.filter((sku) => sku._id !== skuId);
                    this.notificationService.showNotification(this.translate.instant('skudeletedsuccessfully'), 'top-end');
                },
                error: (error) => {
                    console.error('Silme hatası:', error);
                    this.notificationService.showNotification(this.translate.instant('thereisanerrorondeletingsku'), 'top-end');
                },
            });
        }
    }

    // Sekme değiştirme işlemleri
    setActiveTab(tab: string): void {
        this.activeTab = tab;
    }

    isActiveTab(tab: string): boolean {
        return this.activeTab === tab;
    }

    // Yeni SKU ekleme işlemi başlat
    startNewSKU(): void {
        this.isAddingNew = true;
        this.addSkuForm.reset();
        this.altBirimler.clear();
        this.alisFiyatlari.clear();
        this.satisFiyatlari.clear();
        this.editingSkuId = null;
        this.accordians3 = 1;
    }

    resetForm(): void {
        this.addSkuForm.reset();
        this.altBirimler.clear();
        this.alisFiyatlari.clear();
        this.satisFiyatlari.clear();
        this.addSkuForm.patchValue({
            anaBirim: '',
            aktif: true,
        });
        this.editingSkuId = null;
    }

    formatDate(dateString: string): string {
        if (!dateString) return '';
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = ('0' + (date.getMonth() + 1)).slice(-2);
        const day = ('0' + date.getDate()).slice(-2);
        return `${year}-${month}-${day}`;
    }
    ngAfterViewInit(): void {
        const lightbox = GLightbox({
            selector: '.glightbox' // Replace with your selector as needed
        });
    }
}
