import { Component, OnInit } from '@angular/core';
import { slideDownUp, toggleAnimation } from 'src/app/shared/animations';
import { FormBuilder } from '@angular/forms';
import { Store } from '@ngrx/store';
import { PermissionService } from 'src/app/service/permission.service';
import { PaketService } from 'src/app/service/paket.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import Swal from 'sweetalert2';
import { NotificationService } from './NotificationService';
import { TranslateService } from '@ngx-translate/core';
import { NotificationMsgService } from '../service/Notification.Service ';
import { SupportHoursService } from '../service/supportHoursService';


@Component({
    templateUrl: './permission.html',
    animations: [toggleAnimation, slideDownUp],
})
export class PermissionComponent implements OnInit {
    accordians3: boolean = false;
    accordiansAltModul: boolean = false;
    accordiansSayfa: boolean = false;
    activeTab: string = 'permission';
    accordionOpen: string = '';
    activeSubTab: string = 'paket';
    permissions: any[] = [];
    selectedPermissions: string[] = [];
    permissionName: string = '';
    permissionDescription: string = '';
    roleName: string = '';
    roles: any[] = [];
    selectedRole: string = '';
    searchTermSayfa: string = '';
    showPassiveSayfa: boolean = false;
    filteredSayfalar: any[] = [];
    sayfalar: any[] = [];
    selectedPaket: string = '';
    selectedModul: string = '';
    selectedAltModul: string = "";
    selectedSayfa: string = "";

    paketler: any[] = [];
    selectedPaketler: string[] = [];

    moduller: any[] = [];
    selectedModuller: string[] = [];
    isUpdatingsupport = false;
    editingSupportHourId: string | null = null;
    altModuller: any[] = [];
    selectedAltModuller: string[] = [];
    selectedRoller: string[] = [];
    newSupportHour: any = { dayOfWeek: '', startTime: '', endTime: '', isActive: true };  // Yeni saat verisi
    supportHours: any[] = [];
    selectedSayfalar: string[] = [];

    public filteredAltModuller: any[] = [];
    public altModulName = '';

    public isAltUpdating = false;
    public showAltPassive = false;
    public searchTermAltModul = '';

    // Durum mesajlarını depolamak için nesne
    statusMessages: { [key: string]: { error: string | null, success: string | null } } = {
        permission: { error: null, success: null },
        role: { error: null, success: null },
        paket: { error: null, success: null },
        paketUpdate: { error: null, success: null },
        modul: { error: null, success: null }
    };

    isUpdating: boolean = false;
    selectedPaketId: string | null = null;
    selectedModulId: string | null = null;
    selectedAltModulId: string | null = null;
    selectedRollerId: string | null = null;


    // Paket formu için eklenen özellikler
    paketName: string = '';
    paketAylikFiyat: number = 0;
    paketYillikFiyat: number = 0;
    paketKullaniciSayisi: number = 0;
    paketMagazaSayisi: number = 0;
    paketIsActive: boolean = false;

    // Modul formu için eklenen özellikler
    modulName: string = '';
    modulKodu: string = "";
    modulFiyat: number = 0;
    modulYillikFiyat: number = 0;
    modulAktifmi: boolean = false;
    modulFreemi: boolean = false;
    modulPaket: string[] = [];


    filteredModuller: any[] = []; // Filtrelenmiş modülleri gösterecek dizi
    searchTerm: string = ''; // Arama terimi
    showPassive: boolean = false; // Pasifleri göster

    sayfaAktifmi: boolean = true;

    isSayfaUpdating: boolean = false;
    selectedSayfaId: string = '';
    // Alt Modul formu için eklenen özellikler
    weekDays: string[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];  // Haftanın günleri
    selectedDay: string = ''; // Seçilen gün
    accordions = {
        paketForm: false,  // Paket formu başta kapalı
    };
    //sayfa
    sayfaKod: string = "";
    sayfaName: string = "";

