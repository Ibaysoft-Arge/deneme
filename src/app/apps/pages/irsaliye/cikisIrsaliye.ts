import { AfterViewInit, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { SkuService } from 'src/app/service/sku.service';
import { IrsaliyeService } from 'src/app/service/irsaliye';
import { Subject, Observable, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { slideDownUp, toggleAnimation } from 'src/app/shared/animations';
import { NotificationService } from '../../NotificationService';
import { TranslateService } from '@ngx-translate/core';
import { MagazaService } from 'src/app/service/magaza.service';
import GLightbox from 'glightbox';

@Component({
    templateUrl: './cikisIrsaliye.html',
    animations: [toggleAnimation, slideDownUp]
})
export class CikisIrsaliyeComponent implements OnInit, AfterViewInit {
    irsaliyeForm!: FormGroup;
    skuForm!: FormGroup;  // Tek SKU eklemek için kullandığımız form
    irsaliyeler: any[] = [];
    magazalar: any[] = [];
    isEditing: boolean = false;
    isEditingSku: boolean =false;
    editingUrunId!: string;
    editingSkuId! :string;
    kategoriler: any[] = [];
    altKategoriler: any[] = [];
    @ViewChild('modalSku') modalSku!: any; // Modal referansı
    @ViewChild('modalIrsaliye') modalIrsaliye!: any; // Modal referansı
    currentItemFormGroup!: FormGroup;
    currentItemType: string = 'SKU';
    currentItemTypeIrsaliye: string = 'irsaliye';
    searchTerm: string = '';

    showPassive: boolean = false;
    editingCikisIrsaliyeId: string | null = null;
    selectedStatus: string = 'all';
    isAddingNew: boolean = true;

    modalSearchTerm: string = ''; // Bu modal içindeki arama için
    modalSearchTermIrsaliye: string = '';
    skuList: any[] = [];
    isLoading: boolean = false;
    isFormOpen: boolean = true;
    activeTab: string = 'genel';
    validUnits: string[] = ['adet', 'kg', 'litre', 'paket', 'kutu', 'metre'];
    searchTerm$ = new Subject<string>();
    searchTermIrsaliye$ = new Subject<string>();
    itemsPerPage: number = 3;

    // Tablo kolonları: tablo hangi alanları gösterecek?
    cols: any[] = [];

    // Tabloda gösterilecek SKU listesi
    skus: any[] = [];
    filteredSkus: any[] = [];

    constructor(
        private fb: FormBuilder,
        private irsaliyeService: IrsaliyeService,
        private skuService: SkuService,
        private route: ActivatedRoute,
        private notificationService: NotificationService,
        private translate: TranslateService,
        private magazaService: MagazaService
    ) {
        this.setColumnTitles();
        this.translate.onLangChange.subscribe(() => {
            this.setColumnTitles();
        });
    }

    ngOnInit(): void {
        this.initializeForm();
        this.loadMagazalar();
        this.setColumnTitles();

        this.translate.onLangChange.subscribe(() => {
            this.setColumnTitles();
        });

        // SKU arama için
        this.searchTerm$.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            switchMap(term => this.searchItems(term, 'SKU')) // SKU araması
        ).subscribe(data => {
            this.skuList = data;
            this.isLoading = false;
        });

        // İrsaliye arama için
        this.searchTermIrsaliye$.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            switchMap(term => this.searchItems(term, 'irsaliye'))
        ).subscribe(data => {
            this.irsaliyeler = data;
            this.isLoading = false;
        });

        // Düzenleme kontrolü
        const urunId = this.route.snapshot.paramMap.get('id');
        if (urunId) {
            this.isEditing = true;
            this.editingUrunId = urunId;
        }
    }

    initializeForm(): void {
        const today = this.formatDate(new Date().toISOString());

        // İrsaliye Formu
        this.irsaliyeForm = this.fb.group({
            faturaNo: [''],
            faturaSeri: [''],
            faturaTarih: [today],
            irsaliyeNo: ['', Validators.required],
            irsaliyeSeriNo: ['', Validators.required],
            irsaliyeTarih: [today, Validators.required],
            aciklama: [''],
            evrakSeri: ['', Validators.required],
            evrakSeriNo: ['', Validators.required],
            aktifMi: [true],
            statu: ['Yeni Girildi'],
            gonderenMagaza: ['', Validators.required],
            gonderilenMagaza: ['', Validators.required],
            onayTarih: [''],
        });

        // Tek bir SKU eklemek için kullanacağımız form
        this.skuForm = this.fb.group({
            birimFiyat: [''],
            birim: [''],
            miktar: [''],
            iskontooran: [''],
            stokName: [''],
            stokBirim: [''],
            tip: ['SKU'] // Varsayılan tip
        });
    }

    setActiveTab(tabName: string): void {
        this.activeTab = tabName;
    }

    isActiveTab(tabName: string): boolean {
        return this.activeTab === tabName;
    }

    setColumnTitles(): void {
        // Tablonun kolonlarını tanımlıyoruz. "field" değerleri, skus[] içindeki property isimleriyle eşleşmeli.
        this.cols = [
            // İşlemler sütunu (örneğin sil butonu vs. koymak isterseniz)
            { field: 'actions', title: this.translate.instant('İşlemler'), slot: 'actions' },

            // "stokName" Miktar sütununda görünmesin, 
            // Mesela tabloyu tam tersine yapmak istiyorsanız, "ürünAdi" ve "miktar" diyebilirsiniz.
            // Ama siz "Miktar" alanını "sku" adını göstermeyin diyorsanız, alanları değiştirin.
            
            // Örnek: 'stokName' -> 'Ürün Adı'
            { field: 'stokName', title: this.translate.instant('Ürün Adı') },

            // evrakSeri
            { field: 'evrakSeri', title: this.translate.instant('Evrak Seri') },

            // evrakSeriNo
            { field: 'evrakSeriNo', title: this.translate.instant('Evrak Seri No') },

            // iskontooran
            { field: 'iskontooran', title: this.translate.instant('İskonto Oran') },

            // miktar
            { field: 'miktar', title: this.translate.instant('Miktar') },
        ];
    }

    // SKU veya İrsaliye araması
    searchItems(term: string, type: string): Observable<any[]> {
        if (type === 'SKU') {
            return this.skuService.searchSkusAlis(term).pipe(
                catchError(() => of([]))
            );
        } else if (type === 'irsaliye') {
            return this.irsaliyeService.searchIrsaliye(term).pipe(
                catchError(() => of([]))
            );
        }
        return of([]);
    }

    onSearchTermChange(event: Event): void {
        const inputElement = event.target as HTMLInputElement;
        const value = inputElement.value;

        if (this.currentItemType === 'SKU') {
            this.isLoading = true;
            this.searchTerm$.next(value);
        }
    }

    onSearchTermChangeIrsaliye(event: Event): void {
        const inputElement = event.target as HTMLInputElement;
        const value = inputElement.value;

        if (this.currentItemTypeIrsaliye === 'irsaliye') {
            this.isLoading = true;
            this.searchTermIrsaliye$.next(value);
        }
    }

    onSearchReset(): void {
        this.searchTerm = '';
    }

    // SKU Modal aç
    openSkuSelectionModal(itemFormGroup: FormGroup): void {
        this.currentItemFormGroup = itemFormGroup;
        this.currentItemType = itemFormGroup.get('tip')?.value || 'SKU';
        this.modalSearchTerm = '';
        this.skuList = [];
        this.isLoading = false;
        this.modalSku.open();  
    }

    // İrsaliye Modal aç
    openIrsaliyeSelectionModal(): void {
        this.modalSearchTermIrsaliye = '';
        this.irsaliyeler = [];
        this.isLoading = false;
        this.modalIrsaliye.open();
    }

    // SKU Seç
    selectItem(selectedItem: any, modal: any): void {
        // Seçilen SKU bilgisini skuForm'a patch
        this.skuForm.patchValue({
            stokName: selectedItem.urunAdi,
            stokBirim: selectedItem.anaBirim,
            tip: 'SKU',
            birimFiyat: selectedItem?.satisFiyat?.fiyat || 0, // Birim fiyat yoksa 0
        });
        modal.close();
    }

    // İrsaliye Seç
    selectIrsaliye(selectedItem: any, modal: any): void {
        // Mevcut irsaliyeForm'u seçili irsaliye verileriyle dolduruyoruz
        this.irsaliyeForm.patchValue({
            faturaNo: selectedItem.faturaNo,
            faturaSeri: selectedItem.faturaSeri,
            faturaTarih: this.formatDate(selectedItem.faturaTarih),
            irsaliyeNo: selectedItem.irsaliyeNo,
            irsaliyeSeriNo: selectedItem.irsaliyeSeriNo,
            irsaliyeTarih: this.formatDate(selectedItem.irsaliyeTarih),
            aciklama: selectedItem.aciklama,
            evrakSeri: selectedItem.evrakSeri,
            evrakSeriNo: selectedItem.evrakSeriNo,
            aktifMi: selectedItem.aktifMi,
            statu: selectedItem.statu,
            gonderenMagaza: selectedItem.gonderenMagaza,
            gonderilenMagaza: selectedItem.gonderilenMagaza,
            onayTarih: selectedItem.onayTarih,
        });

        // Bu irsaliyenin daha önce eklenmiş SKU'larını tabloya yükle
        this.loadCikisIrsaliyeSku(selectedItem._id);
        this.isEditing = true;
        this.editingCikisIrsaliyeId = selectedItem._id;
        this.modalSearchTermIrsaliye = "";
        modal.close();
    }

    // SKU EKLE butonuna tıklanınca tabloya SKU ekle
    addItem(): void {
        if (this.skuForm.valid) {
            const newSku = { ...this.skuForm.value };
           
    
            if (this.isEditingSku && this.editingSkuId) {
                // Düzenleme modundaysa, ID ile öğeyi bul ve güncelle
                const index = this.skus.findIndex((sku) => sku._id === this.editingSkuId);
                if (index !== -1) {
                    this.skus[index] = { ...this.skus[index], ...newSku };
                } else {
                    console.error('Düzenlenmek istenen SKU bulunamadı.');
                }
            } else {
                // Yeni bir SKU ekleniyor
                this.skus.push(newSku);
            }
    
            // Listeyi güncelle ve filtre uygula
            this.applyFilter();
    
            // Formu sıfırla
            this.skuForm.reset({
                birimFiyat: '',
                birim: '',
                miktar: '',
                iskontooran: '',
                stokName: '',
                stokBirim: '',
                tip: 'SKU',
            });
    
            this.isEditingSku = false;
            this.editingSkuId = '';
        }
    }
    
    loadCikisIrsaliyeSku(id: string): void {
        this.irsaliyeService.getCikisIrsaliyeSku(id).pipe(
            catchError((error) => {
                this.notificationService.showNotification(
                    this.translate.instant("thereisanerroronloadingdata"), 
                    'danger', 
                    'top-end'
                );
                return of([]);
            })
        ).subscribe((data) => {
            // data = [{ stokName:'...', miktar: 3, ...}, ... ]
            this.skus = data;
            this.filteredSkus = this.skus;
            console.log('loadCikisIrsaliyeSku', this.skus);
        });
    }

    // "Kaydet" butonu (Genel Bilgiler)
    onSubmit(): void {
        if (this.irsaliyeForm.valid) {
            const irsaliyeData = this.irsaliyeForm.value;
            if (this.isEditing) {
                this.updateIrsaliye(this.editingUrunId!, irsaliyeData);
            } else {
                this.addIrsaliye(irsaliyeData);
            }
        }
    }

    // "Kaydet" butonu (SKU)
    onSubmitSku(): void {
        // Tüm tablo verileri => this.skus
        console.log('Kaydedilecek SKU listesi:', this.skus);
        if (this.editingCikisIrsaliyeId) {
            // Mevcut irsaliye -> update sku
            this.updateIrsaliyeSku(this.editingCikisIrsaliyeId, this.skus);
        } else {
            // Henüz bir irsaliye ID yoksa, önce irsaliyeyi kaydedeceksiniz
            console.log('Önce irsaliyeyi kaydedin');
        }
    }

    addIrsaliye(irsaliyeData: any): void {
        this.irsaliyeService.addCikisIrsaliye(irsaliyeData).subscribe({
            next: (addedIrsaliye) => {
                this.irsaliyeler.push(addedIrsaliye);
                this.notificationService.showNotification(this.translate.instant("addSuccess"), 'success', 'top-end');
                this.isAddingNew = false;
            },
            error: (error) => {
                this.notificationService.showNotification(this.translate.instant("addError"), 'danger', 'top-end');
            }
        });
    }

    updateIrsaliye(id: string, updatedIrsaliye: any): void {
        this.irsaliyeService.updateCikisIrsaliye(id, updatedIrsaliye).subscribe({
            next: () => {
                this.notificationService.showNotification(this.translate.instant("updateSuccess"), 'success', 'top-end');
            },
            error: (error) => {
                this.notificationService.showNotification(this.translate.instant("updateError"), 'danger', 'top-end');
            }
        });
    }

    updateIrsaliyeSku(id: string, updatedIrsaliyeSkus: any[]): void {
        this.irsaliyeService.updateCikisIrsaliyeSku(id, updatedIrsaliyeSkus).subscribe({
            next: () => {
                this.notificationService.showNotification(this.translate.instant("updateSuccess"), 'success', 'top-end');
            },
            error: (error) => {
                this.notificationService.showNotification(this.translate.instant("updateError"), 'danger', 'top-end');
            }
        });
    }

    resetForm(): void {
        this.irsaliyeForm.reset();
        this.initializeForm();
        this.isEditing = false;
    }

    editUrun(urun: any): void {
        this.isEditing = true;
        this.editingUrunId = urun._id;
        this.isFormOpen = true; 
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    editSKU(sku: any): void {
        this.skuForm.patchValue({
            birimFiyat: sku.birimFiyat,
            birim: sku.birim,
            miktar: sku.miktar,
            iskontooran: sku.iskontooran,
            stokName: sku.stokName,
            stokBirim: sku.stokBirim,
            tip: sku.tip,
        });
        this.isEditingSku =true;
        this.editingSkuId = sku._id;
        console.log(this.editingSkuId);
        this.isAddingNew = false;
    }

    deleteSku(sku :any){
        if (confirm(this.translate.instant("deleteConfirmation"))) {
            console.log("silindi"+sku);
            this.irsaliyeService.deleteCikisIrsaliyeSku(sku._id).subscribe({
                next: () => {
                    this.irsaliyeler = this.irsaliyeler.filter((irsaliye) => irsaliye._id !== sku._id);
                    this.notificationService.showNotification(this.translate.instant("deleteSuccess"), 'success', 'top-end');
                },
                error: () => {
                    this.notificationService.showNotification(this.translate.instant("deleteError"), 'danger', 'top-end');
                }
            });
        }
    }

    deleteIrsaliye(id: string): void {
        if (confirm(this.translate.instant("deleteConfirmation"))) {
            this.irsaliyeService.deleteCikisIrsaliye(id).subscribe({
                next: () => {
                    this.irsaliyeler = this.irsaliyeler.filter((irsaliye) => irsaliye._id !== id);
                    this.notificationService.showNotification(this.translate.instant("deleteSuccess"), 'success', 'top-end');
                },
                error: () => {
                    this.notificationService.showNotification(this.translate.instant("deleteError"), 'danger', 'top-end');
                }
            });
        }
    }

    loadMagazalar(): void {
        this.magazaService.getMagazalarim().pipe(
            catchError((error) => {
                if (error?.error?.message && error.error.message.includes('yetkiniz yok')) {
                    this.notificationService.showNotification(this.translate.instant("thereisnoauthorizationforthisprocess"), 'danger', 'top-end');
                } else {
                    this.notificationService.showNotification(this.translate.instant("thereisanerroronloadingstockdatas"), 'danger', 'top-end');
                }
                return of([]);
            })
        ).subscribe((data) => {
            this.magazalar = data;
        });
    }

    formatDate(dateString: string): string {
        if (!dateString) return '';
        const date = new Date(dateString);
        return `${date.getFullYear()}-${('0' + (date.getMonth() + 1)).slice(-2)}-${('0' + date.getDate()).slice(-2)}`;
    }

    ngAfterViewInit(): void {
        const lightbox = GLightbox({
            selector: '.glightbox'
        });
    }

    applyFilter(): void {
        this.filteredSkus = this.skus.filter((sku) => {
            // Arama
            let matchesSearchTerm = true;
            if (this.searchTerm) {
                const sTerm = this.searchTerm.toLowerCase();
                matchesSearchTerm =
                    (sku.stokName && sku.stokName.toLowerCase().includes(sTerm)) ||
                    (sku.stokBirim && sku.stokBirim.toLowerCase().includes(sTerm));
            }

            // Pasif/aktif (SKU’da 'aktif' alanı yoksa default true sayıyoruz)
            const isActive = sku.aktif !== false;
            const matchesActiveStatus = this.showPassive ? true : isActive;

            return matchesSearchTerm && matchesActiveStatus;
        });
    }
}
