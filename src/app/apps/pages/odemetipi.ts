import { AfterViewInit, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { catchError, of } from 'rxjs';
import { NotificationService } from 'src/app/apps/NotificationService';
import { OdemeTipiService } from 'src/app/service/odemetipi.service';
import 'intro.js/introjs.css';
import { IntroJs } from 'intro.js/src/intro';
import introJs from 'intro.js';
import GLightbox from 'glightbox';

@Component({
    selector: 'app-odeme-tipi',
    templateUrl: './odemetipi.html',
})
export class OdemeTipiComponent implements OnInit,AfterViewInit {
    intro!: IntroJs;
    odemeTipiForm: FormGroup;
    isEditing: boolean = false;
    editingOdemeTipiId: string | null = null;
    activeTab: string = 'genel';
    odemeTipi: any[] = [];
    isFormOpen: boolean = false;
    editMode = false;
    filteredOdemeTipi: any[] = [];
    searchTerm = '';
    filters = {
        odemeAdi: '',
        aciklama: '',
        muhasebeKodu: '',
        entegrasyonKodu: '',
    };
    sortColumn: string | null = null;
    sortDirection: 'asc' | 'desc' = 'asc';

    constructor(
        private fb: FormBuilder,
        private translate: TranslateService,
        private notificationService: NotificationService,
        private odemeTipiService: OdemeTipiService,
    ) {
        this.odemeTipiForm = this.fb.group({
            odemeAdi: ['', [Validators.required]],
            aciklama: [''],
            muhasebeKodu: [''],
            entegrasyonKodu: [''],
        });
    }

    ngOnInit(): void {
        this.loadOdemeTipi();
           //  this.startIntro();
           const tourCompleted = localStorage.getItem('odemeTourCompleted');
           if (!tourCompleted) {
            // this.startIntro();
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
              intro: 'Bu alandan ödeme tiplerinizi görebilir yönetebilisiniz.',
              position: 'top'
            },
            {
                element: '#step2',
                intro: 'Bu alandan ödeme tiplerinizi görebilir yönetebilisiniz.',
                position: 'bottom'
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
                this.isFormOpen=true; // 'items' sekmesini aktif hale getirir
           }
          else  if (currentStep === 1) { // 0 tabanlı index (step3 = index 2)
                this.setActiveTab('genel'); // 'items' sekmesini aktif hale getirir
                this.isFormOpen=true; // 'items' sekmesini aktif hale getirir
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
        localStorage.setItem('odemeTourCompleted', 'true');
      }

    loadOdemeTipi(): void {
        this.odemeTipiService.getOdemeTipi().subscribe(
            (data) => ((this.odemeTipi = data), (this.filteredOdemeTipi = this.odemeTipi)),
            (error) => this.notificationService.showNotification(this.translate.instant('paymenttypescouldnotbereceived'), 'error', 'topRight'),
        );
    }

    saveOdemeTipi(): void {
        if (this.odemeTipiForm.valid) {
            const odemeTipiData = this.odemeTipiForm.value;

            if (this.isEditing && this.editingOdemeTipiId) {
                this.odemeTipiService
                    .updateOdemeTipi(this.editingOdemeTipiId, odemeTipiData)
                    .pipe(
                        catchError((error) => {
                            console.error('paymenttypeupdateerror', error);
                            if (error?.error?.message && error.error.message.includes('yetkiniz yok')) {
                                this.notificationService.showNotification(this.translate.instant('thereisnoauthorizationforthisprocess'), 'error', 'top-end');
                            } else {
                                this.notificationService.showNotification(this.translate.instant('paymenttypeupdateerror'), 'error', 'top-end');
                            }
                            return of(null); // Hata durumunda boş değer döndür
                        }),
                    )
                    .subscribe((response) => {
                        if (response) {
                            this.notificationService.showNotification(this.translate.instant('paymenttypeupdated'), 'success', 'top-end');
                            this.resetForm();
                            this.loadOdemeTipi();
                        }
                    });
            } else {
                this.odemeTipiService
                    .addOdemeTipi(odemeTipiData)
                    .pipe(
                        catchError((error) => {
                            console.error('Ödeme Tipi ekleme hatası:', error);
                            if (error?.error?.message && error.error.message.includes('yetkiniz yok')) {
                                this.notificationService.showNotification(this.translate.instant('thereisnoauthorizationforthisprocess'), 'error', 'top-end');
                            } else {
                                this.notificationService.showNotification(this.translate.instant('paymenttypecouldnotadded'), 'error', 'top-end');
                            }
                            return of(null); // Hata durumunda boş değer döndür
                        }),
                    )
                    .subscribe((response) => {
                        if (response) {
                            this.notificationService.showNotification(this.translate.instant('paymenttypeadded'), 'success', 'top-end');
                            this.resetForm();
                            this.loadOdemeTipi();
                        }
                    });
            }
        } else {
            this.notificationService.showNotification(this.translate.instant('invalidforminformation'), 'error', 'top-end');
        }
    }

    resetForm(): void {
        this.odemeTipiForm.reset();
        this.isEditing = false;
        this.editingOdemeTipiId = null;
    }

    editOdemeTipi(odemetipi: any): void {
        this.isEditing = true;
        this.editingOdemeTipiId = odemetipi._id;
        this.odemeTipiForm.patchValue({
            odemeAdi: odemetipi.odemeAdi,
            aciklama: odemetipi.aciklama,
            muhasebeKodu: odemetipi.muhasebeKodu,
            entegrasyonKodu: odemetipi.entegrasyonKodu,
        });
        this.isFormOpen = false;
    }

    deleteSatisKaynak(id: string): void {
        this.odemeTipiService
            .deleteOdemeTipi(id)
            .pipe(
                catchError((error) => {
                    console.error('Ödeme Tipi silme hatası:', error);
                    if (error?.error?.message && error.error.message.includes('yetkiniz yok')) {
                        this.notificationService.showNotification(this.translate.instant('thereisnoauthorizationforthisprocess'), 'error', 'top-end');
                    } else {
                        this.notificationService.showNotification(this.translate.instant('paymenttypecouldnotbedeleted'), 'error', 'top-end');
                    }
                    return of(null); // Hata durumunda boş değer döndür
                }),
            )
            .subscribe((response) => {
                if (response !== null) {
                    // Başarılı durum
                    this.odemeTipi = this.odemeTipi.filter((m) => m._id !== id);
                    this.loadOdemeTipi();
                    this.notificationService.showNotification(this.translate.instant('paymenttypedeleted'), 'success', 'top-end');
                }
            });
    }

    // Tab switching method
    setActiveTab(tab: string): void {
        this.activeTab = tab;
    }

    isActiveTab(tab: string): boolean {
        return this.activeTab === tab;
    }

    toggleForm(): void {
        this.isFormOpen = !this.isFormOpen;
    }

    onSearchChange() {
        this.applyFilters();
    }

    onSearchReset() {
        this.searchTerm = '';
        this.filters = { odemeAdi: '', aciklama: '', muhasebeKodu: '', entegrasyonKodu: '' };
        this.applyFilters();
    }

    applyFilters() {
        this.filteredOdemeTipi = this.odemeTipi.filter((item) => {
            const matchesSearchTerm =
                this.searchTerm === '' ||
                item.odemeAdi.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                item.aciklama.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                item.muhasebeKodu.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                item.entegrasyonKodu.toLowerCase().includes(this.searchTerm.toLowerCase());

            const matchesFilters =
                (this.filters.odemeAdi === '' || item.odemeAdi.includes(this.filters.odemeAdi)) &&
                (this.filters.aciklama === '' || item.aciklama.includes(this.filters.aciklama)) &&
                (this.filters.muhasebeKodu === '' || item.muhasebeKodu.includes(this.filters.muhasebeKodu)) &&
                (this.filters.entegrasyonKodu === '' || item.entegrasyonKodu.includes(this.filters.entegrasyonKodu));

            return matchesSearchTerm && matchesFilters;
        });
    }

    sortData(column: string) {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortDirection = 'asc';
            this.sortColumn = column;
        }

        this.filteredOdemeTipi.sort((a, b) => {
            let comparison = 0;
            if (a[column] > b[column]) {
                comparison = 1;
            } else if (a[column] < b[column]) {
                comparison = -1;
            }

            return this.sortDirection === 'asc' ? comparison : -comparison;
        });
    }
    ngAfterViewInit(): void {
        const lightbox = GLightbox({
            selector: '.glightbox' // Replace with your selector as needed
        });
    }
}
