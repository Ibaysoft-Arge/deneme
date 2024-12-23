import { Component, OnInit, Injectable, AfterViewInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { QRMenuService } from 'src/app/service/qrmenu.service';
import { slideDownUp, toggleAnimation } from 'src/app/shared/animations';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from 'src/app/apps/NotificationService';
import { MagazaService } from 'src/app/service/magaza.service';
import { Base64Service } from 'src/app/service/base64.service';
import { QRCodeService } from 'src/app/service/qr-code.service';
import { environment } from 'src/environments/environment.prod';
import GLightbox from 'glightbox';

@Component({
    selector: 'app-menu',
    templateUrl: './qrmenuayarlar.html',
    animations: [toggleAnimation, slideDownUp],
})
export class QrMenuAyarlarComponent implements OnInit,AfterViewInit {
    qrCodeDataUrl: string = "";
    acikMiControl = new FormControl(false);
    encryptedData!: ArrayBuffer;
    decryptedText!: string;
    iv!: Uint8Array;
    constructor(
        private QRMenuService: QRMenuService,
        private translate: TranslateService,
        private magazaService: MagazaService,
        private notificationService: NotificationService,
        private Base64Service: Base64Service,
        private qrCodeService: QRCodeService
    ) {
        this.setColumnTitles();

        this.translate.onLangChange.subscribe(() => {
            this.setColumnTitles();
        });
    }

    private userId = localStorage.getItem('userid') || '';
    private apiUrl = environment.frontURL + '/auth/qrmenu?menu='; // API URL'sini buraya ekleyin


    async ngOnInit(): Promise<void> {
        this.loadMagazalar();


        //console.log('Şifrelenmiş Metin:', hash);

        //console.log('Çözülmüş Metin:', this.Base64Service.decodeFromBase64(hash));
    }

    // kaydet(): void {
    //     const updatedData = { AcikMi: this.acikMiControl.value ?? false };
    //     this.QRMenuService.updateAcikMi(this.userId, updatedData).subscribe(
    //         (response) => {
    //             console.log('Güncelleme başarılı:', response);
    //         },
    //         (error) => {
    //             console.error('Güncelleme hatası:', error);
    //         }
    //     );
    // }

    cols: any[] = [];
    filteredMagazalar: any[] = [];
    magazalar: any[] = [];
    searchTerm: string = '';
    showPassive: boolean = false;
    itemsPerPage: number = 3;
    currentPage: number = 1;
    selectedStatus: string = 'all';
    permissionDenied: boolean = false;

    setColumnTitles(): void {
        this.cols = [

            { field: 'magazaAdi', title: this.translate.instant("storename") },
            { field: 'markaAdi', title: this.translate.instant("brandname") },
            { field: 'tur', title: this.translate.instant("type") },
            { field: 'firmasahip', title: this.translate.instant("companyowner") },
            { field: 'il', title: this.translate.instant("province") },
            { field: 'ilce', title: this.translate.instant("town") },
            { field: 'statu', title: this.translate.instant("status") },
            { field: 'actions', title: this.translate.instant("transactions"), slot: 'actions' },
            { field: 'indir', title: this.translate.instant("downloadqr"), slot: 'indir' }];
    }

    loadMagazalar(): void {
        this.magazaService.getMagazalarimWithQR().pipe(
            catchError((error) => {
                if (error?.error?.message && error.error.message.includes('yetkiniz yok')) {
                    this.permissionDenied = true;

                    this.notificationService.showNotification(this.translate.instant("thereisnoauthorizationforthisprocess"), 'danger', 'top-end');
                } else {
                    this.notificationService.showNotification(this.translate.instant("thereisanerroronloadingstockdatas"), 'danger', 'top-end');
                }
                return of([]);
            })
        ).subscribe((data) => {
            if (!this.permissionDenied) {
                this.magazalar = data;
                this.applyFilter();
            }
        });
    }

    applyFilter(): void {
        this.filteredMagazalar = this.magazalar.filter((mgz) => {
            // Arama terimi ile eşleşme
            const matchesSearchTerm = this.searchTerm
                ? mgz.statu.toLowerCase().includes(this.searchTerm.toLowerCase())
                : true;

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

    async QRIndir(data: any) {
        if (data.link == "") {
            let sifreliLink: string = this.Base64Service.encodeToBase64(data.magazaID + "," + this.userId);
            this.QRMenuService.addAyar(data.magazaID, false, this.apiUrl + sifreliLink).pipe(
                catchError((error) => {
                    if (error?.error?.message && error.error.message.includes('yetkiniz yok')) {
                        this.permissionDenied = true;
    
                        this.notificationService.showNotification(this.translate.instant("thereisnoauthorizationforthisprocess"), 'danger', 'top-end');
                    } else {
                        this.notificationService.showNotification(this.translate.instant("thereisanerroronloadingstockdatas"), 'danger', 'top-end');
                    }
                    return of([]);
                })
            ).subscribe((data) => {
                if (!this.permissionDenied) {
                    this.loadMagazalar();
                    this.applyFilter();
                }
            });

            // QR kodu oluştur ve Data URL olarak sakla
            this.qrCodeDataUrl = await this.qrCodeService.generateQRCode(this.apiUrl + sifreliLink);

            // QR kodunu indir
            this.qrCodeService.downloadQRCode(this.qrCodeDataUrl);
        }
        else {
            // QR kodu oluştur ve Data URL olarak sakla
            this.qrCodeDataUrl = await this.qrCodeService.generateQRCode(data.link);

            // QR kodunu indir
            this.qrCodeService.downloadQRCode(this.qrCodeDataUrl);
        }
    }

    QRDurumGuncelle(data: any): void {
        this.QRMenuService.updateAcikMi(data.magazaID, !data.acikMi).pipe(
            catchError((error) => {
                if (error?.error?.message && error.error.message.includes('yetkiniz yok')) {
                    this.permissionDenied = true;

                    this.notificationService.showNotification(this.translate.instant("thereisnoauthorizationforthisprocess"), 'danger', 'top-end');
                } else {
                    this.notificationService.showNotification(this.translate.instant("thereisanerroronloadingstockdatas"), 'danger', 'top-end');
                }
                return of([]);
            })
        ).subscribe((data) => {
            if (!this.permissionDenied) {
                this.loadMagazalar();
                this.applyFilter();
            }
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
            this.filteredMagazalar = this.magazalar.filter(mgz =>
                mgz.magazaAdi.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                mgz.firmasahip.toLowerCase().includes(this.searchTerm.toLowerCase())
            );
        } else {
            this.filteredMagazalar = [...this.magazalar];
        }
    }
    ngAfterViewInit(): void {
        const lightbox = GLightbox({
            selector: '.glightbox' // Replace with your selector as needed
        });
    }
}
