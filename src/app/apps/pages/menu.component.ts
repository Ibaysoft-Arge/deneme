import { AfterViewInit, ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, FormControl, AbstractControl } from '@angular/forms';
import { NotificationService } from '../NotificationService';
import { UrunService } from 'src/app/service/UrunService';
import { slideDownUp, toggleAnimation } from 'src/app/shared/animations';
import { MenuService } from 'src/app/service/menu.service';
import { TranslateService } from '@ngx-translate/core';
import { ClusterService } from 'src/app/service/cluster.service';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import 'intro.js/introjs.css';
import { IntroJs } from 'intro.js/src/intro';
import introJs from 'intro.js';
import GLightbox from 'glightbox';

interface Category {
    _id: string;
    ad: string;
    createdAt?: string;
    updatedAt?: string;
    [key: string]: any;
}

@Component({
    selector: 'app-menu',
    templateUrl: './menu.component.html',
    animations: [toggleAnimation, slideDownUp],
})
export class MenuComponent implements OnInit, AfterViewInit {
    intro!: IntroJs;
    menus: any[] = [];
    urunler: any[] = [];
    clusters: any[] = []; // Cluster verileri için dizi
    menuForm: FormGroup;
    editMode = false;
    isFormOpen = true;
    activeTab: string = 'genel';
    selectedMenuId: string | null = null;
    modalSearchTerm: string = '';
    filteredUrunler: any[] = [];
    selectedItems: any[] = [];
    menuSearchTerm: string = '';
    filteredMenus: any[] = [];
    days: string[] = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
    accordionState: { [key: number]: { [key: number]: boolean } } = {};
    @ViewChild('menuSearchModal') menuSearchModal!: any;
    selectedCategoryControl = new FormControl('');
    @ViewChild('urunModal') urunModal!: any;
    @ViewChild('previewModal') previewModal!: any;
    groupedProducts: Map<string, any[]> = new Map<string, any[]>(); // groupedProducts özelliği eklendi
    sortableOptions: any = {
        animation: 200,
        handle: '.drag-handle',
        onEnd: (event: any) => {
            const { oldIndex, newIndex } = event;
            if (oldIndex !== newIndex) {
                // selectedItems güncelleniyor
                const movedItem = this.selectedItems.splice(oldIndex, 1)[0];
                this.selectedItems.splice(newIndex, 0, movedItem);

                // FormArray güncelleniyor
                const formArray = this.items;
                const movedControl = formArray.at(oldIndex);
                formArray.removeAt(oldIndex);
                formArray.insert(newIndex, movedControl);

                this.cdr.detectChanges();

                console.log('Güncel selectedItems:', this.selectedItems);
                console.log('Güncel FormArray:', formArray.controls.map(c => c.value));
            }
        },
    };
    constructor(
        private menuService: MenuService,
        private urunService: UrunService,
        private fb: FormBuilder,
        private cdr: ChangeDetectorRef, // ChangeDetectorRef eklendi
        private notificationService: NotificationService,
        private translate: TranslateService,
        private clusterService: ClusterService,
    ) {
        this.menuForm = this.fb.group({
            ad: ['', Validators.required],
            aciklama: [''],
            items: this.fb.array([]),
        });



    }

    setActiveTab(tabName: string): void {
        this.activeTab = tabName;
    }

    openPreviewModal(): void {
        this.groupProductsByKategori(); // Kategorilere göre gruplama işlemini yap
        this.previewModal.open(); // Modal'ı aç
    }
    groupProductsByKategori(): void {
        const groups = new Map<string, any[]>();

        this.selectedItems.forEach((product) => {
            const kategori = product.urunKategori?.ad || 'Diğer'; // Ürün kategorisi varsa adını al, yoksa "Diğer"
            if (!groups.has(kategori)) {
                groups.set(kategori, []);
            }
            groups.get(kategori)!.push(product);
        });

        this.groupedProducts = groups;
        console.log('Grouped by Kategori:', Array.from(this.groupedProducts.entries())); // Kontrol için
    }