    sayfaFiyat: number = 0;
    sayfaYillikFiyat: number = 0;
    sayfaPaketeDahilmi: boolean = false;
    treeData: any[] = [];
    treeview1: any[] = []; // Açık olan öğeleri takip etmek için
    notificationMessage: string = ''; // Bildirim mesajı
    constructor(
        private fb: FormBuilder,
        private storeData: Store<any>,
        private permissionService: PermissionService,
        private paketService: PaketService,
        private notificationService: NotificationService, // Yeni eklenen servis
        private translate: TranslateService,
        private notificationServicemsg: NotificationMsgService,
        private supportHoursService: SupportHoursService
    ) { }

    ngOnInit(): void {
        this.getPermissions();
        this.getRoles();
        this.getPaketler();
        this.getModuller();
        this.getAltModuller();
        this.getSayfalar();
        this.getTreeViewData();
        this.getSupportHours();
    }

    // Destek saatlerini almak için API çağrısı
    getSupportHours() {
        this.supportHoursService.getSupportHours().subscribe(
            (data) => {
                this.supportHours = data;  // Veriyi supportHours array'ine al
            },
            (error) => {
                console.error('Error fetching support hours:', error);
            }
        );
    }

    // Yeni destek saati eklemek için form submit işlemi
    addSupportHour() {
        if (this.selectedDay) {
            const supportHour = { ...this.newSupportHour, dayOfWeek: this.selectedDay };
            this.supportHoursService.addSupportHour(supportHour).subscribe((res) => {
                // Formu sıfırlama ve veriyi güncelleme
                this.newSupportHour = { startTime: '', endTime: '', dayOfWeek: '', isActive: true };
                this.getSupportHours();  // Yeni saatleri yükle
            });
        }
    }

    editSupportHour(hour: any) {
        this.isUpdatingsupport = true;
        this.selectedDay = hour.dayOfWeek;
        this.newSupportHour = { ...hour }; // Seçilen saat bilgilerini formda göster
        this.editingSupportHourId = hour._id; // Düzenleme yapılacak saat ID'sini sakla
    }

    // Destek saati güncelleme
    updateSupportHour() {
        if (this.editingSupportHourId) {
            this.supportHoursService.updateSupportHour(this.editingSupportHourId, this.newSupportHour).subscribe(response => {
                this.getSupportHours();
                this.newSupportHour = { dayOfWeek: '', startTime: '', endTime: '', isActive: true }; // Formu sıfırla
                this.isUpdatingsupport = false;
                this.editingSupportHourId = null; // Güncelleme işlemi bitince ID'yi sıfırla
            });
        }
    }

    sendNotification(): void {
        if (!this.notificationMessage) {
            this.notificationService.showNotification(this.translate.instant('notificationcannotbeempty'), 'danger', 'top-end');
            return;
        }

        const newNotification = {
            message: this.notificationMessage
        };

        this.notificationServicemsg.addNotificationAll(newNotification).subscribe({
            next: () => {
                this.notificationService.showNotification(this.translate.instant('notificationsuccessfullysent'), 'success', 'top-end');
                this.notificationMessage = ''; // Mesaj alanını temizle
            },
            error: () => {
                this.notificationService.showNotification(this.translate.instant('notificationfailedtosend'), 'danger', 'top-end');
            }
        });
    }

    toggleAccordion(accordionName: string): void {
        this.accordionOpen = this.accordionOpen === accordionName ? '' : accordionName;
    }

    accordianToggle() {
        // accordians3 değerini tersine çevir
        this.accordians3 = !this.accordians3;
    }

    accordianToggleModul(durum: any) {
        // accordians3 değerini tersine çevir
        this.accordians3 = durum;
    }

    toggleAccordionPaketForm() {
        this.accordions.paketForm = !this.accordions.paketForm;
    }

    accordianToggleSayfa(durum: any) {
        this.accordiansSayfa = durum;
    }

    toggleAccordionPaketFormOpen() {
        this.accordions.paketForm = true;
    }

    editPaket(paket: any) {
        this.isUpdating = true;
        this.selectedPaketId = paket._id;

        this.paketName = paket.paketAdi;
        this.paketAylikFiyat = paket.aylikFiyati;
        this.paketYillikFiyat = paket.yillikFiyati;
        this.paketKullaniciSayisi = paket.kullaniciSayisi;
        this.paketMagazaSayisi = paket.magazaSayisi;
        this.paketIsActive = paket.aktifmi;

        this.toggleAccordionPaketFormOpen();
    }

