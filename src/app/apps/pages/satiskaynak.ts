import { AfterViewInit, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { SatisKaynakService } from 'src/app/service/satiskaynak.service';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from 'src/app/apps/NotificationService';
import { MenuService } from 'src/app/service/menu.service';
import 'intro.js/introjs.css';
import { IntroJs } from 'intro.js/src/intro';
import introJs from 'intro.js';
import { OdemeTipiService } from 'src/app/service/odemetipi.service';
import GLightbox from 'glightbox';


@Component({
    selector: 'app-satis-kaynak',
    templateUrl: './satiskaynak.html',
})
export class SatisKaynakComponent implements OnInit,AfterViewInit {
    intro!: IntroJs;
    satisKaynakForm: FormGroup;
    isEditing: boolean = false;
    editingSatisKaynakId: string | null = null;
    activeTab: string = 'genel';
    menus: any[] = [];
    odemeTipi: any[] = [];
    satisKaynak: any[] = [];
    isFormOpen: boolean = false;
    editMode = false;
    selectedMenuId: string | null = null;
    filteredSatisKaynak: any[] = []; // Filtrelenmiş listeyi burada saklayacağız
    searchTerm = '';
    filters = {
        kaynakAdi: '',
        aciklama: ''
    };
    tipOptions = [
        { label: 'Masa', value: 'masa' },
        { label: 'Gel-Al', value: 'gelal' },
        { label: 'Paket', value: 'paket' },
        { label: 'TrendYol', value: 'TrendYolm1' },
        { label: 'TrendYolGo', value: 'TrendYolGo' },
        { label: 'YemekSepeti', value: 'YemekSepeti' },
        { label: 'YsVale', value: 'YsVale' },
        { label: 'Getir', value: 'Getir' },
        { label: 'GetirRG', value: 'GetirRG' },
        { label: 'MigrosYemek', value: 'MigrosYemek' },
        { label: 'MigrosYemekM1', value: 'MigrosYemekM1' },
    ];
    sortColumn: string | null = null;
    sortDirection: 'asc' | 'desc' = 'asc';

    constructor(
        private fb: FormBuilder,
        private satisKaynakService: SatisKaynakService,
        private translate: TranslateService,
        private notificationService: NotificationService,
        private menuService: MenuService,
        private odemeTipiService: OdemeTipiService
    ) {

        this.satisKaynakForm = this.fb.group({
            kaynakAdi: ['', [Validators.required]],
            aciklama: [''],
            menuler: [[]],  // FormArray for holding selected menu items
            tip: ['', [Validators.required]],  // Yeni tip alanı
            kdvOrani: ['', [Validators.required]],
            odemeTipi: [[]]
        });
    }

    ngOnInit(): void {
        // Load existing data if in edit mode
        this.loadSatisKaynak();
        this.loadOdemeTipi();
        this.loadMenu();
        //  this.startIntro();
        const tourCompleted = localStorage.getItem('satisTourCompleted');
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
                    intro: 'Buradan ürünlerinizi ekleyebilir ve yönetebilirsiniz,ürün ekle butonuna basarak devam edebilirsiniz.',
                    position: 'top'
                },
                {
                    element: '#step2',
                    intro: 'Bu alandan ürünün genel bilgilerini görebilirsiniz.',
                    position: 'right'
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
                this.isFormOpen = true; // 'items' sekmesini aktif hale getirir
            }
            else if (currentStep === 1) { // 0 tabanlı index (step3 = index 2)
                this.setActiveTab('genel'); // 'items' sekmesini aktif hale getirir
                this.isFormOpen = true; // 'items' sekmesini aktif hale getirir
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

    loadSatisKaynak(): void {
        this.satisKaynakService.getSatisKaynak().subscribe(
            (data) => (this.satisKaynak = data,
                this.filteredSatisKaynak = this.satisKaynak
            ),
            (error) => this.notificationService.showNotification(this.translate.instant("saleresourcescouldnotbeload"), 'error', 'topRight')
        );
    }

    loadOdemeTipi(): void {
        this.odemeTipiService.getOdemeTipi().subscribe(
            (data) => ((this.odemeTipi = data)),
            (error) => this.notificationService.showNotification(this.translate.instant('paymenttypescouldnotbereceived'), 'error', 'topRight'),
        );
    }


    loadMenu(): void {
        this.menuService.getMenus().subscribe(
            (data) => (this.menus = data),
            (error) => this.notificationService.showNotification(this.translate.instant("menuscouldnotbeloaded"), 'error', 'topRight')
        );
    }

    get menuler(): FormArray {
        return this.satisKaynakForm.get('menuler') as FormArray;
    }

    onMenuSelect(menu: any, isChecked: boolean): void {
        const menuler = this.satisKaynakForm.get('menuler') as FormArray;
        if (isChecked) {
            menuler.push(this.fb.control(menu._id));  // Menü ID'sini FormArray'e ekle
        } else {
            const index = menuler.controls.findIndex(x => x.value === menu._id);
            if (index !== -1) {
                menuler.removeAt(index);  // Menü ID'sini çıkar
            }
        }
    }

    // Save or update SatisKaynak
    saveSatisKaynak(): void {
        if (this.satisKaynakForm.valid) {
            const satisKaynakData = this.satisKaynakForm.value;

            if (this.isEditing && this.editingSatisKaynakId) {
                // Update existing SatisKaynak
                this.satisKaynakService.updateSatisKaynak(this.editingSatisKaynakId, satisKaynakData).subscribe({
                    next: () => {
                        this.notificationService.showNotification(
                            this.translate.instant("saleresourceupdated"), 'success', 'top-end'
                        );
                        this.resetForm();
                        this.loadSatisKaynak();
                    },
                    error: () => {
                        this.notificationService.showNotification(
                            this.translate.instant("thereisanerroronsaleresourceupdate"), 'error', 'top-end'
                        );
                    }
                });
            } else {
                // Create new SatisKaynak
                this.satisKaynakService.addSatisKaynak(satisKaynakData).subscribe({
                    next: () => {
                        this.notificationService.showNotification(
                            this.translate.instant("saleresourceaddedsuccessfully"), 'success', 'top-end'
                        );
                        this.resetForm();
                        this.loadSatisKaynak();
                    },
                    error: (error) => {
                        if (error?.error?.msg === 'Bu Satış Kaynak Adı Mevcut.') {
    
                            this.notificationService.showNotification(this.translate.instant('Bu Satış Kaynak Adı Mevcut.'), 'danger', 'top-end');
                        }
                        else if (error?.error?.msg === 'Bu Tip  Mevcut.') {
    
                            this.notificationService.showNotification(this.translate.instant('Bu Tip  Mevcut.'), 'danger', 'top-end');
                        }
                        else{
                            this.notificationService.showNotification(
                                this.translate.instant("thereisanerroronaddingsaleresource"), 'error', 'top-end'
                            );
                        }
                       
                    }
                });
            }
        } else {
            this.notificationService.showNotification(
                this.translate.instant("pleasefillrequiredareas"), 'error', 'top-end'
            );
        }
    }

    // Reset form and clear editing state
    resetForm(): void {
        this.satisKaynakForm.reset();
        this.isEditing = false;
        this.editingSatisKaynakId = null;
    }

    // Edit SatisKaynak
    editSatisKaynak(menu: any): void {
        this.isEditing = true;
        this.editingSatisKaynakId = menu._id;
        this.satisKaynakForm.patchValue({
            kaynakAdi: menu.kaynakAdi,
            aciklama: menu.aciklama,
            menuler: menu.menuler,
            tip: menu.tip,// Menüler form alanına aktarılıyor
            kdvOrani: menu.kdvOrani,
            odemeTipi: menu.odemeTipi
        });
        this.isFormOpen = true;

    }

    deleteSatisKaynak(id: string): void {
        this.satisKaynakService.deleteSatisKaynak(id).subscribe(
            () => {
                this.satisKaynak = this.satisKaynak.filter((m) => m._id !== id);
                this.loadSatisKaynak();
                this.notificationService.showNotification(this.translate.instant("saleresourcedeleted"), 'success', 'top-end');
            },
            (error) => this.notificationService.showNotification(this.translate.instant("saleresourcecouldnotbedeleted"), 'error', 'top-end')
        );
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
        this.filters = { kaynakAdi: '', aciklama: '' };
        this.applyFilters();
    }

    applyFilters() {
        this.filteredSatisKaynak = this.satisKaynak.filter((item) => {
            const matchesSearchTerm =
                this.searchTerm === '' ||
                item.kaynakAdi.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                item.aciklama.toLowerCase().includes(this.searchTerm.toLowerCase());

            const matchesFilters =
                (this.filters.kaynakAdi === '' || item.kaynakAdi.includes(this.filters.kaynakAdi)) &&
                (this.filters.aciklama === '' || item.aciklama.includes(this.filters.aciklama));

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

        // Sort based on column and direction
        this.filteredSatisKaynak.sort((a, b) => {
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
