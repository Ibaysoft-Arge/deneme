import { AfterViewInit, Component, OnInit } from '@angular/core';
import { RecipeService } from 'src/app/service/RecipeService';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { toggleAnimation, slideDownUp } from 'src/app/shared/animations';
import Swal from 'sweetalert2';
import { SkuService } from 'src/app/service/sku.service';
import { TranslateService } from '@ngx-translate/core';
import 'intro.js/introjs.css';
import { IntroJs } from 'intro.js/src/intro';
import introJs from 'intro.js';
import { UrunService } from 'src/app/service/UrunService';
import GLightbox from 'glightbox';
@Component({
    selector: 'app-recipe',
    templateUrl: './recipe.html',
    animations: [toggleAnimation, slideDownUp],
})
export class RecipeComponent implements OnInit,AfterViewInit {
    intro!: IntroJs;
    recipes: any[] = [];
    skus: any[] = [];
    uruns: any[] = [];
    kategoriler: any[] = [];
    altKategoriler: any[] = [];
    recipeForm: FormGroup;
    isEditing: boolean = false;
    editingRecipeId: string | null = null;
    activeTab: string = 'genel';
    searchTerm: string = '';
    selectedCategory: string = '';
    selectedSubCategory: string = '';
    kategoriByFilter: string=""
    altKategoriByFilter: string=""
    isFormOpen: boolean = false;
    validUnits: string[] = ['adet', 'kg', 'litre', 'paket', 'kutu', 'metre'];
    cols: any[] = [];
    filteredRecipes: any[] = [];
    itemsPerPage: number = 3;
    selectedUrun :string= "";

    setColumnTitles(): void {
        const currentLang = this.translate.currentLang;
        this.cols = [
            { field: 'actions', title: this.translate.instant('transactions'), slot: 'actions' },
            { field: 'urunKodu', title: this.translate.instant('productcode') },
            { field: 'urunAdi', title: this.translate.instant('productname') },
            { field: 'kategori.ad', title: this.translate.instant('category') },
            { field: 'altKategori.ad', title: this.translate.instant('subcategory') },
            { field: 'rafOmruGun', title: this.translate.instant('shelflife') },
            { field: 'hazirlanmaSuresiDakika', title: this.translate.instant('preparationtime') },
            { field: 'pisirmeSuresiDakika', title: this.translate.instant('cookingtime') },
        ];
    }

    constructor(
        private recipeService: RecipeService,
        private urunService: UrunService,
        private skuService: SkuService,
        private fb: FormBuilder,
        private translate: TranslateService
    ) {
        this.recipeForm = this.fb.group({
            urunKodu: ['', Validators.required],
            urunAdi: ['', Validators.required],
            aciklama: [''],
            hazirlanmaSuresiDakika: [0, Validators.required],
            pisirmeSuresiDakika: [0, Validators.required],
            rafOmruGun: [0, Validators.required],
            kategori: ['', Validators.required],
            altKategori: ['', Validators.required],
            items: this.fb.array([]),
            urunItems: this.fb.array([]),
        });

        this.setColumnTitles();

        this.translate.onLangChange.subscribe(() => {
            this.setColumnTitles();
        });
    }
    addUrunItem(): void {
        const urunItemGroup = this.fb.group({
            urun: [this.selectedUrun, Validators.required],
            miktar: [1, Validators.required],
            birim: ['', Validators.required],
        });

        // Dinamik değer değişikliğinde sıfırlama
        urunItemGroup.get('urunTipi')?.valueChanges.subscribe(() => {
            urunItemGroup.get('urun')?.setValue('');
        });

        this.urunItems.push(urunItemGroup);
    }

    // Belirli bir urunItem kaldırma
    removeUrunItem(index: number): void {
        this.urunItems.removeAt(index);
    }

    ngOnInit(): void {
        this.loadRecipes();
        this.loadSKUs();
        this.loadKategoriler();
        this.loadUruns();

        //  this.startIntro();
        const tourCompleted = localStorage.getItem('recipeTourCompleted');
        if (!tourCompleted) {
            //this.startIntro();
        } else {
            // console.log('Kullanıcı turu zaten tamamlamış.');
        }
    }