    updatePaket() {
        if (this.selectedPaketId && this.paketName) {
            this.paketService.updatePaket(
                this.selectedPaketId,
                this.paketName,
                this.paketAylikFiyat,
                this.paketYillikFiyat,
                this.paketKullaniciSayisi,
                this.paketMagazaSayisi,
                this.paketIsActive
            ).pipe(
                catchError((error) => {
                    // console.error('Paket update failed', error);
                    this.notificationService.showNotification(this.translate.instant("failedtosavepaket"), 'danger', 'top-end');
                    //  this.statusMessages['paket'].error = 'Failed to update paket. Please try again.';
                    return of(null);
                })
            ).subscribe(response => {
                if (response) {

                    this.notificationService.showNotification(this.translate.instant("packageupdatedsuccessfully"), 'success', 'top-end');

                    //  this.statusMessages['paket'].success = 'Paket updated successfully!';
                    // this.statusMessages['paket'].error = null;
                    this.getPaketler();
                    this.getTreeViewData();

                    // this.clearPaketForm();
                    setTimeout(() => this.statusMessages['paket'].success = null, 3000);
                }
            });
        } else {
            this.notificationService.showNotification(this.translate.instant("pleasefillfields"), 'danger', 'top-end');

        }
    }

    assignUsersToPaket(paketId: string): void {
        this.permissionService.updateUsersByPaketId(paketId).subscribe({
            next: () => {
                // response kullanmıyoruz, bu yüzden next() metodunda parametreye gerek yok
                this.notificationService.showNotification('Kullanıcılara atama işlemi başarılı.', 'success', 'top-end');
            },
            error: (error: any) => {
                console.error('Kullanıcılara atama işlemi sırasında hata oluştu', error);
                this.notificationService.showNotification('Kullanıcılara atama işlemi sırasında hata oluştu.', 'danger', 'top-end');
            }
        });
    }

    showNotification(msg: string, position: string = 'top-end', duration: number = 3000): void {
        const toast = Swal.mixin({
            toast: true,
            position: position as any,
            showConfirmButton: false,
            timer: duration,
        });
        toast.fire({
            title: msg,
        });
    }

    resetForm(accordionDurum: any) {
        this.paketName = '';
        this.paketAylikFiyat = 0;
        this.paketYillikFiyat = 0;
        this.paketKullaniciSayisi = 0;
        this.paketIsActive = true;

        this.isUpdating = false;
        this.selectedPaketId = null;
        this.accordions.paketForm = accordionDurum;
    }

    getPermissions() {
        this.permissionService.getPermissions().pipe(
            catchError((error) => {
                console.error('Data fetch failed', error);
                this.notificationService.showNotification(this.translate.instant("couldnotfetchpermissions"), 'danger', 'top-end');

                return of(null);
            })
        ).subscribe(response => {
            if (response) {
                this.permissions = response;
                // this.statusMessages['permission'].error = null; // Updated to bracket notation
            }
        });
    }

    getRoles() {
        if (this.roles.length === 0) {
            this.permissionService.getRoles().pipe(
                catchError((error) => {

                    this.notificationService.showNotification(this.translate.instant("couldnotfetchpermissions"), 'danger', 'top-end');

                    return of(null);
                })
            ).subscribe(response => {
                if (response) {
                    this.roles = response;

                }
            });
        }
    }

    onRoleSelect(event: Event): void {
        const selectElement = event.target as HTMLSelectElement;
        const roleId = selectElement.value;
        this.selectedRole = roleId;
        const role = this.roles.find(r => r._id === roleId);
        this.selectedPermissions = role ? [...role.permissions] : [];
    }

    onPaketSelect(event: Event): void {
        const selectElement = event.target as HTMLSelectElement;
        const paketId = selectElement.value;
        this.selectedPaket = paketId;

    }

    onModulSelect(event: Event): void {
        const selectElement = event.target as HTMLSelectElement;
        const modulId = selectElement.value;
        this.selectedModul = modulId;
    }

    onAltModulSelect(event: Event): void {
        const selectElement = event.target as HTMLSelectElement;
        const altModulId = selectElement.value;
        this.selectedAltModul = altModulId;
    }

