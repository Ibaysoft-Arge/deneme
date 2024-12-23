import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { toggleAnimation, slideDownUp } from 'src/app/shared/animations'; // Animasyonları ekle
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { CariService } from 'src/app/service/cari.service';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from 'src/app/apps/NotificationService';

@Component({
    templateUrl: './cari.html',
    animations: [toggleAnimation, slideDownUp], // Animasyonları ekle
})
export class CariComponent implements OnInit {
    cariler: any[] = [];
    filteredCariler: any[] = [];
    searchTerm: string = '';
    showPassive: boolean = false;
    itemsPerPage: number = 3;
    cols: any[] = [];
    setColumnTitles(): void {
        this.cols = [
            { field: 'actions', title: this.translate.instant('transactions'), slot: 'actions' },
            { field: 'cariKodu', title: this.translate.instant('cariKodu') },
            { field: 'cariAdi', title: this.translate.instant('cariAdi') },
            { field: 'vergiNo', title: this.translate.instant('vergiNo') },
            { field: 'vergiDairesi', title: this.translate.instant('vergiDairesi') },
            { field: 'yetkili', title: this.translate.instant('yetkili') },
            { field: 'aktifMi', title: this.translate.instant('aktifMi') },
        ];
    }
    currentPage: number = 1; // Mevcut sayfa numarası
    addCariForm: FormGroup;
    editingCariId: string | null = null; // Düzenleme durumunu takip etmek için
    permissionDenied: boolean = false;
    accordians3: any = null; // Accordion kontrolü için değişken
    activeTab: string = 'genel'; // Default aktif sekme 'genel'
    isAddingNew: boolean = true; // Yeni ekleme işlemini takip etmek için
    selectedStatus: string = 'all'; // Default to show all

    constructor(
        public fb: FormBuilder,
        public storeData: Store<any>,
        private cariService: CariService,
        private notificationService: NotificationService,
        private translate: TranslateService,
    ) {

        this.addCariForm = this.fb.group({
            cariKodu: ['', Validators.required],
            cariAdi: ['', Validators.required],
            vergiNo: ['', Validators.required],
            vergiDairesi: ['', Validators.required],
            aciklama: ['', Validators.required],
            email: ['', Validators.required],
            // tel: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
            tel: [''],
            fax: [''],
            yetkili: ['', Validators.required],
            adres: ['', Validators.required],
            aktifMi: [true],
            muhasebeKodu: ['', Validators.required],
            ticSicNo: ['', Validators.required],
            vade: [''],
        });

        this.setColumnTitles();

        this.translate.onLangChange.subscribe(() => {
            this.setColumnTitles();
        });
    }

    onCategoryFilterChange(): void {
        this.applyFilter();
    }

    ngOnInit(): void {
        this.loadCariler();

    }



    loadCariler(): void {
        this.cariService
            .getCari()
            .pipe(
                catchError((error) => {
                    if (error?.error?.message && error.error.message.includes('yetkiniz yok')) {
                        this.permissionDenied = true;

                        this.notificationService.showNotification(this.translate.instant('thereisnoauthorizationforthisprocess'), 'danger', 'top-end');
                    } else {
                        this.notificationService.showNotification(this.translate.instant('thereisanerroronloadingcaridatas'), 'danger', 'top-end');
                    }
                    return of([]);
                }),
            )
            .subscribe((data) => {
                if (!this.permissionDenied) {
                    this.cariler = data.cariler;
                    this.filteredCariler = data.cariler;
                    this.applyFilter();
                }
            });
    }

    applyFilter(): void {
        this.filteredCariler = this.cariler.filter((cari) => {
            // Arama terimi ile eşleşme
            const matchesSearchTerm = this.searchTerm ? cari.statu.toLowerCase().includes(this.searchTerm.toLowerCase()) : true;

            // Aktif/Pasif durumu kontrolü
            const matchesActiveStatus = (() => {
                switch (this.selectedStatus) {
                    case 'all':
                        return true;
                    case 'aktif':
                        return cari.statu === 'aktif';
                    case 'pasif':
                        return cari.statu === 'pasif';
                    case 'beklemede':
                        return cari.statu === 'beklemede';
                    default:
                        return true;
                }
            })();

            return matchesSearchTerm && matchesActiveStatus;
        });
    }

    onToggleShowPassive(): void {
        this.applyFilter();
    }

    onSearchTermChange(): void {
        this.applyFilter();
    }

    pageChange(page: number): void {
        this.currentPage = page;
    }


    //düzenlenecek
    onSearchChange(): void {
        if (this.searchTerm) {
            this.filteredCariler = this.cariler.filter(
                (cari) =>
                    cari.magazaAdi.toLowerCase().includes(this.searchTerm.toLowerCase()) || cari.firmasahip.toLowerCase().includes(this.searchTerm.toLowerCase()),
            );
        } else {
            this.filteredCariler = [...this.cariler];
        }
    }

