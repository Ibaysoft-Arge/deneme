import { AfterViewInit, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { SkuService } from 'src/app/service/sku.service';
import { Subject, Observable, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { slideDownUp, toggleAnimation } from 'src/app/shared/animations';
import { NotificationService } from '../../NotificationService';
import { TranslateService } from '@ngx-translate/core';
import { MagazaService } from 'src/app/service/magaza.service';
import { ClusterService } from 'src/app/service/cluster.service';
import GLightbox from 'glightbox';
import { SiparisOlusturmaService } from 'src/app/service/SiparisOlusturma/siparisOlusturmaEkrani';


@Component({
    selector: 'app-urun',
    templateUrl: './siparisEkraniOlusturma.html',
    animations: [toggleAnimation, slideDownUp]
})
export class SiparisEkraniOlusturmaComponent implements OnInit,AfterViewInit {
    siparisForm!: FormGroup;
    isEditing: boolean = false;
    editingUrunId!: string;
    @ViewChild('modal18') modal18!: any; // Modal referansı
    currentItemFormGroup!: FormGroup;
    currentItemType: string = 'SKU';
    searchTerm: string = '';

    modalSearchTerm: string = ''; // Bu modal içindeki arama için
    itemList: any[] = [];
    isLoading: boolean = false;
    isFormOpen: boolean = false;
    activeTab: string = 'genel';
    validUnits: string[] = ['adet', 'kg', 'litre', 'paket', 'kutu', 'metre'];
    searchTerm$ = new Subject<string>();

    magazalar: any[] = [];
    clusters: any[] = [];
    selectedCluster: any[] = [];
    days: { value: string; label: string }[] = [
        { value: 'pazartesi', label: 'Monday' },
        { value: 'sali', label: 'Tuesday' },
        { value: 'carsamba', label: 'Wednesday' },
        { value: 'persembe', label: 'Thursday' },
        { value: 'cuma', label: 'Friday' },
        { value: 'cumartesi', label: 'Saturday' },
        { value: 'pazar', label: 'Sunday' },
    ]; // Gün listesi
    editMode = false;

    @ViewChild('skuModal') skuModal!: any; // Modal referansı
    @ViewChild('clusterModal') clusterModal!: any; // Modal referansı

    constructor(
        private fb: FormBuilder,
        private skuService: SkuService,
        private route: ActivatedRoute,
        private notificationService: NotificationService,
        private translate: TranslateService,
        private magazaService: MagazaService,
        private clusterService: ClusterService,
        private siparisOlusturmaService:SiparisOlusturmaService
    ) { }

    ngOnInit(): void {
        this.initializeForm();
        this.loadCluster();

        this.searchTerm$.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            switchMap(term => this.searchItems(term))
        ).subscribe(data => {
            this.itemList = data;
            this.isLoading = false;
        });

        // Düzenleme kontrolü
        const urunId = this.route.snapshot.paramMap.get('id');
        if (urunId) {
            this.isEditing = true;
            this.editingUrunId = urunId;
            this.loadUrun(urunId);
        }
    }

    initializeForm(): void {
        this.siparisForm = this.fb.group({
            siparisAdi: ['', Validators.required],
            aciklama: [''],
            baslangicTarihi: ['', Validators.required],
            bitisTarihi: ['', Validators.required],
            gunlukMaxSiparis: ['', Validators.required],
            gunler: [[]], // Günler bir array olarak
            magazas: [[]],
            skus: this.fb.array([]) // SKU'lar için bir FormArray
        });
    }

    get skus(): FormArray<FormGroup> {
        return this.siparisForm.get('skus') as FormArray<FormGroup>;
    }

    setActiveTab(tabName: string): void {
        this.activeTab = tabName;
    }

    isActiveTab(tabName: string): boolean {
        return this.activeTab === tabName;
    }

    // Ana arama
    onSearchChange(): void {
        // if (this.searchTerm.trim() !== '') {
        //     this.urunService.searchUruns(this.searchTerm).subscribe({
        //         next: (data) => {
        //             this.urunler = data;
        //         },
        //         error: (error) => {
        //             console.error('Arama yapılırken hata oluştu:', error);
        //         }
        //     });
        // } else {
        //     this.loadUrunler();
        // }
    }

    // Modal arama
    onSearchTermChange(event: Event): void {
        const inputElement = event.target as HTMLInputElement;
        const value = inputElement.value;
        this.isLoading = true;
        this.searchTerm$.next(value);
    }

    onSearchReset(): void {
        this.searchTerm = '';
    }

    openItemSelectionModal(itemFormGroup: FormGroup): void {
        this.currentItemFormGroup = itemFormGroup;
        this.currentItemType = itemFormGroup.get('tip')?.value || 'SKU';
        this.modalSearchTerm = '';  // Modal aramasını sıfırlıyoruz
        this.itemList = [];
        this.isLoading = false;
        this.modal18.open();
    }

    searchItems(term: string): Observable<any[]> {
        return this.skuService.searchSkus(term);
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
            itemId: ['', Validators.required],
            selectedItemName: ['', Validators.required],
            min: [1],
            max: [1],
            tip: ['']
        });
        this.skus.push(itemGroup);  // FormArray'ye yeni item ekliyoruz
    }

    removeItem(index: number): void {
        this.skus.removeAt(index);  // Item'ı silmek için
    }

    loadUrun(id: string): void {
        // this.urunService.getUrunById(id).subscribe({
        //     next: (data) => {
        //         this.siparisForm.patchValue({
        //             ...data,
        //             urunKategori: data.urunKategori?._id || data.urunKategori, // Kategori ID'si
        //             urunAltKategori: data.urunAltKategori?._id || data.urunAltKategori, // Alt Kategori ID'si
        //             standartFiyat: data.standartFiyat || 0 // Standart fiyat setleniyor
        //         });

        //         // Kategoriye bağlı alt kategorileri yükle
        //         if (data.urunKategori?._id) {
        //         }

        //         // FormArray öğelerini temizleyip yeniden ekle
        //         while (this.skus.length) {
        //             this.skus.removeAt(0);
        //         }

        //         data.items.forEach((item: any) => {
        //             const itemGroup = this.fb.group({
        //                 itemId: [item.itemId?._id || item.itemId, Validators.required],
        //                 selectedItemName: [item.itemId?.urunAdi || ''],
        //                 min: [item.min, Validators.required],
        //                 max: [item.max, Validators.required],
        //             });
        //             this.skus.push(itemGroup);
        //         });
        //     },
        //     error: (error) => {
        //         console.error('Ürün yüklenirken hata oluştu:', error);
        //     }
        // });
    }

    // Ürünleri kaydetme
    onSubmit(): void {
        if (this.siparisForm.valid) {
          const urunData = this.siparisForm.value;
          if (this.isEditing) {
            this.siparisOlusturmaService.updateOrder(urunData._id,urunData).subscribe({
              next: (response) => {
                console.log(response);
                this.isEditing = false;
                this.notificationService.showNotification(this.translate.instant('productupdatesuccessfully'), "success", 'top-end');
              },
              error: (error) => {
                console.error(error);
              }
            });
          } else {
            this.siparisOlusturmaService.createOrder(urunData).subscribe({
              next: (response) => {
                console.log(response);
                this.notificationService.showNotification(this.translate.instant('productaddedsuccessfully'), "success", 'top-end');
              },
              error: (error) => {
                console.error(error);
              }
            });
          }
        }
      }
      
    resetForm(): void {
        this.siparisForm.reset();
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

    deleteSiparis(id: string): void {
        if (confirm('Bu ürünü silmek istediğinize emin misiniz?')) {
            this.siparisOlusturmaService.deleteOrder(id).subscribe({
                next: () => {

                },
                error: (error) => {
                    console.error('Ürün silinirken hata oluştu:', error);
                }
            });
        }
    }

    openClusterSelectionModal(): void {
        this.clusterModal.open();
    }

    removeMagaza(magazaId: string): void {
        if (!magazaId) {
            console.error('Geçersiz ürün ID');
            return;
        }
        const initialLength = this.magazalar.length;
        this.magazalar = this.magazalar.filter((p) => p._id !== magazaId);

        if (this.magazalar.length === initialLength) {
            console.warn(`Magaza ID'si bulunamadı: ${magazaId}`);
        }
    }

    removeMagazalar(): void {
        this.magazalar = [];
    }

    loadMagazalarByCluster(id: string): void {
        this.magazaService
            .getMagazalarByClusterID(id)
            .pipe(
                catchError((error) => {
                    if (error?.error?.message && error.error.message.includes('yetkiniz yok')) {
                        this.notificationService.showNotification(this.translate.instant('thereisnoauthorizationforthisprocess'), 'danger', 'top-end');
                    } else {
                        this.notificationService.showNotification(this.translate.instant('thereisanerroronloadingstockdatas'), 'danger', 'top-end');
                    }
                    return of([]); // boş array döndürerek hata durumunu yönetiyoruz
                }),
            )
            .subscribe((data) => {
                data.forEach((element: any) => {
                    // Eğer 'magazalar' listesinde bu öğe yoksa, ekle
                    const isExist = this.magazalar.some(magaza => magaza._id === element._id); // burada id'yi kontrol ediyorum, sen farklı bir kritere göre de kontrol edebilirsin
                    if (!isExist) {
                        this.magazalar.push(element);
                    }
                });
                this.siparisForm.get('magazas')?.setValue(this.magazalar);
            });
    }

    selectCluster(cluster: any): void {
        if (!this.selectedCluster.some((p) => p._id === cluster._id)) {
            this.selectedCluster.push(cluster);
        }
        this.loadMagazalarByCluster(cluster._id);
    }

    loadCluster(): void {
        this.clusterService
            .getClusters()
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
                this.clusters = data;
            });
    }

    formatDate(dateString: string): string {
        const date = new Date(dateString);
        const year = date.getFullYear(); // Yıl
        const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Ay (0'dan başlıyor, bu yüzden 1 ekliyoruz)
        const day = date.getDate().toString().padStart(2, '0'); // Gün

        return `${year}-${month}-${day}`; // yyyy-MM-dd formatında döndürüyoruz
    }

    ngAfterViewInit(): void {
        const lightbox = GLightbox({
            selector: '.glightbox' // Replace with your selector as needed
        });
    }
}