    onSayfaSelect(event: Event): void {
        const selectElement = event.target as HTMLSelectElement;
        const sayfaId = selectElement.value;
        this.selectedSayfa = sayfaId;
    }

    onPermissionChange(event: any, permissionName: string): void {
        if (event.target.checked) {
            this.selectedPermissions.push(permissionName);
        } else {
            this.selectedPermissions = this.selectedPermissions.filter(id => id !== permissionName);
        }
    }

    addPermission() {
        this.permissionService.addPermission(this.permissionName, this.permissionDescription).pipe(
            catchError((error) => {
                console.error('Permission save failed', error);
                this.notificationService.showNotification(this.translate.instant("failedtosavepermission"), 'danger', 'top-end');

                return of(null);
            })
        ).subscribe(response => {
            if (response) {

                this.notificationService.showNotification(this.translate.instant("permissonaddedsuccessfully"), 'success', 'top-end');

                this.permissionName = '';
                this.permissionDescription = '';

                this.getPermissions();
                this.getTreeViewData();

            }
        });
    }

    addRole() {
        this.permissionService.addRole(this.roleName, this.selectedPermissions).pipe(
            catchError((error) => {
                console.error('Role save failed', error);
                this.notificationService.showNotification(this.translate.instant("failedtosavepermission"), 'danger', 'top-end');
                //                this.statusMessages['role'].error = 'Failed to save role. Please try again.'; // Updated to bracket notation
                return of(null);
            })
        ).subscribe(response => {
            if (response) {
                this.notificationService.showNotification(this.translate.instant("roleaddedsuccessfully"), 'success', 'top-end');


                this.roleName = '';
                this.selectedPermissions = [];
                this.getTreeViewData();


            }
        });
    }

    clearPaketForm() {
        this.paketName = '';
        this.paketAylikFiyat = 0;
        this.paketYillikFiyat = 0;
        this.paketKullaniciSayisi = 0;
        this.paketMagazaSayisi = 0;
        this.paketIsActive = false;
    }

    // updateRole() metodunun güncellenmiş hali
    updateRole() {
        if (!this.selectedRole) {
            this.notificationService.showNotification(this.translate.instant("pleaseselectaroletoupdate"), 'danger', 'top-end');
            return;
        }

        this.permissionService.updateRole(this.selectedRole, this.selectedPermissions).pipe(
            catchError((error) => {
                this.notificationService.showNotification(this.translate.instant("failedtoupdaterole"), 'danger', 'top-end');
                return of(null);
            })
        ).subscribe(response => {
            if (response) {
                this.notificationService.showNotification(this.translate.instant("roleupdatedsuccessfully"), 'success', 'top-end');
                this.selectedRole = '';
                this.selectedPermissions = [];
                this.getTreeViewData();

            }
        });
    }

    // addPaket() metodunun güncellenmiş hali
    addPaket() {
        if (this.paketName) {
            this.paketService.addPaket(this.paketName, this.paketAylikFiyat, this.paketYillikFiyat, this.paketKullaniciSayisi, this.paketMagazaSayisi,this.paketIsActive).pipe(
                catchError((error) => {
                    this.notificationService.showNotification(this.translate.instant("failedtosavepaket"), 'danger', 'top-end');
                    return of(null);
                })
            ).subscribe(response => {
                if (response) {
                    this.notificationService.showNotification(this.translate.instant("packageaddedsuccessfully"), 'success', 'top-end');
                    this.clearPaketForm();
                    this.getTreeViewData();

                }
            });
        } else {
            this.notificationService.showNotification(this.translate.instant("pleasefillfields"), 'danger', 'top-end');
        }
    }

