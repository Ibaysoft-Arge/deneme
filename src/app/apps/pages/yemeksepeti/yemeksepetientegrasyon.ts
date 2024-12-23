import { AfterViewInit, Component, OnInit } from '@angular/core';
import { slideDownUp, toggleAnimation } from 'src/app/shared/animations';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { NotificationService } from 'src/app/apps/NotificationService';
import { TranslateService } from '@ngx-translate/core';
import { YemekSepetiService } from 'src/app/service/entegrasyon/yemeksepeti.service';
import GLightbox from 'glightbox';
@Component({
    templateUrl: './yemeksepetientegrasyon.html',
    animations: [toggleAnimation, slideDownUp],
})
export class YemekSepetiSettingsComponent implements OnInit,AfterViewInit {

    activeTab: string = 'permission';
    yemekSepetiBilgileriForm: FormGroup;
    yemekSepetiBilgileri: string = "";

    constructor(
        private fb: FormBuilder,
        private notificationService: NotificationService, // Yeni eklenen servis
        private translate: TranslateService,
        private yemekSepetiService: YemekSepetiService
    ) {
        this.yemekSepetiBilgileriForm = this.fb.group({
            username: ['', Validators.required],
            sifre: ['', Validators.required]
        });
    }

    ngOnInit(): void {
        this.loadYemekSepetiEntegrasyonBilgileri();
    }

    loadYemekSepetiEntegrasyonBilgileri(): void {
        this.yemekSepetiService.getYemekSepetiEntegrasyonBilgileri().subscribe(
            (data) => {
                this.yemekSepetiBilgileri = data;

                this.yemekSepetiBilgileriForm.patchValue({
                    username: data.yemeksepetiBilgiler.username,
                    sifre: data.yemeksepetiBilgiler.sifre
                });
            },
            (error) => this.notificationService.showNotification(
                this.translate.instant("yemeksepetiinfocouldnotreceived"),
                'error',
                'topRight'
            )
        );
    }


    saveYemekSepetiBilgileri(): void {
        if (this.yemekSepetiBilgileriForm.valid) {
            const entegrasyon = this.yemekSepetiBilgileriForm.value;

            if (this.yemekSepetiBilgileri) {
                this.yemekSepetiService.updateYemekSepetiEntegrasyon(entegrasyon).pipe(
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
                        return of(null);
                    })
                ).subscribe((response) => {
                    if (response) {
                        this.notificationService.showNotification(
                            this.translate.instant("paymenttypeupdated"),
                            'success',
                            'top-end'
                        );
                        this.yemekSepetiBilgileriForm.patchValue({
                            username: response.yemeksepetiBilgiler.username,
                            sifre: response.yemeksepetiBilgiler.sifre
                        });
                    }
                });

            } else {
                this.yemekSepetiService.addYemekSepetiBilgileri(entegrasyon).pipe(
                    catchError((error) => {
                        console.error('Yemek Sepeti Bilgileri ekleme hatası:', error);
                        if (error?.error?.message && error.error.message.includes('yetkiniz yok')) {
                            this.notificationService.showNotification(
                                this.translate.instant("yemeksepetinothavepermission"),
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
                        return of(null);
                    })
                ).subscribe((response) => {
                    if (response) {
                        this.notificationService.showNotification(
                            this.translate.instant("yemeksepetiinformationsadded"),
                            'success',
                            'top-end'
                        );
                        this.yemekSepetiBilgileriForm.patchValue({
                            username: response.yemeksepetiBilgiler.username,
                            sifre: response.yemeksepetiBilgiler.sifre
                        });
                    }
                });
            }
        } else {
            console.log(this.yemekSepetiBilgileriForm.value);
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