    closePreviewModal(): void {
        this.previewModal.close();
    }
    ngOnInit(): void {
        this.loadMenus();
        this.loadClusters();
        //  this.startIntro();
        const tourCompleted = localStorage.getItem('menuTourCompleted');
        if (!tourCompleted) {
          //   this.startIntro();
        } else {
            // console.log('Kullanıcı turu zaten tamamlamış.');
        }



    }

    startIntro(): void {
        this.intro = introJs();
        this.intro.setOptions({
            steps: [
                {
                    element: '#step1',
                    intro: 'Buradan alandan fiyat listelerinizi görebilirsiniz.',
                    position: 'bottom'
                },
                {
                    element: '#step2',
                    intro: 'Buradan alandan fiyat listelerinize açıklama yazabilirsiniz',
                    position: 'right'
                },
                {
                    element: '#step3',
                    intro: 'Bu alandan istediğiniz fiyat listesini seçtikten sonra ürün eklemesi yapabilirsiniz.',
                    position: 'left'
                }


            ],
            showButtons: true,
            showBullets: false, // Alt nokta kontrolünü kaldır
            showStepNumbers: true,
            //  skipLabel: '<span style="font-weight: bold;">Tamamla👋</span>', // Daha farklı bir ifade
            doneLabel: 'Tur Tamamlandı',
            nextLabel: 'İleri',
            prevLabel: 'Geri',

        });


        this.intro.onexit(() => {
            // Kullanıcı turu "Biliyorum" diyerek geçerse
            console.log('Kullanıcı turu tamamlamadan çıktı.');
            this.markTourAsCompleted();
        });

        this.intro.oncomplete(() => {
            // Kullanıcı turu tamamladı
            console.log('Kullanıcı turu tamamladı.');
            this.markTourAsCompleted();
        });

        this.intro.start();
    }

    markTourAsCompleted(): void {
        // Kullanıcı bu turu tamamladı olarak işaretleyin
        localStorage.setItem('urunTourCompleted', 'true');
    }



    loadClusters(): void {
        this.clusterService.getClusters().subscribe(
            (data) => {
                this.clusters = data;
                this.cdr.detectChanges();
            },
            (error) => this.notificationService.showNotification(this.translate.instant("clusterdatascouldnotbeload"), 'error', 'topRight')
        );
    }

    loadMenus(): void {
        this.menuService.getMenus().subscribe(
            (data) => {
                this.menus = data;
                this.cdr.detectChanges();
            },
            (error) => this.notificationService.showNotification(this.translate.instant("menuscouldnotbeloaded"), 'error', 'topRight')
        );
    }

    toggleAccordion(itemIndex: number, fiyatIndex: number) {
        if (!this.accordionState[itemIndex]) {
            this.accordionState[itemIndex] = {};
        }
        this.accordionState[itemIndex][fiyatIndex] = !this.accordionState[itemIndex][fiyatIndex];
    }

    isAccordionOpen(itemIndex: number, fiyatIndex: number): boolean {
        return this.accordionState[itemIndex] && this.accordionState[itemIndex][fiyatIndex];
    }

    get items(): FormArray {
        return this.menuForm.get('items') as FormArray;
    }

    openUrunModal(): void {
        this.filteredUrunler = [];
        this.modalSearchTerm = '';
        this.urunModal.open();
        this.cdr.detectChanges();
    }

    searchUrunler(): void {
        if (!this.modalSearchTerm) {
            this.filteredUrunler = [];
        } else {
            this.urunService.searchUruns(this.modalSearchTerm).subscribe({
                next: (data) => {
                    this.filteredUrunler = data;
                    this.cdr.detectChanges();
                },
                error: (error) => {
                    console.error('Arama yapılırken hata oluştu:', error);
                }
            });
        }
    }