    // addModul() metodunun güncellenmiş hali
    addModul() {
        if (this.modulName) {
            // Seçilen paketlerin IDsini modulPaket olarak atıyoruz
            const modulPaket = this.selectedPaketler;

            // Modülü eklemek için API çağrısı yapıyoruz
            this.paketService.addModul(
                this.modulName,
                this.modulKodu,
                this.modulFiyat,
                this.modulYillikFiyat,
                this.modulAktifmi,
                this.modulFreemi,
                modulPaket
            ).pipe(
                catchError((error) => {
                    // Başarısız olursa hata bildirimi
                    this.notificationService.showNotification(this.translate.instant("failedtosavemodul"), 'danger', 'top-end');
                    return of(null);
                })
            ).subscribe(response => {
                if (response) {
                    // Başarılı olursa başarı bildirimi
                    this.notificationService.showNotification(this.translate.instant("moduleaddedsuccessfully"), 'success', 'top-end');
                    //  this.clearModulForm();
                    this.getTreeViewData();

                }
            });
        } else {
            // Eğer zorunlu alanlardan biri boşsa kullanıcıyı bilgilendirin
            this.notificationService.showNotification(this.translate.instant("pleasefillfields"), 'danger', 'top-end');
        }
    }

    // addAltModul() metodunun güncellenmiş hali
    addAltModul() {
        if (this.altModulName) {
            this.paketService.addAltModul(this.altModulName, this.selectedModuller).pipe(
                catchError((error) => {
                    this.notificationService.showNotification(this.translate.instant("failedtosavealtmodul"), 'danger', 'top-end');
                    return of(null);
                })
            ).subscribe(response => {
                if (response) {
                    this.notificationService.showNotification(this.translate.instant("submoduleaddedsuccessfully"), 'success', 'top-end');
                    this.clearPaketForm();
                    this.getAltModuller();  // Alt modül listesini güncelle
                    this.getTreeViewData();

                }
            });
        } else {
            this.notificationService.showNotification(this.translate.instant("pleasefillfields"), 'danger', 'top-end');
        }
    }

    // addSayfa() metodunun güncellenmiş hali
    addSayfa() {
        this.paketService.addSayfa(
            this.sayfaKod,                 // kod
            this.sayfaName,                // name
            this.sayfaAktifmi,             // aktifmi
            this.sayfaFiyat,               // fiyat
            this.sayfaYillikFiyat,         // yillikFiyat
            this.sayfaPaketeDahilmi,       // paketeDahilmi - bu değişken eksik gibi görünüyor
            this.selectedAltModuller,       // altModul
            this.selectedRoller
        ).pipe(
            catchError(error => {
                console.error('Failed to add sayfa:', error);
                this.notificationService.showNotification(this.translate.instant("failedtoaddsayfa"), 'danger', 'top-end');
                return of(null);
            })
        ).subscribe(response => {
            if (response) {
                this.notificationService.showNotification(this.translate.instant("pageaddedsuccessfully"), 'success', 'top-end');
                // Gerekirse listeyi güncellemek için sayfa verilerini tekrar çekebilirsiniz
                this.getSayfalar();
                this.getTreeViewData();

            }
        });
    }

    getTreeViewData() {
        this.paketService.getAll().subscribe(response => {
            if (response && response.treeView) {
                console.log("TreeView Data:", response.treeView); // Veriyi kontrol edin
                this.treeData = response.treeView;
            }
        });
    }

    toggleTreeview1(name: string) {
        if (this.treeview1.includes(name)) {
            this.treeview1 = this.treeview1.filter(d => d !== name);
        } else {
            this.treeview1.push(name);
        }
    }

    updateSayfa() {
        if (this.selectedSayfaId && this.sayfaName) {

            console.log("seçilen roller:",this.selectedRoller);

            const updatedSayfa = {
                name: this.sayfaName,
                kod: this.sayfaKod,
                aktifmi: this.sayfaAktifmi,
                fiyat: this.sayfaFiyat,
                yillikFiyat: this.sayfaYillikFiyat,
                paketeDahilmi: this.sayfaPaketeDahilmi,
                altModul: this.selectedAltModuller,
                roller:this.selectedRoller
            };

            this.paketService.updateSayfa(
                this.selectedSayfaId,
                updatedSayfa.name,
                updatedSayfa.kod,
                updatedSayfa.aktifmi,
                updatedSayfa.fiyat,
                updatedSayfa.yillikFiyat,
                updatedSayfa.paketeDahilmi,
                updatedSayfa.altModul,
                updatedSayfa.roller
            ).pipe(
                catchError((error) => {
                    this.notificationService.showNotification(this.translate.instant("pageaddedsuccessfully"), 'danger', 'top-end');
                    return of(null);
                })
            ).subscribe(response => {
                if (response) {
                    this.notificationService.showNotification(this.translate.instant("updatepagesuccesfully"), 'success', 'top-end');
                    this.getSayfalar();  // Sayfa listesini güncelle
                    this.resetFormSayfa();  // Formu sıfırla ve yeni eklemeye hazır hale getir
                    this.getTreeViewData();

                }
            });
        } else {
            this.notificationService.showNotification(this.translate.instant("pleasefillfields"), 'danger', 'top-end');
        }
    }

