import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MagazaService } from 'src/app/service/magaza.service';
import { NotificationService } from 'src/app/apps/NotificationService';
import { TranslateService } from '@ngx-translate/core';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { SayimService } from 'src/app/service/sayim.service';
import moment from 'moment';
import GLightbox from 'glightbox';

@Component({
    selector: 'app-sayim',
    templateUrl: './sayim.html',
})
export class SayimComponent implements OnInit,AfterViewInit {
    @ViewChild('sayimDetayModal') sayimDetayModal: any; // Ürün modal referansı
    
    sayimForm!: FormGroup;
    sayimFormListe!: FormGroup;

    magazalar: any[] = [];
    cols: any[] = [];
    searchTerm: string = '';

    modalSearchTerm: string = '';
    filteredSayimDetay: any[] = []; // Filtrelenmiş ürünler (modal için)
    SayimDetayList: any[] = []; // Ürün listesi (API ile doldurulacak)

    filteredSayim: any[] = [];
    itemsPerPage: number = 3;

    constructor(
        private fb: FormBuilder,
        private fbListe: FormBuilder,
        private magazaService: MagazaService,
        private notificationService: NotificationService,
        private translate: TranslateService,
        private sayimService: SayimService,
    ) {
        this.translate.onLangChange.subscribe(() => {
            this.setColumnTitles();
        });
    }

    ngOnInit(): void {
        this.initializeForm();
        this.loadMagazalar();
    }

    setColumnTitles(): void {
        const currentLang = this.translate.currentLang;
        this.cols = [
            { field: 'actions', title: this.translate.instant('transactions'), slot: 'actions' },
            { field: 'kullaniciAdi', title: this.translate.instant('startedBy') },
            { field: 'magazaAdi', title: this.translate.instant('store') },
            { field: 'baslangicTarihi', title: this.translate.instant('startdate') },
            { field: 'bitisTarihi', title: this.translate.instant('enddate') },
            { field: 'sayimTipi', title: this.translate.instant('sayimTipi') },
            { field: 'statu', title: this.translate.instant('status') },
        ];
    }

    initializeForm(): void {
        this.sayimForm = this.fb.group({
            sayimTipi: ['', Validators.required],
            magaza: ['', Validators.required],
        });

        this.sayimFormListe = this.fbListe.group({
            baslangicTarihi: [
                moment().startOf('month').format('YYYY-MM-DD'), // Ayın ilk günü
                Validators.required,
            ],
            bitisTarihi: [
                moment().add(1, 'days').format('YYYY-MM-DD'), // Bugünün tarihine +1 gün
                Validators.required,
            ],
            sayimTipi: ['', Validators.required],
        });
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

    sayimBaslat(): void {
        if (this.sayimForm.valid) {
            this.sayimService.addSayim(this.sayimForm.value).subscribe(
                (data) => {
                    this.notificationService.showNotification(this.translate.instant('stockcountingstarted'), 'success', 'top-end');
                    this.sayimForm.reset();
                },
                (error) => {
                    if (error?.error?.message && error.error.message.includes('yetkiniz yok')) {
                        this.notificationService.showNotification(this.translate.instant('thereisnoauthorizationforthisprocess'), 'danger', 'top-end');
                    } else {
                        this.notificationService.showNotification(this.translate.instant('thereisanerroronstartingstockcounting'), 'danger', 'top-end');
                    }
                },
            );
        }
    }

    sayimlariGetir(): void {
        if (this.sayimFormListe.valid) {
            this.sayimService.getSayimFilter(this.sayimFormListe.value).subscribe(
                (data) => {
                    this.filteredSayim = data;
                },
                (error) => {
                    if (error?.error?.message && error.error.message.includes('yetkiniz yok')) {
                        this.notificationService.showNotification(this.translate.instant('thereisnoauthorizationforthisprocess'), 'danger', 'top-end');
                    } else {
                        this.notificationService.showNotification(this.translate.instant('thereisanerroronloadingstockcounts'), 'danger', 'top-end');
                    }
                },
            );
        }
    }

    sayimDetay(detay: any): void {
        // Sayım detayları
        this.sayimDetayModal.open();
    }

    // Ürün arama
    searchProducts(): void {
        const term = this.modalSearchTerm.toLowerCase();
        this.filteredSayimDetay = this.SayimDetayList.filter((detay) => detay.skuAdi.toLowerCase().includes(term));
    }
    ngAfterViewInit(): void {
        const lightbox = GLightbox({
            selector: '.glightbox' // Replace with your selector as needed
        });
    }
}
