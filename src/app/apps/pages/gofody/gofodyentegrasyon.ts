import { AfterViewInit, Component, OnInit } from '@angular/core';
import { slideDownUp, toggleAnimation } from 'src/app/shared/animations';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { NotificationService } from 'src/app/apps/NotificationService';
import { TranslateService } from '@ngx-translate/core';
import { GofodyService } from 'src/app/service/entegrasyon/gofody.service';
import GLightbox from 'glightbox';

@Component({
    templateUrl: './gofodyentegrasyon.html',
    animations: [toggleAnimation, slideDownUp],
})
export class GofodySettingsComponent implements OnInit,AfterViewInit {

    activeTab: string = 'permission';
    gofodyBilgileriForm: FormGroup;
    gofodyBilgileri: string = "";

    constructor(
        private fb: FormBuilder,
        private notificationService: NotificationService, // Yeni eklenen servis
        private translate: TranslateService,
        private gofodyService: GofodyService
    ) {
        this.gofodyBilgileriForm = this.fb.group({
            restID: ['', Validators.required],
            restKey: ['', Validators.required]
        });
    }

    ngOnInit(): void {
        this.loadGofodyEntegrasyonBilgileri();
    }

    loadGofodyEntegrasyonBilgileri(): void {
        this.gofodyService.getGofodyEntegrasyonBilgileri().subscribe(
            (data) => {
                this.gofodyBilgileri = data;

                this.gofodyBilgileriForm.patchValue({
                    restID: data.gofodyBilgiler.restID,
                    restKey: data.gofodyBilgiler.restKey
                });
            },
            (error) => this.notificationService.showNotification(
                this.translate.instant("gofodyinformationscouldnotreceived"),
                'error',
                'topRight'
            )
        );
    }


    saveGofodyBilgileri(): void {
        if (this.gofodyBilgileriForm.valid) {
            const entegrasyon = this.gofodyBilgileriForm.value;

            if (this.gofodyBilgileri) {
                this.gofodyService.updateGofodyEntegrasyon(entegrasyon).pipe(
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

                        this.gofodyBilgileriForm.patchValue({
                            restID: response.gofodyBilgiler.restID,
                            restKey: response.gofodyBilgiler.restKey
                        });
                    }
                });

            } else {
                this.gofodyService.addGofodyBilgileri(entegrasyon).pipe(
                    catchError((error) => {
                        console.error('Gofody Bilgileri ekleme hatası:', error);
                        if (error?.error?.message && error.error.message.includes('yetkiniz yok')) {
                            this.notificationService.showNotification(
                                this.translate.instant("gofodynothavepermission"),
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
                            this.translate.instant("gofodyinformationsadded"),
                            'success',
                            'top-end'
                        );
                        this.gofodyBilgileriForm.patchValue({
                            restID: response.gofodyBilgiler.restID,
                            restKey: response.gofodyBilgiler.restKey
                        });
                    }
                });
            }
        } else {
            console.log(this.gofodyBilgileriForm.value);
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


