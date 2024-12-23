import { AfterViewInit, Component, OnInit } from '@angular/core';
import { slideDownUp, toggleAnimation } from 'src/app/shared/animations';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { PermissionService } from 'src/app/service/permission.service';
import { PaketService } from 'src/app/service/paket.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { NotificationService } from 'src/app/apps/NotificationService';
import { TranslateService } from '@ngx-translate/core';
import { TrendyolService } from 'src/app/service/entegrasyon/trendyol.service';
import GLightbox from 'glightbox';


@Component({
    templateUrl: './trendyolentegrasyon.html',
    animations: [toggleAnimation, slideDownUp],
})
export class TrendyolSettingsComponent implements OnInit,AfterViewInit {

    activeTab: string = 'permission';
    activeSubTab: string = 'paket';
    isUpdatingsupport = false;
    editingSupportHourId: string | null = null;
    newSupportHour: any = { dayOfWeek: '', startTime: '', endTime: '', isActive: true };  // Yeni saat verisi
    supportHours: any[] = [];

    isUpdating: boolean = false;
    weekDays: string[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];  // Haftanın günleri
    selectedDay: string = '';
    accordions = {
        paketForm: false,
    };
    trendyolBilgileriForm: FormGroup;

    trendyolBilgileri: string = "";


    constructor(
        private fb: FormBuilder,
        private storeData: Store<any>,
        private permissionService: PermissionService,
        private paketService: PaketService,
        private notificationService: NotificationService, // Yeni eklenen servis
        private translate: TranslateService,
        private trendyolService: TrendyolService
    ) {
        this.trendyolBilgileriForm = this.fb.group({
            zincirID: ['', Validators.required],
            subeID: ['', Validators.required],
            restKey: ['', Validators.required],
            secretKey: ['', Validators.required],
        });
    }

    ngOnInit(): void {
        this.loadTrendyolEntegrasyonBilgileri();
    }

    loadTrendyolEntegrasyonBilgileri(): void {
        this.trendyolService.getTrendyolEntegrasyonBilgileri().subscribe(
            (data) => {
                this.trendyolBilgileri = data;

                this.trendyolBilgileriForm.patchValue({
                    zincirID: data.trendyolBilgiler.zincirID,
                    subeID: data.trendyolBilgiler.subeID,
                    restKey: data.trendyolBilgiler.restKey,
                    secretKey: data.trendyolBilgiler.secretKey
                });
            },
            (error) => this.notificationService.showNotification(
                this.translate.instant("trendyolinfocouldnotget"),
                'error',
                'topRight'
            )
        );
    }
    

    saveTrendyolBilgileri(): void {
        if (this.trendyolBilgileriForm.valid) {
            const entegrasyon = this.trendyolBilgileriForm.value;

            if (this.trendyolBilgileri) {
                this.trendyolService.updateTrendyolEntegrasyon(entegrasyon).pipe(
                    catchError((error) => {
                        console.error('paymenttypeupdateerror', error);
                        if (error?.error?.message && error.error.message.includes('yetkiniz yok')) {
                            this.notificationService.showNotification(
                                this.translate.instant("thereisnoauthorizationforthisprocess"),
                                'error',
                                'top-end'
                            );
                        } else {
                            this.notificationService.showNotification(
                                this.translate.instant("paymenttypeupdateerror"),
                                'error',
                                'top-end'
                            );
                        }
                        return of(null); // Hata durumunda boş değer döndür
                    })
                ).subscribe((response) => {
                    if (response) {
                        this.notificationService.showNotification(
                            this.translate.instant("paymenttypeupdated"),
                            'success',
                            'top-end'
                        );
                        this.trendyolBilgileriForm.patchValue({
                            zincirID: response.trendyolBilgiler.zincirID,
                            subeID: response.trendyolBilgiler.subeID,
                            restKey: response.trendyolBilgiler.restKey,
                            secretKey: response.trendyolBilgiler.secretKey
                        });                    }
                });

            } else {
                this.trendyolService.addTrendyolBilgileri(entegrasyon).pipe(
                    catchError((error) => {
                        console.error('Trendyol Bilgileri ekleme hatası:', error);
                        if (error?.error?.message && error.error.message.includes('yetkiniz yok')) {
                            this.notificationService.showNotification(
                                this.translate.instant("notallowtrendyolinfosadd"),
                                'error',
                                'top-end'
                            );
                        } else {
                            this.notificationService.showNotification(
                                this.translate.instant("paymenttypecouldnotadded"),
                                'error',
                                'top-end'
                            );
                        }
                        return of(null); // Hata durumunda boş değer döndür
                    })
                ).subscribe((response) => {
                    if (response) {
                        this.notificationService.showNotification(
                            this.translate.instant("trendyolinfosadded"),
                            'success',
                            'top-end'
                        );
                        this.trendyolBilgileriForm.patchValue({
                            zincirID: response.trendyolBilgiler.zincirID,
                            subeID: response.trendyolBilgiler.subeID,
                            restKey: response.trendyolBilgiler.restKey,
                            secretKey: response.trendyolBilgiler.secretKey
                        });                      }
                });
            }
        } else {
            console.log(this.trendyolBilgileriForm.value);
            this.notificationService.showNotification(
                this.translate.instant("invalidforminformation"), 'error', 'top-end'
            );
        }
    }
    ngAfterViewInit(): void {
        const lightbox = GLightbox({
            selector: '.glightbox' // Replace with your selector as needed
        });
    }

}


