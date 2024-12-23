import { Component, OnInit } from '@angular/core';
import { fadeInAnimation, toggleAnimation, slideDownUp } from 'src/app/shared/animations';
import { Router, ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { AppService } from 'src/app/service/app.service';
import { Base64Service } from '../service/base64.service';
import { MagazaService } from '../service/magaza.service';
import { OrderService } from 'src/app/service/order.service';
import { MenuService } from 'src/app/service/menu.service';
import { UserService } from 'src/app/service/user.service';

@Component({
    templateUrl: './qrmenu.html',
    animations: [toggleAnimation, slideDownUp],
})
export class QrMenuComponent implements OnInit {
    store: any;
    menuParam: string | null = null;
    clusterID = '';
    selectedMenuId = '';

    magazaID = '';
    userID = '';

    avatar = '';

    loading = false;

    category: any[] = [];
    products: any[] = [];
    selectedCategoryId: number | null = null;
    selectedCategory: { kategoriId: string; kategoriAdi: string } | null = null;
    groupedProducts: Map<string, any[]> = new Map<string, any[]>();

    constructor(
        public translate: TranslateService,
        public storeData: Store<any>,
        public router: Router,
        private activatedRoute: ActivatedRoute,
        private appSetting: AppService,
        private base64Service: Base64Service,
        private magazaService: MagazaService,
        private orderService: OrderService,
        private menuService: MenuService,
        private userService: UserService,
    ) {}

    ngOnInit(): void {
        this.initializeQueryParams();
        this.loadInitialData();
    }

    private initializeQueryParams(): void {
        this.activatedRoute.queryParams.subscribe((params) => {
            this.menuParam = params['menu'] || null;
            console.log('Menu Param:', this.menuParam);
        });
    }

    private loadInitialData(): void {
        if (!this.menuParam) return;

        let gelenParametreler = this.base64Service.decodeFromBase64(this.menuParam).split(',');

        this.magazaID = gelenParametreler[0];
        this.userID = gelenParametreler[1];

        this.userService.getUserAvatarbyId(this.userID).subscribe((data) => {
            this.avatar = data;
        });

        this.magazaService.getClusterByMagazaID(this.magazaID, this.userID).subscribe((data) => {
            this.clusterID = data.cluster;
        });

        this.orderService.getSatisKaynakForQR('masa', this.userID).subscribe((data) => {
            console.log('Geldi');
            if (data.length > 0 && data[0].menuler.length > 0) {
                console.log('Girdi');
                this.selectedMenuId = data[0].menuler[0];

                console.log('Menu ID : ', this.selectedMenuId);
                this.loadCategories(this.selectedMenuId);
            }
        });
    }

    initStore(): void {
        this.storeData
            .select((d) => d.index)
            .subscribe((d) => {
                this.store = d;
            });
    }

    changeLanguage(language: any): void {
        this.translate.use(language.code);
        this.appSetting.toggleLanguage(language);

        const direction = this.store.locale?.toLowerCase() === 'ae' ? 'rtl' : 'ltr';
        this.storeData.dispatch({ type: 'toggleRTL', payload: direction });
        window.location.reload();
    }

    loadCategories(menuId: string): void {
        this.menuService.getProductCategoriesForQR(menuId, this.userID).subscribe(
            (data) => {
                this.category = data;
                this.selectedCategory = this.category.length > 0 ? this.category[0] : null;
                this.loadProductsByCategory();
            },
            (error) => {
                console.error('Error loading categories:', error);
                this.category = [];
                this.selectedCategory = null;
            },
        );
    }

    loadProductsByCategory(): void {
        if (!this.selectedCategory || !this.selectedMenuId) return;

        this.menuService.getDynamicPricingByMenuForQR(this.selectedMenuId, this.selectedCategory.kategoriId, this.userID, this.clusterID).subscribe(
            (data) => {
                this.products = data;
                this.groupProductsByAltKategori();
            },
            (error) => {
                console.error('Error loading products:', error);
            },
        );
    }

    filterByCategory(category: { kategoriId: string; kategoriAdi: string }): void {
        this.selectedCategory = category;
        this.loadProductsByCategory();
    }

    groupProductsByAltKategori(): void {
        const groups = new Map<string, any[]>();

        this.products.forEach((product) => {
            const altKategori = product.urunAltKategori || 'Diğer';
            if (!groups.has(altKategori)) {
                groups.set(altKategori, []);
            }
            groups.get(altKategori)!.push(product);
        });

        this.groupedProducts = groups;
        console.log('Grouped Products:', this.groupedProducts);
    }

    // getImageUrl(product: any): string | null {
    //     if (!product || !product.urunResmi) return null;

    //     const invalidValues = ['d', 'null', 'undefined', '', ' '];
    //     const base64Pattern = /^data:image\/(png|jpeg|jpg|gif);base64,/;

    //     if (invalidValues.includes(product.urunResmi.trim()) || !base64Pattern.test(product.urunResmi.trim())) {
    //         return null;
    //     }

    //     return product.urunResmi;
    // }

    getImageUrl(product: any): string | null {
       
        if (product?.urunResmi) {
            return product.urunResmi; 
        }
        return null; 
    }

    getAvatarImageUrl(avatar: any): string | null {
        if (!avatar) return null;

        const invalidValues = ['d', 'null', 'undefined', '', ' '];
        const base64Pattern = /^data:image\/(png|jpeg|jpg|gif);base64,/;

        if (invalidValues.includes(avatar.trim()) || !base64Pattern.test(avatar.trim())) {
            return null;
        }

        return avatar;
    }
}