   // Filtreleme işlemi
   applyFilter(): void {
    let filtered = [...this.recipes];  // Orijinal tarifler üzerinde işlem yapalım

    // Kategori filtresi (Tümü veya kategori seçimi)
    if (this.kategoriByFilter && this.kategoriByFilter !== 'all') {
        filtered = filtered.filter(recipe => recipe.kategori?._id == this.kategoriByFilter);
    }

    // Alt kategori filtresi (Tümü veya alt kategori seçimi)
    if (this.altKategoriByFilter && this.altKategoriByFilter !== 'all') {
        filtered = filtered.filter(recipe => recipe.altKategori?._id == this.altKategoriByFilter);
    }

    // Arama filtresi
    if (this.searchTerm) {
        filtered = filtered.filter(recipe => recipe.urunAdi.toLowerCase().includes(this.searchTerm.toLowerCase()));
    }

    // Filtrelenmiş tarifleri güncelle
    this.filteredRecipes = filtered;
}

    startIntro(): void {
        this.intro = introJs();
        this.intro.setOptions({
            steps: [
                {
                    element: '#step1',
                    intro: 'Buradan reçetelerinizi görebilir ve yönetebilirsiniz.Reçete ekle butonuna basarak devam edebilirsiniz',
                    position: 'bottom'
                },

                {
                    element: '#step2',
                    intro: 'Reçeteleriniz içersine stok eklemelerini yapabilirsiniz.',
                    position: 'bottom'
                },
                {
                    element: '#step3',
                    intro: 'Reçeteleriniz içersine stok eklemelerini yapabilirsiniz.',
                    position: 'bottom'
                },

                {
                    element: '#step4',
                    intro: 'Bu alandan ürünleriniz için değişiklikler yapabilirsiniz.',
                    position: 'bottom'
                },
                {
                    element: '#step5',
                    intro: 'Bu alanda reçetelerinizi görebilir ve yönetebilirsiniz..',
                    position: 'bottom'
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




        this.intro.onchange((element) => {
            const currentStep = this.intro._currentStep; // Mevcut adımı alır
            this.setActiveTab('genel');
            if (currentStep === 1) {
                this.isFormOpen = true;
            }
            if (currentStep === 2) {
                // 0 tabanlı index (step3 = index 2)
                this.setActiveTab('items'); // 'items' sekmesini aktif hale getirir
            } else if (currentStep === 3) {
                // 0 tabanlı index (step4 = index 3)
                this.setActiveTab('urunItems'); // 'odemetipi' sekmesini aktif hale getirir
            }

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
        localStorage.setItem('recipeTourCompleted', 'true');

    }

    loadRecipes(): void {
        this.recipeService.getRecipes().subscribe({
            next: (data) => {

                this.recipes = data;
                this.filteredRecipes = data;
                // this.recipes = data.map(recipe => {
                //     recipe.hasUnwantedItems = recipe.items?.some((item: any) => item.istenmeyen);
                //     return recipe;
                // });
            },
            error: (error) => {
                console.error('Reçeteler yüklenirken hata oluştu:', error);
            }
        });
    }

    formatDate(dateString: string): string {
        const date = new Date(dateString);
        const year = date.getFullYear(); // Yıl
        const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Ay (0'dan başlıyor, bu yüzden 1 ekliyoruz)
        const day = date.getDate().toString().padStart(2, '0'); // Gün

        return `${year}-${month}-${day}`; // yyyy-MM-dd formatında döndürüyoruz
    }

    // SKU'ları yükle
    loadSKUs(): void {
        this.skuService.getSKUs().subscribe({
            next: (data) => {
                this.skus = data;
            },
            error: (error) => {
                console.error('SKU yüklenirken hata oluştu:', error);
                this.showNotification(this.translate.instant("thereisanerroronloadingskus"), 'top-end');
            }
        });
    }

    // Kategorileri yükle
    loadKategoriler(): void {
        this.skuService.getKategoriler().subscribe({
            next: (data) => {
                this.kategoriler = data;
                
            },
            error: (error) => {
                console.error('Kategori yüklenirken hata oluştu:', error);
                this.showNotification(this.translate.instant("thereisanerroronloadingcategories"), 'top-end');
            }
        });
    }

        // SKU'ları yükle
        loadUruns(): void {
            this.urunService.getUrunler().subscribe({
                next: (data) => {
                    this.uruns = data;
                },
                error: (error) => {
                    console.error('Urun yüklenirken hata oluştu:', error);
                    this.showNotification(this.translate.instant("thereisanerroronloadingskus"), 'top-end');
                }
            });
        }

    // Alt kategorileri yükle
    loadAltKategoriler(kategoriId: string): void {
        this.skuService.getAltKategorilerByKategoriId(kategoriId).subscribe({
            next: (data) => {
                this.altKategoriler = data;
            },
            error: (error) => {
                console.error('Alt kategori yüklenirken hata oluştu:', error);
                this.showNotification(this.translate.instant("thereisanerroronloadingsubcategories"), 'top-end');
            }
        });
    }

    // Kategori değiştiğinde alt kategorileri yükle
    onCategoryChange(): void {
        const selectedCategoryId = this.recipeForm.get('kategori')?.value;
        if (selectedCategoryId) {
            this.loadAltKategoriler(selectedCategoryId);
        } else {
            this.altKategoriler = [];
        }
    }

    // Yeni reçete ekle veya güncelle
    saveRecipe(): void {
        if (this.recipeForm.valid) {
            const recipeData = this.recipeForm.value;
            if (this.isEditing && this.editingRecipeId) {
                // Güncelleme işlemi
                this.recipeService.updateRecipe(this.editingRecipeId, recipeData).subscribe({
                    next: () => {
                        this.showNotification(this.translate.instant("recipeupdatedsuccessfully"), 'top-end');
                        this.resetForm();
                        this.loadRecipes();
                    },
                    error: (error) => {
                        console.error('Reçete güncellenirken hata oluştu:', error);
                        this.showNotification(this.translate.instant("erroronupdatingrecipe"), 'top-end');
                    }
                });
            } else {
                // Ekleme işlemi
                this.recipeService.addRecipe(recipeData).subscribe({
                    next: () => {
                        this.showNotification(this.translate.instant("recipeaddedsuccessfully"), 'top-end');
                        this.resetForm();
                        this.loadRecipes();
                    },
                    error: (error) => {
                        console.error('Reçete eklenirken hata oluştu:', error);
                        this.showNotification(this.translate.instant("erroronaddingrecipe"), 'top-end');
                    }
                });
            }
        } else {
            this.showNotification(this.translate.instant("pleasefillallrequiredfields"), 'top-end');
        }
    }

    openAddKategoriModal(): void {
        // Açılır pencere için kullanıcıya kategori ekleme formu gösterilir
        const yeniKategori = prompt(this.translate.instant("addnewcategoryname"));

        if (yeniKategori) {
            this.addKategori(yeniKategori);
        }
    }

    // Yeni alt kategori ekleme
    addAltKategori(kategoriId: string, ad: string): void {
        this.skuService.addAltKategori({ kategori: kategoriId, ad }).subscribe({
            next: (altKategori) => {
                this.altKategoriler.push(altKategori);
                this.showNotification(this.translate.instant("subcategoryaddedsuccessfully"), 'top-end');
            },
            error: (error) => {
                console.error('Alt Kategori ekleme hatası:', error);
                this.showNotification(this.translate.instant("thereisanerroronaddingsubcategory"), 'top-end');
            }
        });
    }

    // Yeni alt kategori ekleme modal'ını açma
    openAddAltKategoriModal(): void {
        if (!this.recipeForm.get('kategori')?.value) {
            alert(this.translate.instant("firstselectcategory"));
            return;
        }
        const yeniAltKategori = prompt(this.translate.instant("enternewsubcategoryname"));
        if (yeniAltKategori) {
            const kategoriId = this.recipeForm.get('kategori')?.value;
            this.addAltKategori(kategoriId, yeniAltKategori);
        }
    }

    addKategori(ad: string): void {
        this.skuService.addKategori({ ad }).subscribe({
            next: (kategori) => {
                this.kategoriler.push(kategori);
                this.showNotification(this.translate.instant("categoryaddedsuccessfuly"), 'top-end');
            },
            error: (error) => {
                console.error('Kategori ekleme hatası:', error);
                this.showNotification(this.translate.instant("erroronaddingcategory"), 'top-end');
            }
        });
    }

    // Reçeteyi düzenle
    editRecipe(recipeId: string): void {
        this.recipeService.getRecipeById(recipeId).subscribe({
            next: (data) => {
                this.isEditing = true;
                this.editingRecipeId = data.recipe._id;

                // Reçete ana bilgilerini forma yükle
                this.recipeForm.patchValue({
                    urunKodu: data.recipe.urunKodu,
                    urunAdi: data.recipe.urunAdi,
                    aciklama: data.recipe.aciklama,
                    hazirlanmaSuresiDakika: data.recipe.hazirlanmaSuresiDakika,
                    pisirmeSuresiDakika: data.recipe.pisirmeSuresiDakika,
                    rafOmruGun: data.recipe.rafOmruGun,
                    kategori: data.recipe.kategori?._id,
                    altKategori: data.recipe.altKategori?._id,
                });

                this.loadAltKategoriler(data.recipe.kategori?._id);

                // Mevcut öğeleri temizle
                this.items.clear();

                // Reçete öğelerini forma yükle
                data.recipeItems.forEach((itemData: any) => {
                    const itemGroup = this.fb.group({
                        itemType: [itemData.itemType, Validators.required],
                        item: [itemData.item?._id || '', Validators.required],
                        miktar: [itemData.miktar, Validators.required],
                        birim: [itemData.birim, Validators.required],
                        istenmeyen: [itemData.istenmeyen, Validators.required],
                    });

                    // itemType değiştiğinde item değerini sıfırla
                    const itemTypeControl = itemGroup.get('itemType');
                    const itemControl = itemGroup.get('item');

                    if (itemTypeControl && itemControl) {
                        itemTypeControl.valueChanges.subscribe(() => {
                            itemControl.setValue('');
                        });
                    }

                    this.items.push(itemGroup);

                });


                data.urunItems.forEach((urunItemData: any) => {
                    const urunItemGroup = this.fb.group({
                        urun: [urunItemData.urun?._id || '', Validators.required],
                        miktar: [urunItemData.miktar, Validators.required],
                        birim: [urunItemData.birim, Validators.required],
                    });
                    this.urunItems.push(urunItemGroup);
                });
            },
            error: (error) => {
                console.error('Reçete öğeleri yüklenirken hata oluştu:', error);
                this.showNotification(this.translate.instant("erroronloadingrecipeitems"), 'top-end');
            }
        });

        this.isFormOpen = true;

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Reçeteyi sil
    deleteRecipe(id: string): void {
        if (confirm(this.translate.instant("areyousuretodeletethisrecipe"))) {
            this.recipeService.deleteRecipe(id).subscribe({
                next: () => {
                    this.showNotification(this.translate.instant("recipedeletedsuccessfully"), 'top-end');
                    this.loadRecipes();
                },
                error: (error) => {
                    console.error('Reçete silinirken hata oluştu:', error);
                    this.showNotification(this.translate.instant("errorondeletingrecipe"), 'top-end');
                }
            });
        }
    }

    // Formu sıfırla
    resetForm(): void {
        this.recipeForm.reset();
        this.items.clear();
        this.urunItems.clear();
        this.isEditing = false;
        this.editingRecipeId = null;
        this.activeTab = 'genel';
    }
    get urunItems(): FormArray<FormGroup> {
        return this.recipeForm.get('urunItems') as FormArray<FormGroup>;
    }
    // Reçete öğeleri
    get items(): FormArray {
        return this.recipeForm.get('items') as FormArray;
    }

    // Reçete öğesi ekle
    addItem(): void {
        const itemGroup = this.fb.group({
            itemType: ['SKU', Validators.required],
            item: ['', Validators.required],
            miktar: [0, Validators.required],
            birim: ['', Validators.required],
            istenmeyen: [false], // İstenmeyen alanı varsayılan olarak false
        });

        // Ensure controls are not null
        const itemTypeControl = itemGroup.get('itemType');
        const itemControl = itemGroup.get('item');

        if (itemTypeControl && itemControl) {
            itemTypeControl.valueChanges.subscribe(() => {
                itemControl.setValue('');
            });
        }

        this.items.push(itemGroup);
    }

    // Reçete öğesi sil
    removeItem(index: number): void {
        this.items.removeAt(index);
    }

    // Bildirim göster
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

    // Sekme kontrolü
    setActiveTab(tab: string): void {
        this.activeTab = tab;
    }

    isActiveTab(tab: string): boolean {
        return this.activeTab === tab;
    }
    ngAfterViewInit(): void {
        const lightbox = GLightbox({
            selector: '.glightbox' // Replace with your selector as needed
        });
    }
}
