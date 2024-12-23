import { AfterViewInit, Component, OnInit } from '@angular/core';
import { slideDownUp, toggleAnimation } from 'src/app/shared/animations';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { NotificationService } from 'src/app/apps/NotificationService';
import { TranslateService } from '@ngx-translate/core';
import { MigrosService } from 'src/app/service/entegrasyon/migros.service';
import GLightbox from 'glightbox';

@Component({
    templateUrl: './migrosentegrasyon.html',
    animations: [toggleAnimation, slideDownUp],
})
export class MigrosSettingsComponent implements OnInit,AfterViewInit {

    activeTab: string = 'permission';
    migrosBilgileriForm: FormGroup;
    migrosBilgileri: string = "";

    constructor(
        private fb: FormBuilder,
        private notificationService: NotificationService, // Yeni eklenen servis
        private translate: TranslateService,
        private migrosService: MigrosService
    ) {
        this.migrosBilgileriForm = this.fb.group({
            restID: ['', Validators.required],
            restKey: ['', Validators.required]
        });
    }

    ngOnInit(): void {
        this.loadMigrosEntegrasyonBilgileri();
    }

    loadMigrosEntegrasyonBilgileri(): void {
        this.migrosService.getMigrosEntegrasyonBilgileri().subscribe(
            (data) => {
                this.migrosBilgileri = data;

                this.migrosBilgileriForm.patchValue({
                    restID: data.migrosBilgiler.restID,
                    restKey: data.migrosBilgiler.restKey
                });
            },
            (error) => this.notificationService.showNotification(
                this.translate.instant("migrosinformationcouldnotreceived"),
                'error',
                'topRight'
            )
        );
    }


    saveMigrosBilgileri(): void {
        if (this.migrosBilgileriForm.valid) {
            const entegrasyon = this.migrosBilgileriForm.value;

            if (this.migrosBilgileri) {
                this.migrosService.updateMigrosEntegrasyon(entegrasyon).pipe(
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
                        this.migrosBilgileriForm.patchValue({
                            restID: response.migrosBilgiler.restID,
                            restKey: response.migrosBilgiler.restKey
                        });
                    }
                });

            } else {
                this.migrosService.addMigrosBilgileri(entegrasyon).pipe(
                    catchError((error) => {
                        console.error('Migros Bilgileri ekleme hatası:', error);
                        if (error?.error?.message && error.error.message.includes('yetkiniz yok')) {
                            this.notificationService.showNotification(
                                this.translate.instant("migrosnothavepermission"),
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
                            this.translate.instant("migrosinformationadded"),
                            'success',
                            'top-end'
                        );
                        this.migrosBilgileriForm.patchValue({
                            restID: response.migrosBilgiler.restID,
                            restKey: response.migrosBilgiler.restKey
                        });
                    }
                });
            }
        } else {
            console.log(this.migrosBilgileriForm.value);
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