    editSayfa(sayfa: any) {
        this.isSayfaUpdating = true;
        this.selectedSayfaId = sayfa._id;

        // Form alanlarını doldur
        this.sayfaName = sayfa.name;
        this.sayfaKod = sayfa.kod;
        this.sayfaFiyat = sayfa.fiyat;
        this.sayfaYillikFiyat = sayfa.yillikFiyat;
        this.sayfaAktifmi = sayfa.aktifmi;
        this.sayfaPaketeDahilmi = sayfa.paketeDahilmi;
        this.selectedAltModuller = sayfa.altModul.map((altModul: any) => altModul._id);
        this.selectedRoller = sayfa.roller.map((Role: any) => Role._id);

        // Accordion'ı açık hale getir
        this.accordianToggleSayfa(true);
    }

    // getPaketler() metodunun güncellenmiş hali
    getPaketler() {
        this.paketService.getPaketler().pipe(
            catchError((error) => {
                this.notificationService.showNotification(this.translate.instant("couldnotfetchpaketler"), 'danger', 'top-end');
                return of(null);
            })
        ).subscribe(response => {
            if (response) {
                this.paketler = response;
                this.getTreeViewData();

            }
        });
    }

    resetFormSayfa() {
        this.sayfaName = '';
        this.sayfaKod = '';
        this.sayfaFiyat = 0;
        this.sayfaYillikFiyat = 0;
        this.sayfaAktifmi = true;
        this.selectedAltModuller = [];
        this.selectedRoller = [];
        this.isSayfaUpdating = false;
        this.selectedSayfaId = '';
    }

    updateModul() {
        if (this.selectedModulId && this.modulName) {
            const updatedModul = {
                _id: this.selectedModulId,
                name: this.modulName,
                kodu: this.modulKodu,
                fiyat: this.modulFiyat,
                yillikFiyat: this.modulYillikFiyat,
                aktifmi: this.modulAktifmi,
                freemi: this.modulFreemi,
                paket: this.selectedPaketler
            };

            this.paketService.updateModul(this.selectedModulId, updatedModul).pipe(
                catchError((error) => {
                    this.notificationService.showNotification(this.translate.instant("failedtoupdatemodul"), 'danger', 'top-end');
                    return of(null);
                })
            ).subscribe(response => {
                if (response) {
                    this.notificationService.showNotification(this.translate.instant("moduleupdatedsuccessfully"), 'success', 'top-end');
                    this.getModuller();  // Modül listesini güncelle
                    // this.resetForm();  // Formu sıfırla ve yeni eklemeye hazır hale getir
                    this.getTreeViewData();

                }
            });
        } else {
            this.notificationService.showNotification(this.translate.instant("pleasefillfields"), 'danger', 'top-end');
        }
    }

    updateAltModul() {
        if (this.selectedAltModulId && this.altModulName) {
            const updatedAltModul = {
                name: this.altModulName,
                moduller: this.selectedModuller
            };

            this.paketService.updateAltModul(this.selectedAltModulId, updatedAltModul.name, updatedAltModul.moduller).pipe(
                catchError((error) => {
                    this.notificationService.showNotification(this.translate.instant("failedtoupdatesubmodule"), 'danger', 'top-end');
                    return of(null);
                })
            ).subscribe(response => {
                if (response) {
                    this.notificationService.showNotification(this.translate.instant("submoduleupdatedsuccessfully"), 'success', 'top-end');
                    this.getAltModuller(); // Güncellenmiş alt modülleri listele
                    this.resetFormAltModul(); // Formu sıfırla
                    this.getTreeViewData();

                }
            });
        } else {
            this.notificationService.showNotification(this.translate.instant("pleasefillfields"), 'danger', 'top-end');
        }
    }

