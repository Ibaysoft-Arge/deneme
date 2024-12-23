import { Component } from '@angular/core';
import { toggleAnimation } from 'src/app/shared/animations';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { AppService } from 'src/app/service/app.service';
import { AuthService } from 'src/app/service/auth.service'; // AuthService'i içe aktarın
import { PaketService } from 'src/app/service/paket.service'; // AuthService'i içe aktarın
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';


@Component({
    templateUrl: './profile.html',
    animations: [toggleAnimation],
})
export class ProfileComponent {
    store: any;
    user: any;
    userPayment: any;
    firma: any;
    isEditing: boolean = false;


    constructor(
        public translate: TranslateService,
        public storeData: Store<any>,
        private appSetting: AppService,
        private authService: AuthService,
        private paketService: PaketService,
    ) {
        this.initStore();
    }

    async initStore() {
        this.storeData
            .select((d) => d.index)
            .subscribe((d) => {
                this.store = d;
            });
    }

    ngOnInit(): void {
        this.getUser(); // Sayfa açıldığında kullanıcı bilgilerini al
        this.getUserPayment();
        this.getUserPaymentHistory();
        this.getFirmaInfo();
    }

    changeLanguage(item: any) {
        this.translate.use(item.code);
        this.appSetting.toggleLanguage(item);
        if (this.store.locale?.toLowerCase() === 'ae') {
            this.storeData.dispatch({ type: 'toggleRTL', payload: 'rtl' });
        } else {
            this.storeData.dispatch({ type: 'toggleRTL', payload: 'ltr' });
        }
        window.location.reload();
    }

    getUser() {
        this.authService.getUserFromServer().pipe(
            catchError((error) => {
                // Hata durumunda yapılacak işlemler
                console.error('Kullanıcı getirilemedi', error);
                return of(null); // Hata durumunda bir Observable döndürün
            })
        ).subscribe(response => {
            if (response) {

                this.user = response; // Kullanıcı bilgilerini al
            }
        });
    }

    getFirmaInfo() {
        this.paketService.getFirmaInfo().pipe(
            catchError((error) => {
                // Hata durumunda yapılacak işlemler
                console.error('Firma getirilemedi', error);
                return of(null); // Hata durumunda bir Observable döndürün
            })
        ).subscribe(response => {
            if (response) {

                this.firma = response; // Kullanıcı bilgilerini al
            }
        });
    }

    getUserPayment() {
        this.paketService.getUserPayment().pipe(
            catchError((error) => {
                // Hata durumunda yapılacak işlemler
                console.error('Kullanıcı Ödeme Bilgileri Getirilemedi', error);
                return of(null); // Hata durumunda bir Observable döndürün
            })
        ).subscribe(response => {
            if (response) {
                // console.log(response);
                this.userPayment = response; // Kullanıcı bilgilerini al
            }
        });
    }

    calculateProgress(baslangicTarihi: string, bitisTarihi: string, kalanGun: number): number {
        const baslangic = new Date(baslangicTarihi);
        const bitis = new Date(bitisTarihi);

        // Başlangıç ve bitiş tarihleri arasındaki toplam gün sayısını hesapla
        const toplamGun = Math.ceil((bitis.getTime() - baslangic.getTime()) / (1000 * 60 * 60 * 24));

        // Kullanılan gün oranını hesapla
        const kullanilanGun = toplamGun - kalanGun;
        const progress = (kullanilanGun / toplamGun) * 100;

        return Math.min(Math.max(progress, 0), 100); // 0 ile 100 arasında sınırlıyoruz
    }

    calculateRemainingDays(bitisTarihi: string): number {
        const today = new Date();
        const endDate = new Date(bitisTarihi);

        // Kalan gün sayısını hesapla
        const remainingTime = endDate.getTime() - today.getTime();
        const remainingDays = Math.ceil(remainingTime / (1000 * 60 * 60 * 24));

        return remainingDays >= 0 ? remainingDays : 0; // Geçersiz tarih durumunda 0 döner
    }

    getUserPaymentHistory() {
        this.paketService.getUserPaymentHistory().pipe(
            catchError((error) => {
                // Hata durumunda yapılacak işlemler
                console.error('Kullanıcı Ödeme Bilgileri Getirilemedi', error);
                return of(null); // Hata durumunda bir Observable döndürün
            })
        ).subscribe(response => {
            if (response) {
                console.log(response);
                this.userPayment = response; // Kullanıcı bilgilerini al
            }
        });
    }

    toggleEditMode() {
        if (this.isEditing) {
            this.updateFirmaInfo();
        }
        this.isEditing = !this.isEditing;
    }

    cancelEdit() {
      // Orijinal veriyi geri yükle
        this.isEditing = false; // Düzenleme modunu kapat
    }

    updateFirmaInfo() {
        this.paketService.updateFirmaInfo(this.firma._id, this.firma.firmaAdi, this.firma.adres, this.firma.email, this.firma.telefon).pipe(
            catchError((error) => {
                // Hata durumunda yapılacak işlemler
                console.error('Register failed', error);
                return of(null); // Hata durumunda bir Observable döndürün
            })
        ).subscribe(response => {
            if (response) {
                // Başarılı girişte yapılacak işlemler (örneğin, yönlendirme)
                console.error('Firma güncelleme başarılı');
            }
        });
    }
}