    addItem(): void {
        const newItem = this.fb.group({
            urun: ['', Validators.required],
            fiyat: [0, Validators.required],
            fiyatBilgisi: this.fb.array([]),
        });
        this.items.push(newItem);
        this.selectedItems.push({ name: 'Yeni Ürün' });
        this.cdr.detectChanges();
    }
    addItemFromModal(urun: any): void {
        const itemGroup = this.fb.group({
            urun: [urun._id, Validators.required],
            fiyat: [urun.standartFiyat || 0, Validators.required],
            fiyatBilgisi: this.fb.array([]),
        });
        this.items.push(itemGroup);

        // Eksik özellikleri kontrol ederek ekle
        const product = {
            urunAdi: urun.urunAdi || 'Bilinmeyen Ürün',
            urunKategori: urun.urunKategori || { ad: 'Bilinmeyen Kategori' },
            urunAltKategori: urun.urunAltKategori || { ad: 'Bilinmeyen Alt Kategori' },
            urunResmi: urun.urunResmi || null,
            ...urun, // Diğer alanlar
        };

        this.selectedItems.push(product);
        this.cdr.detectChanges();
        this.urunModal.close();
    }

    // getImageUrl(item: any): string | null {
    //     // Eğer item null veya undefined ise direkt null döndür
    //     if (!item || !item.urunResmi) {
    //         return null;
    //     }

    //     const invalidValues = ["d", "null", "undefined", "", " "]; // Hatalı değerler listesi
    //     const base64Pattern = /^data:image\/(png|jpeg|jpg|gif);base64,/; // Base64 formatını algılayan regex

    //     // Eğer geçersiz bir değer varsa veya base64 değilse null döndür
    //     if (invalidValues.includes(item.urunResmi.trim()) || !base64Pattern.test(item.urunResmi.trim())) {
    //         return null;
    //     }

    //     // Geçerli bir base64 resim varsa döndür
    //     return item.urunResmi;
    // }

    getImageUrl(product: any): string | null {
       
        if (product?.urunResmi) {
            return product.urunResmi; 
        }
        return null; 
    }


    removeSelectedItem(index: number): void {
        this.items.removeAt(index);
        this.selectedItems.splice(index, 1);
        this.cdr.detectChanges();
    }



    addFiyatBilgisi(itemIndex: number): void {
        const fiyatBilgisiArray = this.getFiyatBilgisiControls(itemIndex);
        const fiyatBilgisiGroup = this.fb.group({
            fiyat: [0, Validators.required],
            baslangicSaati: [''],
            bitisSaati: [''],
            gunler: [[]],
            cluster: [''],
        });
        fiyatBilgisiArray.push(fiyatBilgisiGroup);
        this.cdr.detectChanges();
    }

    removeFiyatBilgisi(itemIndex: number, fiyatBilgisiIndex: number): void {
        const fiyatBilgisiArray = this.getFiyatBilgisiControls(itemIndex);
        fiyatBilgisiArray.removeAt(fiyatBilgisiIndex);
        this.cdr.detectChanges();
    }

    getFiyatBilgisiControls(itemIndex: number): FormArray {
        return this.items.at(itemIndex).get('fiyatBilgisi') as FormArray;
    }

    addMenu(): void {
        if (this.menuForm.invalid) return;

        this.menuService.addMenu(this.menuForm.value).subscribe(
            (response) => {
                this.menus.push(response);
                this.notificationService.showNotification(this.translate.instant("menuaddedsuccessfully"), 'success', 'topRight');
                this.resetForm();
                this.loadMenus();
                this.cdr.detectChanges();
            },
            (error) => this.notificationService.showNotification(this.translate.instant("failedtoaddmenu"), 'error', 'topRight')
        );
    }