    resetFormModul() {
        this.modulName = '';
        this.modulKodu = '';
        this.modulFiyat = 0;
        this.modulYillikFiyat = 0;
        this.modulAktifmi = false;
        this.modulFreemi = false;
        this.selectedPaketler = [];
        this.isUpdating = false; // Güncelleme modundan çıkar
        //  this.accordians3 = false; // Formu kapalı duruma getirebilirsiniz, kullanıcı eklemek istediğinde açabilir
    }

    editModul(modul: any) {
        // Düzenleme işlemi aktif hale getiriliyor
        this.isUpdating = true;
        this.selectedModulId = modul._id;

        // Form alanlarına ilgili modülün verileri atanıyor
        this.modulName = modul.name;
        this.modulKodu = modul.kodu;
        this.modulFiyat = modul.fiyat;
        this.modulYillikFiyat = modul.yillikFiyat;
        this.modulAktifmi = modul.aktifmi;
        this.modulFreemi = modul.freemi;

        // Modülün dahil olduğu paketler seçili hale getiriliyor
        this.selectedPaketler = modul.paket.map((paket: any) => paket._id);

        // Formu açmak için accordion açık hale getiriliyor
        this.accordianToggleModul(true);
    }

    // getModuller() metodunun güncellenmiş hali
    getModuller() {
        this.paketService.getModuller().pipe(
            catchError((error) => {
                this.notificationService.showNotification(this.translate.instant("couldnotfetchmodules"), 'danger', 'top-end');
                return of(null);
            })
        ).subscribe(response => {
            if (response) {
                this.moduller = response.moduller; // Tüm modül verisini al
                this.filterModuller(); // Filtreleme fonksiyonunu çağırarak başlangıçta gösterilecek modülleri ayarla
                this.getTreeViewData();

            }
        });
    }

    filterModuller(): void {
        const search = this.searchTerm.toLowerCase();
        this.filteredModuller = this.moduller.filter(modul => {
            const matchesSearch = modul.name.toLowerCase().includes(search) ||
                modul.kodu.toLowerCase().includes(search) ||
                modul.paket.some((paket: any) => paket.paketAdi.toLowerCase().includes(search));
            const matchesActive = this.showPassive || modul.aktifmi; // Eğer `showPassive` true ise pasifleri de gösterir
            return matchesSearch && matchesActive;
        });
    }

    editAltModul(altModul: any) {
        this.isAltUpdating = true;
        this.selectedAltModulId = altModul._id; // Güncellenecek Alt Modül ID'si

        // Form alanlarına ilgili alt modülün verileri atanıyor
        this.altModulName = altModul.name;
        this.selectedModuller = altModul.modul.map((modul: any) => modul._id);

        // Formu açmak için accordion açık hale getiriliyor
        this.accordianToggleAltModul(true);
    }

    // Alt Modul Formu Sıfırla
    resetFormAltModul() {
        this.isAltUpdating = false;
        this.altModulName = '';
        this.selectedModuller = [];
        this.accordianToggleAltModul(false);
    }

    // Alt Modulleri Filtreleme
    filterAltModuller() {
        this.filteredAltModuller = this.altModuller.filter((altModul: any) => {
            const matchesSearchTerm = this.searchTermAltModul
                ? altModul.name.toLowerCase().includes(this.searchTermAltModul.toLowerCase())
                : true;

            // Pasif kontrolü: Eğer showPassiveAltModul false ise yalnızca aktif modüller gösterilir.
            const matchesPassiveFilter = this.showAltPassive
                ? true // Pasifleri göster (hepsini göster)
                : altModul.modul.some((modul: any) => modul.aktifmi); // Yalnızca aktif olan modülleri göster

            return matchesSearchTerm && matchesPassiveFilter;
        });
    }

    // Alt Modul Accordion Toggle
    accordianToggleAltModul(open?: boolean) {
        this.accordiansAltModul = open !== undefined ? open : !this.accordiansAltModul;
    }

