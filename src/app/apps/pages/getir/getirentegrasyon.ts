import { AfterViewInit, Component, OnInit } from '@angular/core';
import { slideDownUp, toggleAnimation } from 'src/app/shared/animations';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { NotificationService } from 'src/app/apps/NotificationService';
import { TranslateService } from '@ngx-translate/core';
import { GetirService } from 'src/app/service/entegrasyon/getir.service';
import GLightbox from 'glightbox';

@Component({
    templateUrl: './getirentegrasyon.html',
    animations: [toggleAnimation, slideDownUp],
})
export class GetirSettingsComponent implements OnInit,AfterViewInit {
    activeTab: string = 'permission';
    getirBilgileriForm: FormGroup;
    getirBilgileri: string = "";

    weekDays: string[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']; 
    selectedDay: string = ''; // Seçilen gün

    newSupportHour: any = { dayOfWeek: '', startTime: '', endTime: '', isActive: true }; 
    supportHours: any[] = []; 

    isUpdatingSupport = false;
    editingSupportHourId: string | null = null; // Güncellenen saat ID'si

    constructor(
        private fb: FormBuilder,
        private notificationService: NotificationService, // Yeni eklenen servis
        private translate: TranslateService,
        private getirService: GetirService
    ) {
        this.getirBilgileriForm = this.fb.group({
            appSecretKey: ['', Validators.required],
            restKey: ['', Validators.required]
        });
    }

    ngOnInit(): void {
        this.loadGetirEntegrasyonBilgileri();
        this.getSupportHours();
    }

    getSupportHours() {
        this.getirService.getGetirCalismaSaatleri().subscribe(
            (data: any[]) => {
                this.supportHours = data.map(hour => ({
                    dayOfWeek: this.weekDays[hour.day], // Gün ismini al
                    startTime: hour.workingHours?.startTime || '-', // Başlangıç saati
                    endTime: hour.workingHours?.endTime || '-', // Bitiş saati
                    isActive: !hour.closed, // Aktiflik durumu
                    _id: hour._id // ID'yi sakla
                }));
            },
            (error: any) => {
                console.error('Error fetching support hours:', error);
            }
        );
    }

    addSupportHour() {
        if (this.selectedDay) {
            const restaurantWorkingHours = {
                day: this.weekDays.indexOf(this.selectedDay),
                closed: !this.newSupportHour.isActive,
                workingHours: {
                    startTime: this.newSupportHour.startTime,
                    endTime: this.newSupportHour.endTime,
                }
            };
    
            this.getirService.addGetirCalismaSaatleri({ restaurantWorkingHours }).subscribe(
                (res) => {
                    // Eklenen saati supportHours dizisine ekle
                    const addedHour = {
                        dayOfWeek: this.selectedDay,
                        startTime: this.newSupportHour.startTime,
                        endTime: this.newSupportHour.endTime,
                        isActive: this.newSupportHour.isActive,
                        _id: res._id // API’den dönen ID
                    };
                    this.supportHours.push(addedHour); // Listeyi güncelle
                    this.newSupportHour = { startTime: '', endTime: '', dayOfWeek: '', isActive: true };
                },
                (error: any) => {
                    console.error('Error adding support hour:', error);
                }
            );
        }
    }
    
    
    editSupportHour(hour: any) {
        this.isUpdatingSupport = true;
        this.selectedDay = this.weekDays[hour.day]; 
        this.newSupportHour = { ...hour }; 
        this.editingSupportHourId = hour._id; 
    }

    updateSupportHour() {
        if (this.editingSupportHourId) {
            const updatedHour = {
                ...this.newSupportHour,
                day: this.weekDays.indexOf(this.selectedDay)
            };
    
            this.getirService.updateGetirCalismaSaatleri([updatedHour]).subscribe(
                (response) => {
                    // Güncellenen saati supportHours dizisinde bul ve değiştir
                    const index = this.supportHours.findIndex(hour => hour._id === this.editingSupportHourId);
                    if (index !== -1) {
                        this.supportHours[index] = {
                            dayOfWeek: this.selectedDay,
                            startTime: this.newSupportHour.startTime,
                            endTime: this.newSupportHour.endTime,
                            isActive: this.newSupportHour.isActive,
                            _id: this.editingSupportHourId
                        };
                    }
                    this.isUpdatingSupport = false;
                    this.editingSupportHourId = null; // Güncelleme işlemini sıfırla
                },
                (error: any) => {
                    console.error('Error updating support hour:', error);
                }
            );
        }
    }
    

    loadGetirEntegrasyonBilgileri(): void {
        this.getirService.getGetirEntegrasyonBilgileri().subscribe(
            (data) => {
                this.getirBilgileri = data;

                this.getirBilgileriForm.patchValue({
                    appSecretKey: data.getirBilgiler.appSecretKey,
                    restKey: data.getirBilgiler.restKey
                });
            },
            (error) => this.notificationService.showNotification(
                this.translate.instant("getirinfocouldnotreceived"),
                'error',
                'topRight'
            )
        );
    }


    saveGetirBilgileri(): void {
        if (this.getirBilgileriForm.valid) {
            const entegrasyon = this.getirBilgileriForm.value;

            if (this.getirBilgileri) {
                this.getirService.updateGetirEntegrasyon(entegrasyon).pipe(
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
                        this.getirBilgileriForm.patchValue({
                            appSecretKey: response.getirBilgiler.appSecretKey,
                            restKey: response.getirBilgiler.restKey
                        });
                    }
                });
            } else {
                this.getirService.addGetirBilgileri(entegrasyon).pipe(
                    catchError((error) => {
                        console.error('Getir Bilgileri ekleme hatası:', error);
                        if (error?.error?.message && error.error.message.includes('yetkiniz yok')) {
                            this.notificationService.showNotification(
                                this.translate.instant("getirnothavepermission"),
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
                            this.translate.instant("getirinformationsadded"),
                            'success',
                            'top-end'
                        );
                        this.getirBilgileriForm.patchValue({
                            appSecretKey: response.getirBilgiler.appSecretKey,
                            restKey: response.getirBilgiler.restKey
                        });
                    }
                });
            }
        } else {
            console.log(this.getirBilgileriForm.value);
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


