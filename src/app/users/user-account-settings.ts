import { ChangeDetectorRef, Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { AppService } from 'src/app/service/app.service';
import { AuthService } from 'src/app/service/auth.service';
import { UserService } from 'src/app/service/user.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { slideDownUp, toggleAnimation } from '../shared/animations';
import { PaymentMethodService } from '../service/PaymentMethodService';
import { BillingAddressService } from '../service/BillingAddressService';
import { NotificationService } from '../apps/NotificationService';
import { MagazaService } from '../service/magaza.service';
import { CurrencyService } from '../service/currency.service';
import { log } from 'console';


@Component({
    templateUrl: './user-account-settings.html',
    animations: [slideDownUp, toggleAnimation],
})
export class UserAccountSettingsComponent implements OnInit {

    paymentMethodForm!: FormGroup;
    activeTab: string = 'home';
    store: any;
    user: any; // Başlangıçta kullanıcı bilgisi yok
    theme = 'light'; // Varsayılan tema
    userSettings: any[] = []; // Dinamik ayarlar burada saklanacak
    users: any[] = [];
    filteredUsers: any[] = [];
    searchTerm: string = '';
    showPassive: boolean = false;
    newPaymentMethod: any = {};
    itemsPerPage: number = 3;
    selectedKategori: string = ''; // Seçilen kategori ID'sini tutar
    selectedRole: string | null = null; 
    cols: any[] = [];
    isEditing: boolean = false;
    editingUserId = null;
    currentPassword = null;
    editingPaymentMethodId: string | null = null;
    magazalar: any[] = []; // Mağazalar listesi
    setColumnTitles(): void {
        const currentLang = this.translate.currentLang;
        this.cols = [
            // { field: 'avatar', title: this.translate.instant(" Avatar") },
            { field: 'kullaniciAdi', title: this.translate.instant(" Kullanıcı Adı") },
            { field: 'kullaniciAdsoyad', title: this.translate.instant("kullaniciAdsoyad") },
            { field: 'magaza', title: this.translate.instant("magazalar"), slot: 'magaza' },
            { field: 'aktif', title: this.translate.instant("Aktif") },
            { field: 'email', title: this.translate.instant("Email") },
            { field: 'telefon', title: this.translate.instant("Telefon") },
            { field: 'kvkk', title: this.translate.instant("KVKK") },
            { field: 'role.name', title: this.translate.instant("Role") },
            { field: 'actions', title: this.translate.instant("transactions"), slot: 'actions' }

        ];
    }


    currentPage: number = 1;   // Mevcut sayfa numarası
    roles: any[] = [];
    magaza: any[] = [];
    altKategoriler: any[] = [];
    userForm!: FormGroup;
    selectedMagazalar: any[] = [];
    permissionDenied: boolean = false;
    accordians3: any = null; // Accordion kontrolü için değişken
    validUnits: string[] = ['adet', 'kg', 'litre', 'paket', 'kutu', 'metre'];
    subActiveTab: string = 'genel'; // Default aktif sekme 'genel'
    isAddingNew: boolean = true; // Yeni ekleme işlemini takip etmek için
    paymentMethods: any[] = []; // Ödeme yöntemleri listesi
    @ViewChild('fileInput') fileInput!: ElementRef; // Dosya input referansı
    @ViewChild('modalAddPaymentMethod') modalAddPaymentMethod: any;

    billingAddressForm!: FormGroup;
    addressForm!: FormGroup;
    addresses: any[] = [];
    isEditingAddress = false;
    isEditMode: boolean = false;

    editAddressId: string | null = null;
    @ViewChild('modalAddEditBillingAddress') modalAddEditBillingAddress: any;

    phoneMask = {
        mask: '+{90} (000) 000-00-00'  // Türkiye için telefon numarası formatı
    };

    currency: any;

    constructor(
        public translate: TranslateService,
        private storeData: Store<any>,
        private appSetting: AppService,
        private authService: AuthService,
        private userService: UserService,
        private magazaService: MagazaService,
        public fb: FormBuilder,
        private cdr: ChangeDetectorRef,
        private paymentMethodService: PaymentMethodService,
        private addressService: BillingAddressService,
        private formBuilder: FormBuilder,
        private notificationService: NotificationService,
        private currencyService: CurrencyService
    ) {


        this.setColumnTitles();

        this.translate.onLangChange.subscribe(() => {
            this.setColumnTitles();
        });

    }

    mask12 = ['(', /\d/, /\d/, /\d/, ')', ' ', /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/];

    getMagazaNames(magazaList: any[]): string {
        if (!magazaList || magazaList.length === 0) {
            return 'No Store';
        }
        return magazaList.map(m => m.magazaAdi).join(', ');
    }

    onPasswordFieldFocus(): void {
        if (this.editingUserId && this.userForm.get('sifre')?.value === '********') {
            this.userForm.patchValue({ sifre: '' });
        }
    }

    getCurrency(): void {
        this.currencyService.gCurrency().subscribe({
            next: (data) => {
                this.currency = data;
                console.log(this.currency);
            },
            error: (err) => {
                console.error('Para birimi alınırken hata oluştu:', err);
            }
        });
    }

    // Para birimi değişim fonksiyonu
    changeCurrency(event: Event) {
        const selectElement = event.target as HTMLSelectElement;
        if (selectElement) {
            this.currency = selectElement.value; // Update the currency property
            console.log('Seçilen para birimi:', this.currency);
            this.currencyService.updateCurrency({ updateCurrency: this.currency }).subscribe({
                next: (data) => {
                    this.currency = data; // Update the currency with the response data
                    console.log('Updated currency:', this.currency);
                },
                error: (err) => {
                    console.error('Error updating currency:', err);
                }
            });
        }
    }

    getPaymentMethods(): void {
        this.paymentMethodService.getPaymentMethods().subscribe({
            next: (methods) => {
                this.paymentMethods = methods;
            },
            error: (err) => {
                console.error('Ödeme yöntemleri alınırken hata oluştu:', err);
            }
        });
    }

    // Kart resmini döndürmek için fonksiyon
    getCardImage(cardType: string): string {
        switch (cardType) {
            case 'Mastercard':
                return '/assets/images/card-mastercard.svg';
            case 'Visa':
                return '/assets/images/card-visa.svg';
            case 'American Express':
                return '/assets/images/card-americanexpress.svg';
            default:
                return '/assets/images/card-default.svg';
        }
    }

    // Ödeme yöntemini düzenlemek için
    editPaymentMethod(paymentMethod: any): void {
        this.isEditing = true; // Düzenleme moduna geçiyoruz
        this.editingPaymentMethodId = paymentMethod._id; // Düzenlenecek kartın ID'sini tut
        this.paymentMethodForm.patchValue({
            cardType: paymentMethod.cardType,
            cardNumber: paymentMethod.cardNumber,
            cardHolderName: paymentMethod.cardHolderName,
            expiryDate: paymentMethod.expiryDate,
            billingAddress: paymentMethod.billingAddress,
            isDefault: paymentMethod.isDefault
        });
        this.modalAddPaymentMethod.open();
    }

    savePaymentMethod(): void {
        if (this.paymentMethodForm.invalid) {
            return;
        }

        if (this.isEditing && this.editingPaymentMethodId) {
            // Ödeme yöntemini düzenleme
            this.paymentMethodService.updatePaymentMethod(this.editingPaymentMethodId, this.paymentMethodForm.value).subscribe({
                next: () => {
                    this.getPaymentMethods(); // Listeyi güncelle
                    this.closeAddPaymentMethodModal();
                },
                error: (err) => {
                    console.error('Ödeme yöntemi güncellenirken hata oluştu:', err);
                }
            });
        } else {
            // Yeni ödeme yöntemi ekleme
            this.paymentMethodService.addPaymentMethod(this.paymentMethodForm.value).subscribe({
                next: () => {
                    this.getPaymentMethods(); // Listeyi güncelle
                    this.closeAddPaymentMethodModal();
                },
                error: (err) => {
                    console.error('Ödeme yöntemi eklenirken hata oluştu:', err);
                }
            });
        }
    }

    deletePaymentMethod(paymentMethodId: string): void {
        if (confirm('Are you sure you want to delete this payment method?')) {
            this.paymentMethodService.deletePaymentMethod(paymentMethodId).subscribe({
                next: () => {
                    // Silme başarılı olursa, ödeme yöntemlerini yeniden yükleyin
                    this.getPaymentMethods();
                    this.notificationService.showNotification('Payment method deleted successfully.', 'top-end');
                },
                error: (err) => {
                    console.error('Payment method could not be deleted:', err);
                    this.notificationService.showNotification('An error occurred while deleting the payment method.', 'top-end');
                }
            });
        }
    }

    onCategoryFilterChange(): void {
        this.applyFilter();
        // this.loadAltKategoriler(this.selectedKategori);
    }

    ngOnInit(): void {
        this.initPaymentMethodForm();
        this.getUser();
        this.loadUser();
        this.loadRoles();
        this.loadMagaza();
        this.getUserSettings();
        this.getPaymentMethods();
        this.initBillingAddressForm();
        this.loadAddresses();
        this.initUserForm();
        this.getMagazalarim();
        this.getCurrency();
    }

    getMagazalarim(): void {
        this.magazaService.getMagazalarim().subscribe({
            next: (data) => {
                this.magazalar = data; // Mağazalar listesini değişkene atayın
            },
            error: (err) => {
                console.error('Mağazalar alınırken hata oluştu:', err);
            }
        });
    }

    initUserForm(): void {

        this.userForm = this.formBuilder.group({
            kullaniciAdi: ['', Validators.required],
            kullaniciAdsoyad: ['', Validators.required],
            sifre: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            telefon: ['', Validators.required],
            magaza: [[], Validators.required],
            role: ['', Validators.required],
            aktif: [true, Validators.required], // Aktif durumu kontrolü buraya eklenmeli
        });

        this.userForm.statusChanges.subscribe(status => {
            console.log('Form status:', status); // 'VALID' ya da 'INVALID' olarak göreceksiniz.
        });

    }

    initBillingAddressForm(): void {
        this.billingAddressForm = this.formBuilder.group({
            addressName: ['', Validators.required],
            address: ['', Validators.required],
            city: ['', Validators.required],
            state: ['', Validators.required],
        });
    }

    loadAddresses(): void {
        this.addressService.getAddresses().subscribe({
            next: (response) => {
                console.log('Adres Yanıtı:', response);
                if (response && response.addresses) {
                    this.addresses = response.addresses;
                    this.cdr.detectChanges();  // Değişiklikleri manuel olarak tespit et.
                }
            },
            error: (err) => {
                console.error('Adresler alınırken hata oluştu:', err);
            }
        });
    }

    openAddEditAddressModal(address?: any): void {
        if (address) {
            // Düzenleme moduna geçin
            this.isEditMode = true;
            this.editAddressId = address._id;

            // Formu mevcut adres bilgileriyle doldurun
            this.billingAddressForm.patchValue({
                addressName: address.addressName,
                addressLine: address.address,
                city: address.city,
                state: address.state,
            });
        } else {
            // Yeni adres ekleme moduna geçin
            this.isEditMode = false;
            this.editAddressId = null;
            this.billingAddressForm.reset();
        }

        this.modalAddEditBillingAddress.open();
    }


    closeAddEditBillingAddressModal(): void {
        this.modalAddEditBillingAddress.close();
    }

    saveBillingAddress(): void {
        if (this.billingAddressForm.invalid) {
            return;
        }

        const addressData = this.billingAddressForm.value;

        if (this.isEditMode && this.editAddressId) {
            // Güncelleme işlemi
            this.addressService.updateAddress(this.editAddressId, addressData).subscribe({
                next: () => {
                    this.loadAddresses(); // Adres listesini yeniden yükleyin
                    this.closeAddEditBillingAddressModal();
                },
                error: (err) => {
                    console.error('Adres güncellenirken hata oluştu:', err);
                }
            });
        } else {
            // Yeni adres ekleme işlemi
            this.addressService.addAddress(addressData).subscribe({
                next: () => {
                    this.loadAddresses(); // Adres listesini yeniden yükleyin
                    this.closeAddEditBillingAddressModal();
                },
                error: (err) => {
                    console.error('Adres eklenirken hata oluştu:', err);
                }
            });
        }
    }

    deleteAddress(addressId: string): void {
        if (confirm('Are you sure you want to delete this address?')) {
            this.addressService.deleteAddress(addressId).subscribe({
                next: () => {
                    this.loadAddresses(); // Adres listesi yeniden yüklenir
                },
                error: (err) => {
                    console.error('Adres silinirken hata oluştu:', err);
                }
            });
        }
    }

    initPaymentMethodForm() {
        this.paymentMethodForm = this.formBuilder.group({
            cardType: ['', Validators.required],
            cardNumber: ['', [Validators.required, Validators.pattern(/^(\d{4}\s?){3}\d{4}$/)]], // 16 basamak ve boşluklu pattern
            cardHolderName: ['', Validators.required],
            expiryDate: ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)]],
            billingAddress: ['', Validators.required],
            isDefault: [false]
        });
    }

    loadUser(): void {
        this.userService.getUsersAlt().pipe(
            catchError((error) => {
                console.error('Veri yükleme hatası:', error);
                if (error?.error?.message && error.error.message.includes('yetkiniz yok')) {
                    this.permissionDenied = true;
                    this.notificationService.showNotification(this.translate.instant("thereisnoauthorizationforthisprocess"), 'top-end');
                } else {
                    this.notificationService.showNotification(this.translate.instant("thereisanerroronloadingstockdatas"), 'top-end');
                }
                return of([]);
            })
        ).subscribe((data) => {
            if (!this.permissionDenied) {
                this.users = data;
                this.applyFilter();
            }
        });
    }

    applyFilter(): void {

        this.filteredUsers = this.users.filter((user) => {
            const matchesSearchTerm = this.searchTerm
                ? user.kullaniciAdsoyad.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                  user.kullaniciAdi.toLowerCase().includes(this.searchTerm.toLowerCase())
                : true;
            
                const matchesRole = this.selectedRole == "null"
                ? true
                : this.selectedRole == null ? true : user.role && user.role._id === this.selectedRole;

            console.log("matchesRole:"+matchesRole + " selectedRole:"+this.selectedRole);
            const matchesActiveStatus = this.showPassive ? true : user.aktif;

            console.log("matchesActiveStatus:"+matchesActiveStatus);
            return matchesSearchTerm && matchesRole && matchesActiveStatus;
        });
    }

    onToggleShowPassive(): void {
        this.applyFilter(); // Toggle yapıldığında filtreyi güncelle
    }

    onSearchTermChange(): void {
        this.applyFilter();
    }

    pageChange(page: number): void {
        this.currentPage = page;
    }

    onSearchChange(): void {
        if (this.searchTerm) {
            this.filteredUsers = this.users.filter(user =>
                user.kullaniciAdsoyad.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                user.kullaniciAdi.toLowerCase().includes(this.searchTerm.toLowerCase())
            );
        } else {
            this.filteredUsers = [...this.users];
        }
    }

    loadRoles(): void {
        this.userService.getRoles().subscribe({
            next: (data) => {
                this.roles = data;
                this.cdr.detectChanges(); // Değişiklikleri tespit etmesi için ekledik
            },
            error: (error) => {
                console.error('role yükleme hatası:', error);
                this.notificationService.showNotification(this.translate.instant("Role Yükleme hatası"), 'top-end');
            }
        });
    }

    loadMagaza(): void {
        this.userService.getMagaza().subscribe({
            next: (data) => {
                this.magaza = data;
                this.cdr.detectChanges(); // Değişiklikleri tespit etmesi için ekledik
            },
            error: (error) => {
                console.error('Mağaza yükleme hatası:', error);
                this.notificationService.showNotification(this.translate.instant("Mağaza Yükleme hatası"), 'top-end');
            }
        });
    }

    openAddPaymentMethodModal(): void {
        this.isEditing = false; // Yeni ödeme yöntemi eklenirken false
        this.modalAddPaymentMethod.open();
        if (this.paymentMethodForm) {
            this.paymentMethodForm.reset();
        }
    }

    // Modal'ı kapatma fonksiyonu
    closeAddPaymentMethodModal(): void {
        this.modalAddPaymentMethod.close(); // ViewChild ile modal'ı kapatıyoruz
    }

    addPaymentMethod(): void {
        console.log('Form geçerlilik durumu:', this.paymentMethodForm.valid);
        if (this.paymentMethodForm && this.paymentMethodForm.valid) {
            this.paymentMethodService.addPaymentMethod(this.paymentMethodForm.value).subscribe({
                next: () => {
                    // Yeni ödeme yöntemi eklendikten sonra listeyi güncelle
                    this.getPaymentMethods();
                    this.closeAddPaymentMethodModal();
                },
                error: (err) => {
                    console.error('Ödeme yöntemi eklenirken hata oluştu:', err);
                }
            });
        } else {
            console.error('Form geçerli değil. Kontrolleri kontrol ediniz.');
        }
    }

    saveUser(): void {
        if (this.userForm.valid) {
            let updatedUser = { ...this.userForm.value };

            // Düzenleme modunda ve şifre alanı değiştirilmemişse eski şifreyi koruyalım
            if (this.editingUserId && updatedUser.sifre === '') {
                // Eski şifreyi saklayalım
                updatedUser.sifre = this.currentPassword; // currentPassword değişkeni mevcut şifreyi tutuyor olmalı
            }

            if (this.editingUserId) {
                // Kullanıcı güncelleme işlemi
                this.updateUser(this.editingUserId, updatedUser);
            } else {
                // Yeni kullanıcı ekleme işlemi
                this.addUser(updatedUser);
            }
        } else {
            console.error('Form geçerli değil.');
        }
    }

    addUser(newUser: any): void {
        this.userService.addUserAlt(newUser).subscribe({
            next: (addedUser) => {
                this.users.push(addedUser);
                this.applyFilter();
                this.notificationService.showNotification('Kullanıcı Başarıyle Eklendi', 'success', 'top-end');
                this.isAddingNew = false;
                this.editingUserId = addedUser._id;
                this.loadRoles();
                this.loadUser();
                this.resetForm();
            },
            error: (error) => {
                if (error?.error?.msg === 'Bu email zaten kullanılıyor') {
                    this.notificationService.showNotification(this.translate.instant("Bu email zaten kullanılıyor"), 'danger', 'top-end');

                }
                if (error?.error?.msg === 'Bu kullanıcı adı zaten alınmış') {
                    this.notificationService.showNotification(this.translate.instant("Bu kullanıcı adı zaten alınmış"), 'danger', 'top-end');

                }
                if (error?.error?.msg === 'Alt kullanıcı sayısı paket limitini aşıyor') {
                    this.notificationService.showNotification(this.translate.instant("Alt kullanıcı sayısı paket limitini aşıyor"), 'danger', 'top-end');

                }
                else {

                    this.notificationService.showNotification(this.translate.instant("thereisanerroronaddingsubuser"), 'danger', 'top-end');

                }
            }
        });
    }

    addRoles(ad: string): void {
        this.userService.addRoles({ ad }).subscribe({
            next: (kategori) => {
                this.roles.push(kategori);
                this.notificationService.showNotification(this.translate.instant("categoryaddedsuccessfuly"), 'top-end');
            },
            error: (error) => {
                console.error('Kategori ekleme hatası:', error);
                this.notificationService.showNotification(this.translate.instant("erroronaddingcategory"), 'top-end');
            }
        });
    }

    updateUser(id: string, updatedUser: any): void {
        const userUpdateData = {
            kullaniciAdi: updatedUser.kullaniciAdi,
            kullaniciAdsoyad: updatedUser.kullaniciAdsoyad,
            sifre: updatedUser.sifre === '********' ? undefined : updatedUser.sifre,
            email: updatedUser.email,
            magaza: updatedUser.magaza,
            telefon: updatedUser.telefon,
            role: updatedUser.role,
            aktif: updatedUser.aktif
        };

        this.userService.updateUserByKullaniciId(id, userUpdateData).subscribe({
            next: (response) => {
                console.log(response.msg);

                const index = this.users.findIndex((user) => user._id === id);
                if (index !== -1) {
                    this.users[index] = {
                        ...this.users[index],
                        ...updatedUser,
                    };
                }
                this.applyFilter();
                this.notificationService.showNotification('Kullanıcı Başarıyla Güncellendi', 'top-end');

                this.isAddingNew = false;
                this.loadUser();

            },
            error: (error) => {
                console.error('Kullanıcı güncelleme hatası:', error);
                this.notificationService.showNotification('Kullanıcı güncelleme hatası:' + error, 'top-end');
            }
        });
    }

    editUser(user: any): void {
        this.editingUserId = user._id;

        // Mevcut şifreyi sakla (değiştirilmediği sürece bu kullanılacak)
        this.currentPassword = user.sifre;

        this.userForm.patchValue({
            kullaniciAdi: user.kullaniciAdi,
            kullaniciAdsoyad: user.kullaniciAdsoyad,
            email: user.email,
            telefon: user.telefon,
            kvkk: user.kvkk,
            role: user.role?._id,
            aktif: user.aktif,
            sifre: '********', // Şifreyi maskelenmiş olarak göster,
            magaza: user.magaza.map((m: any) => m._id), // Mağazalar burada güncelleniyor
        });

        this.isAddingNew = false;
        this.accordians3 = 1;

    }

    // Alış ve Satış Fiyatları İşlemleri
    get alisFiyatlari(): FormArray {
        return this.userForm.get('alisFiyatlari') as FormArray;
    }

    saveAlisFiyat(index: number): void {
        const alisFiyatGroup = this.alisFiyatlari.at(index) as FormGroup;

        // Formun geçerliliğini kontrol et
        if (alisFiyatGroup && alisFiyatGroup.valid) {
            const alisFiyat = alisFiyatGroup.value;
        } else {
            // Eğer form geçerli değilse, kullanıcıya bir bildirim göster.
            this.notificationService.showNotification(this.translate.instant("entervalidpurchaseinfo"), 'top-end');
        }
    }

    deleteUser(userId: string): void {
        if (confirm(this.translate.instant("areyousuretodeletethis User"))) {
            this.userService.deleteUser(userId).subscribe({
                next: () => {
                    this.users = this.users.filter(user => user._id !== userId);
                    this.notificationService.showNotification(this.translate.instant(" User deletedsuccessfully"), 'top-end');
                },
                error: (error) => {
                    console.error('Silme hatası:', error);
                    this.notificationService.showNotification(this.translate.instant("thereisanerrorondeleting User"), 'top-end');
                }
            });
        }
    }

    // Sekme değiştirme işlemleri
    setActiveTab(tab: string): void {
        this.activeTab = tab;
    }
    setActiveSubTab(tab: string): void {
        this.subActiveTab = tab;
    }

    isActiveTab(tab: string): boolean {
        return this.activeTab === tab;
    }

    isActiveSubTab(tab: string): boolean {
        return this.subActiveTab === tab;
    }

    resetForm(): void {
        this.userForm.reset();
        this.userForm.patchValue({
            anaBirim: '',
            aktif: true,
        });
        this.editingUserId = null;
        this.cdr.detectChanges();

    }

    changeLanguage(language: { code: string }): void {
        this.translate.use(language.code);
        this.appSetting.toggleLanguage(language);
        const direction = this.store.locale?.toLowerCase() === 'ae' ? 'rtl' : 'ltr';
        this.storeData.dispatch({ type: 'toggleRTL', payload: direction });
        window.location.reload();
    }

    private getUser() {
        this.authService.getUserFromServer().pipe(
            catchError((error) => {
                console.error('Kullanıcı getirilemedi', error);
                return of(null); // Hata durumunda bir Observable döndürün
            })
        ).subscribe(response => {
            if (response) {
                this.user = response; // Kullanıcı bilgilerini al
            }
        });
    }

    updateProfile() {
        this.authService.updateProfile(
            this.user._id,
            this.user.kullaniciAdi,
            this.user.email,
            this.user.telefon,
            this.user.faturaBilgileri,
            this.user.kvkk,
            this.user.paketBilgisi,
            this.user.avatar
        ).pipe(
            catchError((error) => {
                console.error('Profil güncellenemedi', error);
                return of(null); // Hata durumunda bir Observable döndürün
            })
        ).subscribe(response => {
            if (response) {
                console.log('Profil güncellendi', response);
            } else {
                console.error('Profil güncellenirken bir hata oluştu');
            }
        });
    }

    onImageClick() {
        this.fileInput.nativeElement.click(); // Dosya input'unu aç
    }

    onFileChange(event: any) {
        const file = event.target.files[0]; // Seçilen dosyayı al
        if (file) {
            const reader = new FileReader(); // Dosya okuyucu oluştur
            reader.onload = (e: any) => {
                this.user.avatar = e.target.result.split(',')[1]; // Base64 formatında kaydet
            };
            reader.readAsDataURL(file); // Dosyayı oku
        }
    }

    private getUserSettings() {
        this.userService.getUserSettings().pipe(
            catchError((error) => {
                console.error('Kullanıcı ayarları getirilemedi', error);
                return of(null);
            })
        ).subscribe(response => {
            const defaultSettingsKeys = [
                'kuryeEkraniKullanimi',
                'mutfakEkraniKullanimi',
                'kasiyerEkraniKullanimi',
                'paketSatisiKullanimi',
                'garsonEkraniKullanimi',
                'takeAwayMusteriBilgileriKullanimi',
                'parentMasaKisiSayisiKullanimi' //parent userdan gelen değer userrın kendi değeri masaKisiSayisiKullanimi
            ];

            // Eğer response boşsa varsayılan false değerleriyle `userSettings` oluştur.
            if (!response) {
                this.userSettings = defaultSettingsKeys.map(key => ({
                    key: key,
                    displayName: this.formatDisplayName(key),
                    description: `Toggle the setting for ${this.formatDisplayName(key)}`,
                    value: false
                }));
            } else {
                this.userSettings = defaultSettingsKeys.map(key => ({
                    key: key,
                    displayName: this.formatDisplayName(key),
                    description: `Toggle the setting for ${this.formatDisplayName(key)}`,
                    value: response[key] ?? false // Gelen `response` içinde varsa, onun değerini kullan; yoksa false yap
                }));
            }
        });
    }

    private formatDisplayName(key: string): string {
        return key
            .replace(/([a-z])([A-Z])/g, '$1 $2') // CamelCase'i boşlukla ayır
            .replace('Kullanimi', ''); // `Kullanimi` kelimesini kaldır
    }

    toggleSetting(key: string, value: boolean): void {
        this.userService.updateUserSetting(key, value).pipe(
            catchError((error) => {
                console.error(`Ayar güncellenemedi: ${key}`, error);
                return of(null);
            })
        ).subscribe(() => {
            console.log(`${key} updated to ${value}`);
        });
    }

    toggleTheme(): void {
        this.toggleSetting('theme', this.theme === 'dark');
    }

    formatDate(dateString: string): string {
        if (!dateString) return '';
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = ('0' + (date.getMonth() + 1)).slice(-2);
        const day = ('0' + date.getDate()).slice(-2);
        return `${year}-${month}-${day}`;
    }
}