    editMenu(menu: any): void {
        this.editMode = true;
        this.selectedMenuId = menu._id;

        this.menuForm.patchValue({
            ad: menu.ad,
            aciklama: menu.aciklama,
        });

        this.items.clear();
        this.selectedItems = menu.items.map((item: any) => item.urun);



        menu.items.forEach((item: any) => {
            const itemGroup = this.fb.group({
                urun: [item.urun._id, Validators.required],
                fiyat: [item.fiyat, Validators.required],
                fiyatBilgisi: this.fb.array([]),
            });

            const fiyatBilgisiArray = itemGroup.get('fiyatBilgisi') as FormArray;
            item.fiyatBilgisi.forEach((fiyatBilgi: any) => {
                const fiyatBilgiGroup = this.fb.group({
                    fiyat: [fiyatBilgi.fiyat, Validators.required],
                    baslangicSaati: [fiyatBilgi.baslangicSaati],
                    bitisSaati: [fiyatBilgi.bitisSaati],
                    gunler: [fiyatBilgi.gunler],
                    cluster: [fiyatBilgi.cluster],
                });
                fiyatBilgisiArray.push(fiyatBilgiGroup);
            });

            this.items.push(itemGroup);
        });

        this.menuForm.markAsDirty();
        this.menuSearchModal.close();
        this.cdr.detectChanges();
    }

    updateFiyat(itemIndex: number, event: Event): void {
        const inputValue = (event.target as HTMLInputElement).value;
        this.items.at(itemIndex).get('fiyat')?.setValue(Number(inputValue));
        this.cdr.detectChanges();
    }

    updateMenu(): void {
        if (this.menuForm.invalid || !this.selectedMenuId) return;



        const updatedMenu = this.menuForm.value;

        // Cluster kontrolü: Boş stringleri `null` olarak değiştir
        updatedMenu.items.forEach((item: any) => {
            if (item.fiyatBilgisi) {
                item.fiyatBilgisi.forEach((fiyat: any) => {
                    if (fiyat.cluster === "") {
                        fiyat.cluster = null; // Boş string yerine `null` kullan
                    }
                });
            }
        });

        this.menuService.updateMenu(this.selectedMenuId, this.menuForm.value).subscribe(
            (response) => {
                const index = this.menus.findIndex((m) => m._id === this.selectedMenuId);
                this.menus[index] = response;
                this.notificationService.showNotification(this.translate.instant("menuupdated"), 'success', 'topRight');
                //  this.resetForm();
                //    this.loadMenus();
                this.cdr.detectChanges();
            },
            (error) => this.notificationService.showNotification(this.translate.instant("failedtoupdatemenu"), 'error', 'topRight')
        );
    }









    deleteMenu(id: string): void {
        this.menuService.deleteMenu(id).subscribe(
            () => {
                this.menus = this.menus.filter((m) => m._id !== id);
                this.notificationService.showNotification(this.translate.instant("menudeleted"), 'success', 'topRight');
                this.cdr.detectChanges();
            },
            (error) => this.notificationService.showNotification(this.translate.instant("failedtodeletemenu"), 'error', 'topRight')
        );
    }

    resetForm(): void {
        this.editMode = false;
        this.selectedMenuId = null;
        this.menuForm.reset();
        this.items.clear();
        this.selectedItems = [];

        this.cdr.detectChanges();
    }

    openMenuSearchModal(): void {
        this.menuSearchTerm = '';
        this.filteredMenus = this.menus;
        this.menuSearchModal.open();
    }

    searchMenus(): void {
        this.filteredMenus = this.menus.filter(menu =>
            menu.ad.toLowerCase().includes(this.menuSearchTerm.toLowerCase())
        );
    }

    selectMenu(menu: any): void {
        this.menuForm.patchValue({
            ad: menu.ad,
            aciklama: menu.aciklama
        });
        this.menuSearchModal.close();

    }
    ngAfterViewInit(): void {
        const lightbox = GLightbox({
            selector: '.glightbox' // Replace with your selector as needed
        });
    }

}