    saveCari(): void {
        if (this.addCariForm.valid) {
            if (this.editingCariId) {
                // Güncelleme işlemi
                const updatedCari = this.addCariForm.value;
                console.log('cari:', updatedCari);
                this.updateCari(this.editingCariId, updatedCari);
            } else {
                const newCari = this.addCariForm.value;

                console.log('cari:', newCari);
                this.addCari(newCari);
            }
        } else {
            this.notificationService.showNotification(this.translate.instant('thereisanerroronsavingupdatingstore'), 'danger', 'top-end');
        }
    }

    addCari(newCari: any): void {
        this.cariService.addCari(newCari).subscribe({
            next: (addedCari) => {
                this.cariler.push(addedCari);
                this.applyFilter();
                this.notificationService.showNotification(this.translate.instant('addingstoresuccessfull'), 'success', 'top-end');
                this.isAddingNew = false;
                this.editingCariId = addedCari._id;
                this.loadCariler();
            },
            error: (error) => {
                if (error?.error?.msg === 'Bu cari kodu zaten kullanılıyor.') {
                    this.notificationService.showNotification(this.translate.instant('storecodealreadyexist'), 'danger', 'top-end');
                } else {
                    this.notificationService.showNotification(this.translate.instant('erroronaddingstore'), 'danger', 'top-end');
                }
            },
        });
    }

    updateCari(id: string, updatedCari: any): void {
        this.cariService.updateCari(id, updatedCari).subscribe({
            next: (updatedCariResponse) => {
                const index = this.cariler.findIndex((cari) => cari._id === id);
                if (index !== -1) {
                    this.cariler[index] = {
                        ...this.cariler[index],
                    };
                }
                this.applyFilter();
                this.notificationService.showNotification(this.translate.instant('updatingcarisuccessfull'), 'success', 'top-end');

                this.editingCariId = id;
                this.isAddingNew = false;
                this.loadCariler();
            },
            error: (error) => {
                console.error('Cari güncelleme hatası:', error);
                this.notificationService.showNotification(this.translate.instant('erroronupdatingcari'), 'danger', 'top-end');
            },
        });
    }

    editCari(cari: any): void {
        this.addCariForm.patchValue({
            cariKodu: cari.cariKodu,
            cariAdi: cari.cariAdi,
            vergiNo: cari.vergiNo,
            vergiDairesi: cari.vergiDairesi,
            aciklama: cari.aciklama,
            email: cari.email,
            tel: cari.tel,
            fax: cari.fax,
            yetkili: cari.yetkili,
            adres: cari.adres,
            aktifMi: cari.aktifMi,
            muhasebeKodu: cari.muhasebeKodu,
            ticSicNo: cari.ticSicNo,
            vade: cari.vade,
        });

        this.editingCariId = cari._id;
        this.isAddingNew = false;
        this.accordians3 = 1;
    }

    // Mağaza seçimi yapıldığında tetiklenen fonksiyon
    onCariChange(): void {
        const selectedCariId = this.addCariForm.get('cari')?.value;

        if (selectedCariId) {
            // Seçilen mağaza bilgilerini almak
            const selectedCari = this.cariler.find((cari) => cari._id === selectedCariId);
            if (selectedCari) {
                // editMagaza fonksiyonunu çağırarak mağaza bilgilerini iletme
                this.editCari(selectedCari);
            }
        }
    }

    deleteCari(cariId: string): void {
        if (confirm('Bu Cariyi silmek istediğinizden emin misiniz?')) {
            this.cariService.deleteCari(cariId).subscribe({
                next: () => {
                    this.cariler = this.cariler.filter((cari) => cari._id !== cariId);
                    this.notificationService.showNotification(this.translate.instant('deletingcarisuccessfull'), 'success', 'top-end');
                },
                error: (error) => {
                    console.error('Silme hatası:', error);
                    this.notificationService.showNotification(this.translate.instant('errorondeletingcari'), 'danger', 'top-end');
                },
            });
        }
    }

    setActiveTab(tab: string): void {
        this.activeTab = tab;
    }

    isActiveTab(tab: string): boolean {
        return this.activeTab === tab;
    }

    startNewCari(): void {
        this.isAddingNew = true;
        this.addCariForm.reset();
        this.editingCariId = null;
        this.accordians3 = 1;
    }

    resetForm(): void {
        this.addCariForm.reset();
        this.addCariForm.patchValue({});
        this.editingCariId = null;
    }

    formatDate(dateString: string): string {
        if (!dateString) return '';
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = ('0' + (date.getMonth() + 1)).slice(-2);
        const day = ('0' + date.getDate()).slice(-2);
        return `${year}-${month}-${day}`;
    }
}