    // getAltModuller() metodunun güncellenmiş hali
    getAltModuller() {
        this.paketService.getAltModul().pipe(
            catchError((error) => {
                this.notificationService.showNotification(this.translate.instant("couldnotfetchsubmodules"), 'danger', 'top-end');
                return of(null);
            })
        ).subscribe(response => {
            if (response) {
                this.altModuller = response.altModuller; // Tüm alt modül verisini al
                this.filterAltModuller(); // Filtreleme fonksiyonunu çağırarak başlangıçta gösterilecek alt modülleri ayarla
            }
        });
    }

    // getSayfalar() metodunun güncellenmiş hali
    getSayfalar() {
        this.paketService.getSayfa().pipe(
            catchError((error) => {
                this.notificationService.showNotification(this.translate.instant("couldnotfetchsayfalar"), 'danger', 'top-end');
                return of(null);
            })
        ).subscribe(response => {
            if (response) {
                this.sayfalar = response.sayfalar;
                this.filterSayfalar();  // Filtreleme fonksiyonunu çağırarak başlangıçta gösterilecek sayfaları ayarla
            }
        });
    }

    filterSayfalar() {
        this.filteredSayfalar = this.sayfalar.filter(sayfa => {
            // Arama terimini kontrol etme (eğer kullanıcı bir terim girdi ise)
            const matchesSearchTerm = this.searchTermSayfa
                ? sayfa.name.toLowerCase().includes(this.searchTermSayfa.toLowerCase()) ||
                sayfa.kod.toLowerCase().includes(this.searchTermSayfa.toLowerCase())
                : true;

            // Pasif kontrolü: Eğer showPassiveSayfa false ise yalnızca aktif sayfalar gösterilir
            const matchesPassiveFilter = this.showPassiveSayfa
                ? true // Eğer showPassiveSayfa true ise hepsini göster
                : sayfa.aktifmi; // Eğer false ise sadece aktif olan sayfaları göster

            return matchesSearchTerm && matchesPassiveFilter;
        });
    }

    // paketModulRelation() metodunun güncellenmiş hali
    paketModulRelation() {
        if (this.selectedPaket && this.selectedModul) {
            this.paketService.paketModulRelation(this.selectedPaket, this.selectedModul).pipe(
                catchError((error) => {
                    this.notificationService.showNotification(this.translate.instant("failedtorelatepackageandmodule"), 'danger', 'top-end');
                    return of(null);
                })
            ).subscribe(response => {
                if (response) {
                    this.notificationService.showNotification(this.translate.instant("packageandmodulerelatedsuccessfully"), 'success', 'top-end');
                    this.clearPaketForm();
                }
            });
        } else {
            this.notificationService.showNotification(this.translate.instant("pleasefillfields"), 'danger', 'top-end');
        }
    }

    // modulAltModulRelation() metodunun güncellenmiş hali
    modulAltModulRelation() {
        if (this.selectedAltModul && this.selectedModul) {
            this.paketService.modulAltModulRelation(this.selectedModul, this.selectedAltModul).pipe(
                catchError((error) => {
                    this.notificationService.showNotification(this.translate.instant("failedtorelatemoduleandsubmodule"), 'danger', 'top-end');
                    return of(null);
                })
            ).subscribe(response => {
                if (response) {
                    this.notificationService.showNotification(this.translate.instant("moduleandsubmolerelatedsuccessfully"), 'success', 'top-end');
                    this.clearPaketForm();
                }
            });
        } else {
            this.notificationService.showNotification(this.translate.instant("pleasefillfields"), 'danger', 'top-end');
        }
    }

    // altModulSayfaRelation() metodunun güncellenmiş hali
    altModulSayfaRelation() {
        if (this.selectedAltModul && this.selectedSayfa) {
            this.paketService.altModulSayfaRelation(this.selectedAltModul, this.selectedSayfa).pipe(
                catchError((error) => {
                    this.notificationService.showNotification(this.translate.instant("failedtorelatesubmoduleandpage"), 'danger', 'top-end');
                    return of(null);
                })
            ).subscribe(response => {
                if (response) {
                    this.notificationService.showNotification(this.translate.instant("submoduleandpagerelatedsuccessfully"), 'success', 'top-end');
                    this.clearPaketForm();
                }
            });
        } else {
            this.notificationService.showNotification(this.translate.instant("pleasefillfields"), 'danger', 'top-end');
        }
    }
}


