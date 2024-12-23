import { AfterViewInit,ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { toggleAnimation, slideDownUp } from 'src/app/shared/animations'; // Animasyonları ekle
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { PermissionService } from 'src/app/service/permission.service';
import { MagazaService } from 'src/app/service/magaza.service';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from 'src/app/apps/NotificationService';
import { ClusterService } from 'src/app/service/cluster.service';
import { OdemeTipiService } from 'src/app/service/odemetipi.service';
import 'intro.js/introjs.css';
import { IntroJs } from 'intro.js/src/intro';
import introJs from 'intro.js';
import { HttpClient } from '@angular/common/http';
import * as XLSX from 'xlsx';
import GLightbox from 'glightbox';

@Component({
    selector: 'app-magazalarim',
    templateUrl: './magazalarim.html',
    animations: [toggleAnimation, slideDownUp], // Animasyonları ekle
})
export class MagazalarimComponent implements OnInit,AfterViewInit{
    intro!: IntroJs;
    @ViewChild('fileInput') fileInput!: ElementRef;

    lokasyonList: any[] = []; // Lokasyon verilerini tutacak dizi
    magazalar: any[] = [];
    filteredMagazalar: any[] = [];
    searchTerm: string = '';
    showPassive: boolean = false;
    itemsPerPage: number = 3;
    cols: any[] = [];
    selectedCluster: string | null = null; // Başlangıçta seçili değil
    clusters: any[] = []; // Cluster listesini tutmak için
    odemetip: any[] = [];
    setColumnTitles(): void {
        const currentLang = this.translate.currentLang;
        this.cols = [
            { field: 'actions', title: this.translate.instant('transactions'), slot: 'actions' },
            { field: 'magazaAdi', title: this.translate.instant('storename') },
            { field: 'markaAdi', title: this.translate.instant('brandname') },
            { field: 'tur', title: this.translate.instant('type') },

            { field: 'basvurutarihi', title: this.translate.instant('applydate') },
            { field: 'calisansayisi', title: this.translate.instant('employeenumber') },
            { field: 'ceptel', title: this.translate.instant('mobilephone') },

            { field: 'firmasahip', title: this.translate.instant('companyowner') },
            { field: 'il', title: this.translate.instant('province') },
            { field: 'ilce', title: this.translate.instant('town') },

            { field: 'statu', title: this.translate.instant('status') },

            { field: 'ticsicilno', title: this.translate.instant('traderegistrynumber') },
            { field: 'unvan', title: this.translate.instant('degree') },
            { field: 'verdairesi', title: this.translate.instant('taxoffice') },
            { field: 'verno', title: this.translate.instant('taxnumber') },
        ];
    }
    currentPage: number = 1; // Mevcut sayfa numarası
    addMagazaForm: FormGroup;
    editingMagazaId: string | null = null; // Düzenleme durumunu takip etmek için
    permissionDenied: boolean = false;
    accordians3: any = null; // Accordion kontrolü için değişken
    activeTab: string = 'genel'; // Default aktif sekme 'genel'
    isAddingNew: boolean = true; // Yeni ekleme işlemini takip etmek için
    selectedStatus: string = 'all'; // Default to show all

    constructor(
        public fb: FormBuilder,
        public storeData: Store<any>,
        private magazaService: MagazaService,
        private clusterservice: ClusterService,
        private notificationService: NotificationService,
        private translate: TranslateService,
        private odemeTipiService: OdemeTipiService,
        private http: HttpClient
    ) {
        // Magaza ekleme formunu oluşturuyoruz
        this.addMagazaForm = this.fb.group({
            magazaAdi: ['', Validators.required],
            markaAdi: ['', Validators.required],
            adres: ['', Validators.required],
            basvurutarihi: [new Date().toISOString().split('T')[0], Validators.required],
            calisansayisi: [0, Validators.required],
            ceptel: ['', Validators.required],
            digerisler: [''],
            digerislerkurulustarihi: [new Date().toISOString().split('T')[0]],
            fax: [''],
            firmasahip: ['', Validators.required],
            il: ['', Validators.required],
            ilce: ['', Validators.required],
            mail: ['', [Validators.required, Validators.email]],
            statu: ['beklemede'],
            tel: ['', Validators.required],
            ticsicilno: [''],
            unvan: ['', Validators.required],
            verdairesi: [''],
            verilenmagazakodu: ['', Validators.required],
            verno: [''],
            talepadres: [''],
            talepedentanimabilgisi: [''],
            talepedilenyerinkirasi: [0],
            talepil: [''],
            talepilce: [''],
            talepkonum: [''],
            tur: ['', Validators.required],
            cluster: [''],
            odemeTipleri: [[]],
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
        this.loadMagazalar();
        this.loadClusters();
        this.loadOdemeTipleri();

        //  this.startIntro();
        const tourCompleted = localStorage.getItem('magazaTourCompleted');
        if (!tourCompleted) {
           //  this.startIntro();
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
                    intro: 'Buradan mağaza eklemesi yapabilirsiniz.',
                    position: 'bottom',
                },
                {
                    element: '#step2',
                    intro: 'Bu alandan  mağaza bilgilerinizi girebilir ve kontrol edebilirsiniz.',
                    position: 'bottom',
                },
                {
                    element: '#step3',
                    intro: 'Bu alanda mağaza bilgilerinin detayları görebilirsiniz.',
                    position: 'bottom',
                },
                {
                    element: '#step4',
                    intro: 'Bu alanda mağazanızda kullanaçağınız ödeme tiplerini seçebilirsiniz.',
                    position: 'bottom',
                },
                {
                    element: '#step5',
                    intro: 'Bu alanda mağazalarınızı görebilir ve yönetebilirsiniz.',
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
                this.accordians3 = 1;
            }
            if (currentStep === 2) {
                // 0 tabanlı index (step3 = index 2)
                this.setActiveTab('detay'); // 'items' sekmesini aktif hale getirir
            } else if (currentStep === 3) {
                // 0 tabanlı index (step4 = index 3)
                this.setActiveTab('odemetipi'); // 'odemetipi' sekmesini aktif hale getirir
            } else if (currentStep === 4) {
                // 0 tabanlı index (step4 = index 3)
                this.setActiveTab('editMagaza'); // 'odemetipi' sekmesini aktif hale getirir
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
        localStorage.setItem('magazaTourCompleted', 'true');
    }

    loadClusters() {
        this.clusterservice.getClusters().subscribe((clusters) => {
            this.clusters = clusters;
        });
    }

    openFileSelector() {
        this.fileInput.nativeElement.click();
    }
    loadOdemeTipleri() {
        this.odemeTipiService.getOdemeTipi().subscribe((odemetip) => {
            this.odemetip = odemetip;
        });
    }


    onFileSelected(event: any): void {
        const file = event.target.files[0];
        if (file) {
            const reader: FileReader = new FileReader();
            reader.onload = (e: any) => {
                const data: string = e.target.result;
                const workbook: XLSX.WorkBook = XLSX.read(data, { type: 'binary' });
                const firstSheetName: string = workbook.SheetNames[0];
                const worksheet: XLSX.WorkSheet = workbook.Sheets[firstSheetName];
                const excelData = XLSX.utils.sheet_to_json(worksheet);

                this.processExcelData(excelData); // Burada excelData'yı JSON olarak işliyorsunuz
            };
            reader.readAsBinaryString(file);
        }
    }

    processExcelData(data: any[]): void {
        // Excel verisini JSON formatında işleyin
        const payload = { lokasyonlar: data }; // Örneğin "lokasyonlar" key'i altında gönderin

      this.magazaService.importLokasyonExcel(payload).subscribe({
          next: (res) => {
            this.notificationService.showNotification('Lokasyon verileri başarıyla gönderildi.', 'success', 'top-end');
          },
          error: (err) => {
            console.error('Gönderim hatası:', err);
            this.notificationService.showNotification('Gönderim hatası.', 'danger', 'top-end');
          }
        });
      }

    loadLokasyonList(magazaId:string) {
        this.magazaService.getLokasyonList(magazaId).pipe(
            catchError(error => {
              console.error('Lokasyon listesi yüklenirken hata:', error);
              this.notificationService.showNotification('Lokasyonları yüklerken hata oluştu.', 'danger', 'top-end');
              return of([]);
            })
        ).subscribe((data: any[]) => {
            this.lokasyonList = data || [];
        });
    }

    loadMagazalar(): void {
        this.magazaService
            .getMagazalarim()
            .pipe(
                catchError((error) => {
                    if (error?.error?.message && error.error.message.includes('yetkiniz yok')) {
                        this.permissionDenied = true;

                        this.notificationService.showNotification(this.translate.instant('thereisnoauthorizationforthisprocess'), 'danger', 'top-end');
                    } else {
                        this.notificationService.showNotification(this.translate.instant('thereisanerroronloadingstockdatas'), 'danger', 'top-end');
                    }
                    return of([]);
                }),
            )
            .subscribe((data) => {
                if (!this.permissionDenied) {
                    this.magazalar = data;
                    this.applyFilter();
                }
            });
    }

    applyFilter(): void {
        this.filteredMagazalar = this.magazalar.filter((mgz) => {
            // Arama terimi ile eşleşme
            const matchesSearchTerm = this.searchTerm ? mgz.statu.toLowerCase().includes(this.searchTerm.toLowerCase()) : true;

            // Aktif/Pasif durumu kontrolü
            const matchesActiveStatus = (() => {
                switch (this.selectedStatus) {
                    case 'all':
                        return true;
                    case 'aktif':
                        return mgz.statu === 'aktif';
                    case 'pasif':
                        return mgz.statu === 'pasif';
                    case 'beklemede':
                        return mgz.statu === 'beklemede';
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

    onSearchChange(): void {
        if (this.searchTerm) {
            this.filteredMagazalar = this.magazalar.filter(
                (mgz) =>
                    mgz.magazaAdi.toLowerCase().includes(this.searchTerm.toLowerCase()) || mgz.firmasahip.toLowerCase().includes(this.searchTerm.toLowerCase()),
            );
        } else {
            this.filteredMagazalar = [...this.magazalar];
        }
    }

    saveMagaza(): void {
        if (this.addMagazaForm.valid) {
            if (this.editingMagazaId) {
                // Güncelleme işlemi
                const updatedMagaza = this.addMagazaForm.value;
                console.log('magaza:', updatedMagaza);
                this.updateMagaza(this.editingMagazaId, updatedMagaza);
            } else {
                const newMagaza = this.addMagazaForm.value;

                console.log('magaza:', newMagaza);
                this.addMagaza(newMagaza);
            }
        } else {
            this.notificationService.showNotification(this.translate.instant('thereisanerroronsavingupdatingstore'), 'danger', 'top-end');
        }
    }

    addMagaza(newMagaza: any): void {
        this.magazaService.addMagaza(newMagaza).subscribe({
            next: (addedMagaza) => {
                this.magazalar.push(addedMagaza);
                this.applyFilter();
                this.notificationService.showNotification(this.translate.instant('addingstoresuccessfull'), 'success', 'top-end');
                this.isAddingNew = false;
                this.editingMagazaId = addedMagaza._id;
                this.loadMagazalar();
            },
            error: (error) => {
                if (error?.error?.msg === 'Bu mağaza kodu zaten kullanılıyor.') {
                    this.notificationService.showNotification(this.translate.instant('storecodealreadyexist'), 'danger', 'top-end');
                }
                if (error?.error?.msg === 'Maksimum mağaza sayısına ulaştınız.') {
                    this.notificationService.showNotification(this.translate.instant('Maksimum mağaza sayısına ulaştınız.'), 'danger', 'top-end');
                } else {
                    this.notificationService.showNotification(this.translate.instant('erroronaddingstore'), 'danger', 'top-end');
                }
            },
        });
    }

    openAddClusterModal(): void {
        // Kullanıcıya yeni bir cluster adı girmesi için prompt gösterilir
        const yeniCluster = prompt(this.translate.instant('addnewclustername'));

        if (yeniCluster) {
            this.addCluster(yeniCluster); // Yeni cluster ekleme fonksiyonunu çağır
        }
    }

    addCluster(yeniCluster: string): void {
        this.clusterservice.addCluster({ ad: yeniCluster }).subscribe(
            (response) => {
                // Yeni cluster ekleme başarılıysa clusters listesini güncelle
                this.clusters.push(response);
                this.selectedCluster = response._id; // Yeni eklenen cluster'ı seçili yap
                this.notificationService.showNotification(this.translate.instant('clusteraddedsuccessfully'), 'success', 'top-right');
            },
            (error) => {
                this.notificationService.showNotification(this.translate.instant('clustercouldnotadded'), 'error', 'top-right');
            },
        );
    }

    updateMagaza(id: string, updatedMagaza: any): void {
        this.magazaService.updateMagaza(id, updatedMagaza).subscribe({
            next: (updatedMagazaResponse) => {
                const index = this.magazalar.findIndex((m) => m._id === id);
                if (index !== -1) {
                    this.magazalar[index] = {
                        ...this.magazalar[index],
                    };
                }
                this.applyFilter();
                this.notificationService.showNotification(this.translate.instant('updatingstoresuccessfull'), 'success', 'top-end');

                this.editingMagazaId = id;
                this.isAddingNew = false;
                this.loadMagazalar();
            },
            error: (error) => {
                console.error('Magaza güncelleme hatası:', error);
                this.notificationService.showNotification(this.translate.instant('erroronupdatingstore'), 'danger', 'top-end');
            },
        });
    }

    editMagaza(magaza: any): void {
        this.addMagazaForm.patchValue({
            userId: magaza.userId,
            magazaAdi: magaza.magazaAdi,
            markaAdi: magaza.markaAdi,
            adres: magaza.adres,
            basvurutarihi: this.formatDate(magaza.basvurutarihi),
            calisansayisi: magaza.calisansayisi,
            ceptel: magaza.ceptel,
            digerisler: magaza.digerisler,
            digerislerkurulustarihi: this.formatDate(magaza.digerislerkurulustarihi),
            fax: magaza.fax,
            firmasahip: magaza.firmasahip,
            il: magaza.il,
            ilce: magaza.ilce,
            mail: magaza.mail,
            statu: magaza.statu,
            tel: magaza.tel,
            ticsicilno: magaza.ticsicilno,
            unvan: magaza.unvan,
            verdairesi: magaza.verdairesi,
            verilenmagazakodu: magaza.verilenmagazakodu,
            verno: magaza.verno,
            talepadres: magaza.talepadres,
            talepedentanimabilgisi: magaza.talepedentanimabilgisi,
            talepedilenyerinkirasi: magaza.talepedilenyerinkirasi,
            talepil: magaza.talepil,
            talepilce: magaza.talepilce,
            talepkonum: magaza.talepkonum,
            tur: magaza.tur,
            cluster: magaza.cluster,
            odemeTipleri: magaza.odemeTipleri,
        });

        this.editingMagazaId = magaza._id;
        this.loadLokasyonList(magaza._id);
        this.isAddingNew = false;
        this.accordians3 = 1;
    }

    // Mağaza seçimi yapıldığında tetiklenen fonksiyon
    onMagazaChange(): void {
        const selectedMagazaId = this.addMagazaForm.get('magaza')?.value;

        if (selectedMagazaId) {
            // Seçilen mağaza bilgilerini almak
            const selectedMagaza = this.magazalar.find((m) => m._id === selectedMagazaId);
            if (selectedMagaza) {
                // editMagaza fonksiyonunu çağırarak mağaza bilgilerini iletme
                this.editMagaza(selectedMagaza);
            }
        }
    }

    deleteMagaza(magazaId: string): void {
        if (confirm('Bu Mağazayı silmek istediğinizden emin misiniz?')) {
            this.magazaService.deleteMagaza(magazaId).subscribe({
                next: () => {
                    this.magazalar = this.magazalar.filter((magaza) => magaza._id !== magazaId);
                    this.notificationService.showNotification(this.translate.instant('deletingstoresuccessfull'), 'success', 'top-end');
                },
                error: (error) => {
                    console.error('Silme hatası:', error);
                    this.notificationService.showNotification(this.translate.instant('errorondeletingstore'), 'danger', 'top-end');
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

    startNewMagaza(): void {
        this.isAddingNew = true;
        this.addMagazaForm.reset();
        this.editingMagazaId = null;
        this.accordians3 = 1;
    }

    resetForm(): void {
        this.addMagazaForm.reset();
        this.addMagazaForm.patchValue({});
        this.editingMagazaId = null;
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
