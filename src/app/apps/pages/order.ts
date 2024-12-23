import { ApplicationRef, ComponentFactoryResolver, ChangeDetectorRef, Component, ComponentRef, Injector, OnInit, ViewChild, ViewContainerRef, AfterViewInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import { MenuService } from 'src/app/service/menu.service';

import { OrderService } from 'src/app/service/order.service';
import { SocketService } from 'src/app/service/socket.service';
import { UrunService } from 'src/app/service/UrunService';
import { slideDownUp, toggleAnimation } from 'src/app/shared/animations';
import { NotificationService } from '../NotificationService';
import { RecipeService } from 'src/app/service/RecipeService';

import { Item, ItemDetails, urunItem } from './ordercomponent/item.model';
import { Product } from './ordercomponent/product.model';

import { OrderDataService } from 'src/app/service/order-data.service';

import { SiparisOzetiMusteriComponent } from './ordercomponent/siparis-ozeti-musteri.component';
import { BehaviorSubject } from 'rxjs';
import { CouponService } from 'src/app/service/coupon.service';
import { OdemeTipiService } from 'src/app/service/odemetipi.service';
import { OrderStateService } from 'src/app/service/order-state.service'; // << OrderStateService import burada
import { CustomerService } from 'src/app/service/customer.service';
import GLightbox from 'glightbox';

interface OrderItem {
    _id?: string;
    urunId: string;
    urunAdi: string;
    vergiliFiyat: number;
    yapildimi: string;
    miktar: number;
    items: Item[];
    partialPayment?: number;
    partialPayments?: { odemeTipi: string; tutar: number }[];
}

declare global {
    interface Window {
        componentRef?: ComponentRef<SiparisOzetiMusteriComponent>;
    }
}
@Component({
    selector: 'app-order',
    templateUrl: './order.html',
    animations: [toggleAnimation, slideDownUp],
})
export class OrderComponent implements OnInit,AfterViewInit {

    groupedProducts$: BehaviorSubject<Map<string, any[]> | null> = new BehaviorSubject<Map<string, any[]> | null>(null);
    customerId?: string;
    siparisListesi: string = '';
    customerInfoData: any = null;
    partialPaymentTotal: number = 0;
    manualPartialAmount: number = 0;
    selectedPartialPaymentType: any = null;
    isFullyPaid: boolean = false;
    showPaymentTypes: boolean = false;
    loadingPaymentTypes: boolean = false;
    paymentTypes: any[] = [];
    isEditing: boolean = false; // Başlangıçta ekleme modu
    editingIndex: number | null = null; // Düzenlenen sipariş öğesinin indeksi
    categories: { kategoriId: string; kategoriAdi: string }[] = [];
    selectedCategory: { kategoriId: string; kategoriAdi: string } | null = null;
    orderItems: OrderItem[] = [];
    remainingAmount: number = 0;
    products: any[] = []; // Ürün listesi
    currentOrderGelen: any = {}; // gelencurret listesi
    filteredProducts: any[] = [];
    totalAmount: number = 0;
    source: string = '';
    cluster: string = '';
    store: string = '';
    id: string = '';
    satiskaynakid: string = '';
    menus: any[] = [];
    loadingProductDetails: boolean = false;
    accordionOpen: boolean = false;
    @ViewChild('productDetailsModal') productDetailsModal!: any;
    @ViewChild('partialPaymentModal') partialPaymentModal!: any;

    @ViewChild('couponModal') couponModal!: any;
    selectedDisabledStates: { [key: string]: boolean } = {};
    isParentDisabled = false;
    selectedProduct!: Product; // Modal'da gösterilecek ürün bilgisi
    masaBilgisi = {
        masaId: "98765",
        cuverUcreti: 0,
        kisiSayisi: 0,
    };

    orderCompleted: boolean = false; // Sipariş tamamlandı mı?

    couponCode: string = '';
    mockOrderSource = 'Masa';
    mockTableInfo = { tableName: '', tableNumber: 0 };
    mockCustomerInfo = { name: '' };
    mockCustomerInfoOzel = { name: '', surename: '' };
    mockPickupInfo = { method: '' };
    orderNo = "0";
    orderId = "0";
    mockOrderDate: string = new Date().toISOString().split('T')[0]; // Günümüzün tarihi
    mockOrderTime: string = new Date().toTimeString().split(' ')[0]; // Günün saati
    orderUname: string = localStorage.getItem('kullaniciAdi') || '';
    selectedMenuId: string = '';
    private customerOrderWindow: Window | null = null;
    private customerOrderWindowComponentRef: ComponentRef<SiparisOzetiMusteriComponent> | null = null;
    screenWidth: number = 0;
    selectedCoupons: any[] = [];

    selectedAddressData: any = null;

    private positionInterval: any; // Pencere konumunu kontrol etmek için interval
    constructor(
        private injector: Injector,
        private appRef: ApplicationRef,
        private orderService: OrderService,
        private odemeService: OdemeTipiService,
        private customerService: CustomerService,
        private menuService: MenuService,
        private urunService: UrunService,
        private orderStateService: OrderStateService, // << OrderStateService DI
        private receteservice: RecipeService,
        private translate: TranslateService,
        private socketservis: SocketService,
        private orderDataService: OrderDataService,
        private route: ActivatedRoute,
        private routegiden: Router,
        private notificationService: NotificationService,
        private viewContainerRef: ViewContainerRef,
        private componentFactoryResolver: ComponentFactoryResolver,
        private couponService: CouponService,
        private cdr: ChangeDetectorRef,
    ) { }
    ngOnInit(): void {
        this.getQueryParams();

        const preference = localStorage.getItem('useSecondScreen');
        if (preference === 'true') {
            this.updateOrderData();
            this.openCustomerOrderWindow();
        }
        this.screenWidth = window.innerWidth;

        window.addEventListener('resize', () => {
            this.screenWidth = window.innerWidth;
        });

        // Burada da orderStateService'e ilk boş state'i verebiliriz isterseniz:
        this.orderStateService.setOrderItems(this.orderItems); // << OrderStateService değişiklik


        this.socketservis.onOrderUpdate((data: any) => {
            // Eğer gelen orderId, bu component'in orderId'si ile eşleşiyorsa
            if (data.orderId === this.orderId) {
                // Order'ı tekrar sunucudan çek
                this.orderService.getOrder(this.orderId).subscribe({
                    next: (response) => {
                        this.orderItems = response.urunler;
                        this.calculateTotal();

                        if (response.coupons && response.coupons.length > 0) {
                            this.selectedCoupons = response.coupons.map((c: any) => ({
                                _id: c._id,
                                kod: c.kod,
                                indirimMiktari: c.indirimMiktari || 0,
                                kuponTipi: c.kuponTipi,
                                kullanildi: true
                            }));
                            this.calculateDiscountedTotal();
                        }

                        const sumOfPayments = response.odemeler ? response.odemeler.reduce((acc: number, o: any) => acc + o.tutar, 0) : 0;
                        const total = this.totalAmount;
                        this.remainingAmount = Math.max(total - sumOfPayments, 0);
                        this.isFullyPaid = (sumOfPayments >= total);

                        this.orderStateService.setOrderItems(this.orderItems);
                    },
                    error: (err) => {
                        console.error('Order güncellenirken hata:', err);
                    },
                });
            }
        });



    }
    ngOnDestroy(): void {
        if (this.positionInterval) {
            clearInterval(this.positionInterval);
        }
    }
    clickhesapFisiRequest() {
        this.orderService.getOrderHesapFisi(this.orderId).subscribe({
            next: (response) => {
                this.orderService.posthesapFisi(response).subscribe({});
            },
            error: (err) => {
                console.error('sipariş çekildi:', err);
            },
        });
    }
    openCustomerOrderWindowKullanKullanma() {
        const preference = localStorage.getItem('useSecondScreen');
        if (preference === 'true') {
            localStorage.setItem('useSecondScreen', 'false');
        }
        else {
            this.openCustomerOrderWindow();
        }

    }
    openCustomerOrderWindow() {
        // (kod aynı)
        // ...
    }

    startPositionInterval() {
        // (kod aynı)
    }

    updateOrderData() {
        const data = {
            orderItems: this.orderItems,
            totalAmount: this.totalAmount,
        };
        const safeData = this.removeCircularReferences(data);
        localStorage.setItem('orderData', JSON.stringify(safeData));

        if (this.customerOrderWindowComponentRef) {
            this.customerOrderWindowComponentRef.instance.orderItems = this.orderItems;
            this.customerOrderWindowComponentRef.instance.totalAmount = this.totalAmount;
            this.customerOrderWindowComponentRef.changeDetectorRef.detectChanges();
        }

        // Burada orderStateService'i de güncelleyelim ki her hesaplama sonrası senkron olsun:
        this.orderStateService.setOrderItems(this.orderItems); // << OrderStateService değişiklik
    }

    maxSelected(item?: any): boolean {
        // (kod aynı)
        const maxSecimSayisi = this.selectedProduct?.maxSecimSayisi ?? 0;
        if (!maxSecimSayisi) return false;
        if (item) {
            const selectedItems = this.selectedProduct.items?.filter(
                (i: any) => i.selected && i.tip === item.tip && i.itemId === item.itemId
            ) ?? [];
            return selectedItems.length >= maxSecimSayisi;
        }
        const selectedItems = this.selectedProduct.items?.filter((i: any) => i.selected) ?? [];
        return selectedItems.length >= maxSecimSayisi;
    }


    get productTitle(): string {
        return this.selectedProduct?.urunAdi
            ? this.selectedProduct.urunAdi.toLowerCase()
            : 'Ürün Detayları';
    }


    get showCheckbox(): boolean {
        const maxSecimSayisi = this.selectedProduct.maxSecimSayisi ?? 0;
        const itemCount = this.selectedProduct.items?.length ?? 0;
        return maxSecimSayisi > 0 && itemCount > maxSecimSayisi;
    }



    showCheckboxForDetail(item: any, parent?: any): boolean {
        const maxSecimSayisi = parent?.itemDetails?.maxSecimSayisi || item.itemDetails?.maxSecimSayisi;
        const detailCount = parent?.itemDetails?.items?.length || item.itemDetails?.items?.length;
        return maxSecimSayisi && detailCount > maxSecimSayisi;
    }
    maxSelectedForDetails(item: any): boolean {
        const maxSecimSayisi = item.itemDetails?.maxSecimSayisi || 0;
        if (!maxSecimSayisi) return false;
        const selectedCount = item.itemDetails?.items?.filter((detail: any) => detail.selected).length || 0;
        return selectedCount >= maxSecimSayisi;
    }
    onDetailSelectionChange(detail: any, parent: any): void {
        // (kod aynı)
        const maxSecimSayisi = parent?.maxSecimSayisi || 0;
        const totalSelected = parent.itemDetails.items.filter((item: any) => item.selected).length;
        parent.itemDetails.items.forEach((item: any) => {
            if (!item.selected) {
                item.disabled = totalSelected >= maxSecimSayisi;
            } else {
                item.disabled = false;
            }
            if (item.itemDetails?.items?.length > 0) {
                item.itemDetails.items.forEach((subItem: any) => {
                    if (!item.selected) {
                        subItem.disabled = true;
                    } else {
                        subItem.disabled = false;
                    }
                });
            }
        });
        if (!detail.selected)
            detail.itemDetails.items.forEach((item: any) => {
                item.selected = false;
            });

        this.calculatePrice();
        this.cdr.detectChanges();
    }


    updatePrice(): void {
        // (kod aynı)
        if (!this.selectedProduct) return;
        const selectedItems = this.selectedProduct.items
            ? this.selectedProduct.items.filter((item: any) => item.selected)
            : [];
        let totalPrice = this.selectedProduct.standartFiyat ?? 0;
        selectedItems.forEach((item: any) => {
            totalPrice += item.ekFiyat ?? 0;
        });
        this.selectedProduct.calculatedPrice = totalPrice;
        this.cdr.detectChanges();
    }
    get urunKategoriAdi(): string {
        const kategori = this.selectedProduct?.urunKategori;
        if (kategori && typeof kategori !== 'string') {
            return kategori.ad || 'Bilinmiyor';
        } else {
            return 'Bilinmiyor';
        }
    }

    get urunAltKategoriAdi(): string {
        const altKategori = this.selectedProduct?.urunAltKategori;
        if (altKategori && typeof altKategori !== 'string') {
            return altKategori.ad || 'Bilinmiyor';
        } else {
            return 'Bilinmiyor';
        }
    }



    toggleDetailsAlt(detail: any): void {
        // (kod aynı)
        if (detail.items?.length > 0) {
            detail.showDetails = !detail.showDetails;
            if (detail.showDetails) {
                detail.items.forEach((item: any) => {
                    item.selected = true;
                    item.disabled = false;
                });
            }
        } else {
            console.warn('Bu detay için alt öğe bulunamadı.');
        }
        this.cdr.detectChanges();
    }

    toggleDetails(item: any): void {
        // (kod aynı)
        item.showDetails = !item.showDetails;
    }



    toggleIngredientSelection(recipeItem: any, event: Event): void {
        // (kod aynı)
        const checkbox = event.target as HTMLInputElement;
        recipeItem.isenmeyen = !checkbox.checked;
    }



    findParent(currentItem: any, allItems: any[]): any {
        // (kod aynı)
        const parentId = currentItem.parentId;
        return allItems.find((item: any) => item.id === parentId);
    }
    onAltDetailSelectionChange(altItem: any, detail: any, parentItem: any): void {
        // (kod aynı)
        const hasSelectedSubDetails = detail.itemDetails.items.some((item: any) => item.selected);
        detail.selected = hasSelectedSubDetails;
        if (hasSelectedSubDetails) {
            parentItem.selected = true;
        }
        const maxSecimSayisi = detail?.maxSecimSayisi || 0;
        const totalSelected = detail.itemDetails.items.filter((item: any) => item.selected).length;
        detail.itemDetails.items.forEach((item: any) => {
            if (!item.selected) {
                item.disabled = totalSelected >= maxSecimSayisi;
                if (item.itemDetails?.items?.length > 0) {
                    item.itemDetails.items.forEach((subItem: any) => {
                        subItem.disabled = totalSelected >= maxSecimSayisi || !item.selected;
                    });
                }
            }
        });

        parentItem.itemDetails.items.forEach((item: any) => {
            if (!item.selected) {
                item.disabled = totalSelected >= maxSecimSayisi;
                if (item.itemDetails?.items?.length > 0) {
                    item.itemDetails.items.forEach((subItem: any) => {
                        subItem.disabled = totalSelected >= maxSecimSayisi;
                        subItem.selected = false;
                    });
                }
            }
        });

        this.calculatePrice();
        this.cdr.detectChanges();
    }


    calculateItemPrice(items: Item[]): number {
        // (kod aynı)
        let price = 0;
        items.forEach((item: Item) => {
            if (item.selected) {
                price += item.ekFiyat || 0;
                const childItems = item.itemDetails?.items;
                if (childItems && childItems.length > 0) {
                    price += this.calculateItemPrice(childItems);
                }
            }
        });
        return price;
    }



    calculateExtraPrice(items: any[]): number {
        // (kod aynı)
        if (!items || items.length === 0) {
            return 0;
        }

        let totalExtraPrice = 0;

        items.forEach((item) => {
            if (item.selected && item.ekFiyat) {
                totalExtraPrice += item.ekFiyat;
            }
            if (item.itemDetails?.items?.length > 0) {
                totalExtraPrice += this.calculateExtraPrice(item.itemDetails.items);
            }
        });

        return totalExtraPrice;
    }

    updateParentDisabledStatus(): void {
        // (kod aynı)
        this.products.forEach((product: any) => {
            product.items?.forEach((item: any) => {
                item.disabled = this.isAnyOtherParentSelected(item);
                item.itemDetails.items?.forEach((subItem: any) => {
                    subItem.disabled = this.isAltDetailDisabled(subItem, item);
                });
            });
        });
    }

    isAltDetailDisabled(altItem: any, parentDetail: any): boolean {
        // (kod aynı)
        const isOtherParentSelected = this.isAnyOtherParentSelected(parentDetail);
        const isMaxSelectionReached = this.maxSelectedForDetails(parentDetail);
        return (!altItem.selected && (isOtherParentSelected || isMaxSelectionReached));
    }

    isAnyOtherParentSelected(currentParent: any): boolean {
        // (kod aynı)
        return this.products.some((product: any) =>
            product.items?.some((item: any) => item.selected && item !== currentParent)
        );
    }
    onRecipeDetailSelectionChange(recipeDetail: any, altItem: any, parentDetail: any): void {
        // (kod aynı)
        this.calculatePrice();
    }
    isRecipeDetailDisabled(recipeDetail: any, altItem: any, parentDetail: any): boolean {
        // (kod aynı)
        return false;
    }


    getQueryParamsnew(): void {
        // (kod aynı)
        try {
            this.route.queryParams.subscribe(params => {
                const state = history.state;
                console.log("state:", state);
                if (state && state.orderInfo) {
                    const currentOrder = state.orderInfo;
                    if (currentOrder) {
                        this.updateOrderInfo(currentOrder);
                    }
                }
            });
        } catch (error) {
            console.log('yeni trychact', error);
        }
    }

    getQueryParams(): void {
        this.route.queryParams.subscribe((params) => {
            this.source = params['source'];
            this.id = params['id'];
            this.cluster = params['cluster'];
            this.store = params['store'];
            this.customerId = params['customerId'];
            this.siparisListesi = params['ekran'];


            const il = params['il'];
            const ilce = params['ilce'];
            const mahalle = params['mahalle'];
            const yolAdi = params['yolAdi'];
            const adres = params['adres'];
            const adresAciklama = params['adresAciklama'];
            const postaKodu = params['postaKodu'];
            const ulke = params['ulke'];
            const adresTipi = params['adresTipi'];

            if (il || ilce || mahalle || yolAdi || adres || adresAciklama || postaKodu || ulke || adresTipi) {
                this.selectedAddressData = {
                    il: il || '',
                    ilce: ilce || '',
                    mahalle: mahalle || '',
                    yolAdi: yolAdi || '',
                    adres: adres || '',
                    adresAciklama: adresAciklama || '',
                    postaKodu: postaKodu || '',
                    ulke: ulke || '',
                    adresTipi: adresTipi || ''
                };
            }

            this.orderService.getSatisKaynak(this.source).subscribe((data) => {
                this.menus = data;

                if (this.menus.length > 0 && this.menus[0].menuler.length > 0) {
                    this.mockOrderSource = this.menus[0].kaynakAdi;
                    this.satiskaynakid = this.menus[0]._id;
                    this.selectedMenuId = this.menus[0].menuler[0];

                    if (this.customerId) {
                        this.customerService.getCustomerById(this.customerId).subscribe({
                            next: (customer) => {
                                const firstName = customer[0]?.ad || '';
                                const lastName = customer[0]?.soyad || '';
                                const maskedLastName = lastName ? `${lastName.charAt(0).toUpperCase()}***` : '';
                                const fullNameMasked = `${firstName} ${maskedLastName}`.trim();

                                this.mockCustomerInfo = { name: fullNameMasked };
                                this.mockCustomerInfoOzel = { name: customer[0]?.ad || '', surename: customer[0]?.soyad || '' }
                                this.customerInfoData = customer[0];
                                this.loadCategories(this.selectedMenuId);
                                this.getQueryParamsnew();
                            },
                            error: (err) => {
                                console.error('Müşteri bilgisi alınırken hata:', err);
                                this.mockCustomerInfo = { name: 'Bilinmiyor' };
                                this.loadCategories(this.selectedMenuId);
                                this.getQueryParamsnew();
                            }
                        });
                    } else {
                        this.loadCategories(this.selectedMenuId);
                        this.getQueryParamsnew();
                    }
                } else {
                    this.categories = [];
                }
            });

            // Burada orderId varsa ilk açılışta siparişi çekelim
            const incomingOrderId = params['orderId'];
            if (incomingOrderId && incomingOrderId.trim() !== '') {
                // orderId var, siparişi çek
                this.orderService.getOrder(incomingOrderId).subscribe({
                    next: (response) => {
                        // Gelen order'ı updateOrderInfo ile işleyin
                        this.updateOrderInfo(response);
                    },
                    error: (err) => {
                        console.error('Order bilgisi alınırken hata:', err);
                        this.notificationService.showNotification('Sipariş bilgisi alınamadı.', 'error', 'top-end');
                    }
                });
            }
        });
    }


    isImageValid(url: string): boolean {
        // (kod aynı)
        const invalidValues = ["d", "null", "undefined", "", " "];
        const base64Pattern = /^data:image\/(png|jpeg|jpg|gif);base64,/;
        return !(invalidValues.includes(url?.trim()) || !base64Pattern.test(url));
    }

    getImageUrl(product: any): string | null {

        if (product?.urunResmi) {
            return product.urunResmi;
        }
        return null;
    }

    navigateBack(): void {
        // (kod aynı)
       // console.log("siparisListesi", this.siparisListesi);
        if (this.siparisListesi) {
         console.log('siparisListesi2', this.siparisListesi);
            this.routegiden.navigate([`/apps/siparisList`], {});
        }




        this.routegiden.navigate([`/apps/${this.source}`], {
            queryParams: {
                source: this.source,
                id: this.id,
                cluster: this.cluster,
                store: this.store
            }
        });
    }

    loadCategories(menuId: string): void {
        // (kod aynı)
        this.menuService.getProductCategories(menuId).subscribe(
            (data) => {
                this.categories = data;
                this.selectedCategory = this.categories.length > 0 ? this.categories[0] : null;
                this.loadProductsByCategory();
            },
            (error) => {
                console.error('Kategoriler alınamadı:', error);
                this.categories = [];
                this.selectedCategory = null;
            }
        );
    }
    filterByCategory(category: { kategoriId: string; kategoriAdi: string }): void {
        // (kod aynı)
        this.selectedCategory = category;
        this.loadProductsByCategory();
    }
    loadProductsByCategory(): void {
        // (kod aynı)
        if (!this.selectedCategory || !this.selectedMenuId) return;

        console.log("bilgiler", this.selectedMenuId, this.selectedCategory.kategoriId, this.cluster);

        this.menuService.getDynamicPricingByMenu(this.selectedMenuId, this.selectedCategory.kategoriId, this.cluster).subscribe(
            (data) => {
                this.products = data;
                setTimeout(() => {
                    this.products = data;
                    this.groupProductsByAltKategori();
                    this.cdr.detectChanges();
                }, 10);
            },
            (error) => {
                console.error('Ürünler yüklenirken hata:', error);
            }
        );
    }
    groupProductsByAltKategori(): void {
        // (kod aynı)
        try {
            const groups = new Map<string, any[]>();
            this.products.forEach((product) => {
                const altKategori = product.urunAltKategori || 'Diğer';
                if (!groups.has(altKategori)) {
                    groups.set(altKategori, []);
                }
                groups.get(altKategori)!.push(product);
            });
            this.groupedProducts$.next(groups);
            console.log('Gruplanmış Ürünler:', this.groupedProducts$);
        } catch (error) {
            console.log('yeni trychact', error);
        }
    }

    EditOrderItem(orderItem: any, index: number): void {
        // (kod aynı)
        this.loadingProductDetails = true;
        this.isEditing = true;
        this.editingIndex = index;

        this.urunService.getUrunByOrderId(orderItem.urunId).subscribe({
            next: (data: Product) => {
                this.selectedProduct = {
                    ...data,
                    items: data.items.map((item: Item) => ({
                        ...item,
                        selected: false,
                        disabled: false,
                    })),
                    calculatedPrice: orderItem.vergiliFiyat,
                };

                this.applyOrderItemSelections(orderItem);
                this.productDetailsModal.open();
                this.loadingProductDetails = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Ürün detayları alınamadı:', err);
                this.loadingProductDetails = false;
            },
        });
    }
    applyOrderItemSelections(orderItem: any): void {
        // (kod aynı)
        const setSelections = (items: Item[], orderItems: Item[]) => {
            items.forEach((item) => {
                const matchingOrderItem = orderItems.find((oi) => oi.itemId === item.itemId);
                item.selected = !!matchingOrderItem;
                if (item.itemDetails?.items && item.itemDetails.items.length > 0) {
                    setSelections(item.itemDetails.items, matchingOrderItem?.itemDetails?.items || []);
                }
            });
            this.applySelectionRules(items);
        };
        setSelections(this.selectedProduct.items, orderItem.items);
    }
    applySelectionRules(items: Item[]): void {
        // (kod aynı)
        const maxSecimSayisi = this.selectedProduct.maxSecimSayisi;
        const selectedCount = items.filter((item) => item.selected).length;
        items.forEach((item) => {
            if (!item.selected) {
                item.disabled = selectedCount >= maxSecimSayisi;
            } else {
                item.disabled = false;
            }
            if (item.itemDetails?.items && item.itemDetails.items.length > 0) {
                this.applySelectionRules(item.itemDetails.items);
            }
        });
    }


    setPreviousSelections(productItems: Item[], orderItems: Item[]): void {
        // (kod aynı)
        productItems.forEach((productItem) => {
            const matchingOrderItem = orderItems.find((orderItem) => orderItem.itemId === productItem.itemId);
            if (matchingOrderItem) {
                productItem.selected = true;
                productItem.disabled = false;
            }

            if (productItem.itemDetails?.items?.length) {
                this.setPreviousSelections(productItem.itemDetails.items, matchingOrderItem?.itemDetails?.items || []);
            }
        });
    }

    OnaylaOrder(orderItem: OrderItem[]): void {
        // Siparişi onaylarken sadece "yenigirildi" olan ürünleri "gonderildi" yapıyoruz
        orderItem.forEach(item => {
            if (item.yapildimi === "yenigirildi") {
                item.yapildimi = "gonderildi";
            }
            // if (item.items && item.items.length > 0) {
            //     this.markOnlyYeniGirildiAsGonderildi(item.items);
            // }
        });

        if (this.orderId !== "0" && this.orderId !== null) {
            // Mevcut sipariş var, güncelle
            const orderData = this.generateOrderData(orderItem);

            this.orderService.updateOrder(this.orderId, orderData).subscribe({
                next: (response) => {
                    console.log('Sipariş onaylandı (gonderildi yapıldı):', response);
                    this.navigateBack();
                },
                error: (err) => {
                    console.error('Sipariş güncellenirken hata:', err);
                    const errorMessage = err.error?.error || 'Sipariş güncellenemedi.';
                    this.notificationService.showNotification(errorMessage, 'error', 'bottom-right');
                }
            });
        } else {
            // orderId 0 ise henüz sipariş yok, onaylama mantıklı değil
            this.notificationService.showNotification(
                'Onaylanacak bir sipariş yok.',
                'warning',
                'bottom-right'
            );
        }
    }

    // Bu yardımcı fonksiyon, alt ürünlerin sadece "yenigirildi" olanlarını "gonderildi" yapar
    markOnlyYeniGirildiAsGonderildi(items: Item[]): void {
        for (const item of items) {
            if (item.yapildimi === "yenigirildi") {
                item.yapildimi = "gonderildi";
            }
            if (item.itemDetails?.items && item.itemDetails.items.length > 0) {
                this.markOnlyYeniGirildiAsGonderildi(item.itemDetails.items);
            }
        }
    }
    generateOrderData(orderItems: any[]): any {
        const toplamVergisizFiyat = this.totalAmount / 1.20;
        const toplamVergiliFiyat = this.totalAmount;
        const toplamIndirim = 0;

        const orderData: any = {
            magazaKodu: this.store,
            satisKaynak: this.satiskaynakid,
            urunler: orderItems.map((orderItem) => ({
                _id: orderItem._id,
                urunId: orderItem.urunId,
                urunAdi: orderItem.urunAdi,
                miktar: orderItem.miktar,
                vergisizFiyat: orderItem.vergiliFiyat / 1.20,
                vergiliFiyat: orderItem.vergiliFiyat,
                yapildimi: orderItem.yapildimi,
                indirim: orderItem.indirim || 0,
                items: this.mapItems(orderItem.items),
                partialPayments: orderItem.partialPayments || []
            })),
            masaBilgisi: this.masaBilgisi
                ? {
                    masaId: this.id,
                    cuverUcreti: this.masaBilgisi.cuverUcreti || 0,
                    kisiSayisi: this.masaBilgisi.kisiSayisi || 0,
                }
                : null,
            toplamVergisizFiyat,
            toplamVergiliFiyat,
            toplamIndirim,
            siparisTarihi: new Date(),
        };

        if (this.customerId && this.customerId.trim() !== '' && this.customerInfoData) {
            orderData.musteri = {
                musteriId: this.customerId,
                ad: this.customerInfoData.ad || '',
                soyad: this.customerInfoData.soyad || '',
                telefon: this.customerInfoData.telefon || '',
                aciklama: this.customerInfoData.aciklama || ''
            };
        }
        if (this.selectedCoupons && this.selectedCoupons.length > 0) {
            orderData.coupons = this.selectedCoupons.map(c => ({
                _id: c._id,
                kod: c.kod,
                indirimMiktari: c.indirimMiktari || 0,
                kuponTipi: c.kuponTipi,
                kullanildi: true
            }));
        }

        // Eğer selectedAddressData doluysa siparisAdresi alanını ekle
        if (this.selectedAddressData && Object.values(this.selectedAddressData).some(val => typeof val === 'string' && val.trim() !== '')) {

            orderData.siparisAdresi = {
                adres: this.selectedAddressData.adres || '',
                postaKodu: this.selectedAddressData.postaKodu || '',
                sehir: this.selectedAddressData.il || '', // il bilgisini sehir alanına set ediyoruz
                ulke: this.selectedAddressData.ulke || 'Türkiye',
                aciklama: this.selectedAddressData.adresAciklama || '',
                il: this.selectedAddressData.il || '',
                ilce: this.selectedAddressData.ilce || '',
                mahalle: this.selectedAddressData.mahalle || '',
                yolAdi: this.selectedAddressData.yolAdi || '',
                adresTipi: this.selectedAddressData.adresTipi || 'ev'
            };
        }

        return orderData;
    }

    mapItems(items: any[]): any[] {
        // (kod aynı)
        if (!items || items.length === 0) return [];
        return items.map((item) => {
            const mappedItem: any = {
                tip: item.tip,
                itemId: item.itemId,
                miktar: item.miktar,
                birim: item.birim,
                ekFiyat: item.ekFiyat || 0,
                selected: item.selected || false,
                partialPayments: item.partialPayments || [], // <-- Bunu ekliyoruz
                itemDetails: item.itemDetails
                    ? {
                        _id: item.itemDetails._id,
                        urunAdi: item.itemDetails.urunAdi,
                        kategori: item.itemDetails.kategori || null,
                        altKategori: item.itemDetails.altKategori || null,
                        items: item.itemDetails.items
                            ? this.mapItems(item.itemDetails.items)
                            : [],
                        urunItems: item.itemDetails.urunItems
                            ? this.mapUrunItems(item.itemDetails.urunItems)
                            : [],
                    }
                    : null,
                parent: item.parent
                    ? {
                        tip: item.parent.tip,
                        itemId: item.parent.itemId,
                        miktar: item.parent.miktar,
                        birim: item.parent.birim,
                        ekFiyat: item.parent.ekFiyat || 0,
                    }
                    : null,
                items: item.items ? this.mapItems(item.items) : [],
            };
            if (item.istenmeyen !== undefined) {
                mappedItem.istenmeyen = item.istenmeyen;
            }
            return mappedItem;
        });
    }
    mapItemsUrun(items: any[]): any[] {
        // (kod aynı)
        if (!items || items.length === 0) return [];
        return items.map((item) => {
            const mappedItem: any = {
                tip: item.tip,
                itemId: item.itemId,
                miktar: item.miktar,
                birim: item.birim,
                ekFiyat: item.ekFiyat || 0,
                selected: item.selected || false
            };
            return mappedItem;
        });
    }


    mapUrunItems(urunItems: any[]): any[] {
        // (kod aynı)
        if (!urunItems || urunItems.length === 0) return [];
        return urunItems.map((urunItem) => ({
            urunId: urunItem?._id || null,
            miktar: urunItem.miktar,
            birim: urunItem.birim,
            items: urunItem.urun?.items
                ? this.mapItemsUrun(urunItem.urun.items)
                : [],
        }));
    }

    odemeAlRequested() {
        // (kod aynı)
        this.showPaymentTypes = true;
        this.loadPaymentTypes();
    }

    loadPaymentTypesComplated() {
        // (kod aynı)
        // this.loadingPaymentTypes = true;
        this.odemeService.getOdemeTipleriBySatisKaynak(this.satiskaynakid).subscribe({
            next: (data) => {
                this.paymentTypes = data;
                // this.loadingPaymentTypes = false;
            },
            error: (err) => {
                console.error('Ödeme tipleri yüklenirken hata:', err);
                //this.loadingPaymentTypes = false;
            }
        });
    }
    loadPaymentTypes() {
        // (kod aynı)
        this.loadingPaymentTypes = true;
        this.odemeService.getOdemeTipleriBySatisKaynak(this.satiskaynakid).subscribe({
            next: (data) => {
                this.paymentTypes = data;
                this.loadingPaymentTypes = false;
            },
            error: (err) => {
                console.error('Ödeme tipleri yüklenirken hata:', err);
                this.loadingPaymentTypes = false;
            }
        });
    }
    openPartialPaymentModal() {
        // (kod aynı)
        console.log("this.remainingAmount:", this.remainingAmount);
        if (this.remainingAmount <= 0) {
            this.notificationService.showNotification('Bu sipariş için ek ödeme gerekmez.', 'warning');
            return;
        }
        this.partialPaymentModal.open();
        this.orderItems.forEach(i => i.partialPayment = 0);
        this.manualPartialAmount = 0;
        this.calculatePartialTotal();
    }

    closePartialPaymentModal() {
        // (kod aynı)
        this.partialPaymentModal.close();
    }
    calculatePartialTotal() {
        // (kod aynı)
        if (this.manualPartialAmount > 0) {
            this.orderItems.forEach(i => i.partialPayment = 0);
            this.partialPaymentTotal = this.manualPartialAmount;
            return;
        }
        let total = 0;
        for (const item of this.orderItems) {
            if ((item.partialPayment ?? 0) > item.miktar) {
                item.partialPayment = item.miktar;
            }
            const totalItemPrice = this.calculateOrderItemTotal(item);
            const itemQuantity = item.miktar;
            const unitPrice = itemQuantity > 0 ? (totalItemPrice / itemQuantity) : 0;
            const partialCount = Number(item.partialPayment) || 0;
            const partialItemTotal = partialCount * unitPrice;
            total += partialItemTotal;
        }
        this.partialPaymentTotal = total;
    }


    onManualPartialInput() {
        // (kod aynı)
        if (this.manualPartialAmount > this.totalAmount) {
            this.manualPartialAmount = this.totalAmount;
            this.notificationService.showNotification('Elle girilen miktar toplam ödemeyi geçemez, üst sınır uygulandı.', 'warning');
        }
        if (this.manualPartialAmount > 0) {
            this.orderItems.forEach(i => i.partialPayment = 0);
            this.partialPaymentTotal = this.manualPartialAmount;
        } else {
            this.calculatePartialTotal();
        }
    }
    getOdemeTipiNameById(id: string): string {
        const found = this.paymentTypes.find(pt => pt._id === id);
        return found ? found.odemeAdi : 'Bilinmiyor';
    }

    selectPartialPaymentType(odeme: any) {
        // (kod aynı)
        this.selectedPartialPaymentType = odeme;
    }

    confirmPartialPayment() {
        if (this.partialPaymentTotal <= 0 || this.partialPaymentTotal > this.totalAmount) return;

        if (this.orderId === "0" || !this.orderId) {
            this.notificationService.showNotification(
                'Sipariş olmadan ödeme alınamaz.',
                'warning',
                'bottom-right'
            );
            this.closePartialPaymentModal();
            return;
        }

        this.orderService.getOrder(this.orderId).subscribe({
            next: (response) => {
                const existingPayments = response.odemeler || [];
                const sumOfPayments = existingPayments.reduce((acc: number, p: any) => acc + p.tutar, 0);
                const remaining = Math.max(this.totalAmount - sumOfPayments, 0);

                if (remaining <= 0) {
                    this.notificationService.showNotification('Zaten tam ödeme alınmış.', 'info', 'bottom-right');
                    this.closePartialPaymentModal();
                    return;
                }

                const partialPayment = Math.min(this.partialPaymentTotal, remaining);

                // Ürün bazında partialPayment alanlarını partialPayments dizisine kaydet
                const updatedItems = [...this.orderItems].map(item => {
                    if (item.partialPayment && item.partialPayment > 0) {
                        // Eğer item üzerinde henüz partialPayments yoksa tanımlayalım
                        if (!item.hasOwnProperty('partialPayments')) {
                            (item as any).partialPayments = [];
                        }
                        (item as any).partialPayments.push({
                            odemeTipi: this.selectedPartialPaymentType._id,
                            tutar: item.partialPayment
                        });
                        // partialPayment eklendikten sonra sıfırlayabiliriz.
                        item.partialPayment = 0;
                    }
                    return item;
                });

                const newSum = sumOfPayments + partialPayment;
                if (newSum >= this.totalAmount) {
                    updatedItems.forEach(item => {
                        if (item.yapildimi === 'yenigirildi') {
                            item.yapildimi = 'gonderildi';
                        }
                    });
                }

                const orderData = this.generateOrderData(updatedItems);

                // Order seviyesinde de kısmi ödemeyi eklemek istiyorsak:
                existingPayments.push({
                    odemeTipi: this.selectedPartialPaymentType._id,
                    cihaz: "Diğer",
                    tutar: partialPayment,
                    aciklama: "Kısmi ödeme (Ürün bazlı)"
                });
                orderData.odemeler = existingPayments;

                this.orderService.updateOrder(this.orderId, orderData).subscribe({
                    next: (updateResponse) => {
                        this.notificationService.showNotification('Kısmi ödeme başarıyla alındı.', 'success', 'bottom-right');
                        this.closePartialPaymentModal();

                        this.currentOrderGelen = updateResponse;
                        this.orderItems = updateResponse.urunler.map((u: any) => ({
                            _id: u._id,
                            urunId: u.urunId,
                            urunAdi: u.urunAdi,
                            vergiliFiyat: u.vergiliFiyat,
                            yapildimi: u.yapildimi,
                            miktar: u.miktar,
                            items: u.items,
                            partialPayments: u.partialPayments // backend'den gelen güncel partialPayments
                        }));

                        this.calculateTotal();

                        const sumNow = updateResponse.odemeler
                            ? updateResponse.odemeler.reduce((acc: number, p: any) => acc + p.tutar, 0)
                            : 0;
                        this.remainingAmount = Math.max(this.totalAmount - sumNow, 0);
                        this.isFullyPaid = (sumNow >= this.totalAmount);

                        if (this.isFullyPaid) {
                            this.navigateBack();
                        }

                    },
                    error: (err) => {
                        console.error('Kısmi ödeme güncellenirken hata:', err);
                        // console.error('Sipariş güncellenirken hata:', err);
                        const errorMessage = err.error?.error || 'Kısmi ödeme güncellenirken hata oluştu.';
                        this.notificationService.showNotification(errorMessage, 'error', 'bottom-right');
                    }
                });
            },
            error: (err) => {
                console.error('Sipariş verileri alınırken hata:', err);
                this.notificationService.showNotification('Sipariş bilgisi alınamadı.', 'error', 'bottom-right');
                this.closePartialPaymentModal();
            }
        });
    }




    selectPaymentType(odeme: any) {
        if (this.orderCompleted) {
            this.notificationService.showNotification('Tamamlanmış bir siparişe ödeme eklenemez.', 'warning', 'bottom-right');
            return;
        }
        // Ödeme almadan önce "yenigirildi" olan ürünleri "gonderildi" yapıyoruz
        for (const item of this.orderItems) {
            if (item.yapildimi === 'yenigirildi') {
                item.yapildimi = 'gonderildi';
            }
        }

        // Mevcut siparişi tekrar çekiyoruz ki eski ödemeleri alalım
        this.orderService.getOrder(this.orderId).subscribe({
            next: (response) => {
                // Mevcut ödemeleri al
                const existingPayments = response.odemeler || [];

                // Şimdi toplam ödenen tutarı hesaplayalım
                const sumOfPayments = existingPayments.reduce((acc: number, p: any) => acc + p.tutar, 0);

                // Kalan tutar = totalAmount - sumOfPayments
                const remaining = Math.max(this.totalAmount - sumOfPayments, 0);

                if (remaining <= 0) {
                    // Aslında ödenecek bir şey kalmadı
                    this.notificationService.showNotification('Zaten tam ödeme alınmış.', 'info', 'bottom-right');
                    this.showPaymentTypes = false;
                    return;
                }

                // Yeni ödemeyi ekle
                existingPayments.push({
                    odemeTipi: odeme._id,
                    cihaz: "Diğer",
                    tutar: remaining,
                    aciklama: ""
                });

                const orderData = this.generateOrderData(this.orderItems);
                orderData.odemeler = existingPayments;

                this.orderService.updateOrder(this.orderId, orderData).subscribe({
                    next: (updateResponse) => {
                        this.notificationService.showNotification('Ödeme başarıyla alındı.', 'success', 'bottom-right');
                        this.showPaymentTypes = false;
                        this.navigateBack();
                    },
                    error: (err) => {
                        console.error('Ödeme güncellenirken hata:', err);
                        // this.notificationService.showNotification('Ödeme alınamadı.', 'error', 'bottom-right');

                        const errorMessage = err.error?.error || 'Ödeme alınamadı.';
                        this.notificationService.showNotification(errorMessage, 'error', 'bottom-right');
                    }
                });
            },
            error: (err) => {
                console.error('Sipariş verileri alınırken hata:', err);
                this.notificationService.showNotification('Sipariş bilgisi alınamadı.', 'error', 'bottom-right');
            }
        });
    }

    applyDiscount(item: any): void {
        // (kod aynı)
    }





    removeFromOrder(index: number): void {
        if (this.orderCompleted) {
            // Sipariş tamamlandı, hiçbir değişiklik yapma
            this.notificationService.showNotification('Tamamlanmış bir siparişe müdahale edemezsiniz.', 'warning', 'topRight');
            return;
        }
        // (kod aynı) Sadece orderStateService ile de güncelleyebiliriz.
        const orderItem = this.orderItems[index];
        if (orderItem._id) {
            this.orderService.getOrderItemStatus(this.orderId, orderItem._id).subscribe({
                next: (response) => {
                    if (response.status === 'deletable') {
                        this.orderItems.splice(index, 1);
                        this.calculateTotal();
                    } else {
                        this.notificationService.showNotification(
                            'Bu ürün silinemez.',
                            'warning',
                            'topRight'
                        );
                    }
                },
                error: (err) => {
                    console.error('Ürün statüsü kontrol edilirken hata:', err);
                    this.notificationService.showNotification(
                        'Ürün statüsü kontrol edilirken hata oluştu.',
                        'error',
                        'topRight'
                    );
                }
            });
        } else {
            this.orderItems.splice(index, 1);
            this.calculateTotal();
        }
        // orderItems değişti, orderStateService set edelim:
        this.orderStateService.setOrderItems(this.orderItems); // << OrderStateService değişiklik
    }



    openProductDetailsModal(product: Product): void {
        if (this.orderCompleted) {
            // Sipariş tamamlandı, hiçbir değişiklik yapma
            this.notificationService.showNotification('Tamamlanmış bir siparişe müdahale edemezsiniz.', 'warning', 'topRight');
            return;
        }
        // (kod aynı)
        if (!product) {
            console.error("Geçersiz ürün:", product);
            return;
        }

        if (!product.urunId) {
            console.error("Ürün ID bulunamadı:", product);
            return;
        }
        this.isEditing = false;
        this.loadingProductDetails = true;
        this.selectedProduct = {
            ...product,
            yapildimi: "yenigirildi",
            items: product.items?.map((item: Item) => ({
                ...item,
                selected: false,
                disabled: false,
                showDetails: false
            })) || [],
            calculatedPrice: product.isOzelFiyat ? product.ozelFiyat : product.standartFiyat
        };
        this.loadProductDetails(product.urunId);
        this.productDetailsModal.open();
        this.calculatePrice();
    }
    setParentReferences(items: Item[], parent?: Item): void {
        // (kod aynı)
        items.forEach((item) => {
            item.parent = parent;
            if (item.itemDetails?.items?.length) {
                this.setParentReferences(item.itemDetails.items, item);
            }
        });
    }
    loadProductDetails(productId: string): void {
        // (kod aynı)
        if (!productId) {
            console.error('Geçersiz ürün ID:', productId);
            return;
        }

        this.urunService.getUrunByOrderId(productId).subscribe({
            next: (data: Product) => {
                this.selectedProduct = {
                    ...this.selectedProduct,
                    ...data,
                    items: data.items?.map((item: Item) => ({
                        ...item,
                        selected: false,
                        disabled: false,
                        showDetails: false,
                    })) || [],
                    calculatedPrice: this.selectedProduct.isOzelFiyat ? this.selectedProduct.ozelFiyat : this.selectedProduct.standartFiyat
                };

                this.setParentReferences(this.selectedProduct.items);
                this.loadingProductDetails = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Ürün detayları alınamadı:', err);
            },
        });
    }



    onItemSelectionChange(item: Item): void {
        // (kod aynı)
        if (!this.selectedProduct) return;
        const maxSecimSayisi = this.selectedProduct.maxSecimSayisi || 0;
        const selectedItems = this.getSelectedItems(this.selectedProduct.items || []);
        if (selectedItems.length > maxSecimSayisi && maxSecimSayisi > 0) {
            item.selected = false;
            this.notificationService.showNotification(
                `En fazla ${maxSecimSayisi} seçim yapabilirsiniz.`,
                'warning',
                'topRight'
            );
            return;
        }
        this.updateDisabledStates(this.selectedProduct.items || [], maxSecimSayisi);
    }

    addToOrderFromModal(): void {
        if (this.orderCompleted) {
            // Sipariş tamamlandı, hiçbir değişiklik yapma
            this.notificationService.showNotification('Tamamlanmış bir siparişe müdahale edemezsiniz.', 'warning', 'topRight');
            return;
        }
        // (kod aynı) Sadece orderStateService ile de senkron edeceğiz.
        if (!this.selectedProduct) {
            this.notificationService.showNotification(
                'Ürün bulunamadı.',
                'warning',
                'topRight'
            );
            return;
        }

        const selectedItems = this.getSelectedItems(this.selectedProduct.items || []);
        const isValidSelection = this.validateMaxSelectionForAll(this.selectedProduct.items || []);

        if (!isValidSelection) {
            this.notificationService.showNotification(
                `Lütfen tüm ürünlerden gerekli seçimleri yapın.`,
                'warning',
                'topRight'
            );
            return;
        }

        const maxSecimSayisi = this.selectedProduct.maxSecimSayisi || 0;
        if (maxSecimSayisi > 0 && selectedItems.length !== maxSecimSayisi) {
            this.notificationService.showNotification(
                `Lütfen ${maxSecimSayisi} adet ürün seçin.`,
                'warning',
                'topRight'
            );
            return;
        }

        if (this.isEditing && this.editingIndex !== null) {
            this.updateOrderItem(this.editingIndex, {
                urunId: this.selectedProduct.urunId,
                urunAdi: this.selectedProduct.urunAdi || '',
                vergiliFiyat: this.selectedProduct.calculatedPrice || 0,
                yapildimi: this.selectedProduct.yapildimi,
                miktar: 1,
                items: selectedItems,
            });
        } else {
            const orderItem: OrderItem = {
                urunId: this.selectedProduct.urunId,
                urunAdi: this.selectedProduct.urunAdi || '',
                vergiliFiyat: this.selectedProduct.calculatedPrice || 0,
                yapildimi: "yenigirildi",
                miktar: 1,
                items: selectedItems,
            };

            this.addToOrder(orderItem);
        }

        this.closeProductDetailsModal();
    }

    updateOrderItem(index: number, updatedItem: OrderItem): void {
        // (kod aynı)
        if (this.isEditing && this.editingIndex !== null) {
            const updatedOrderItem: OrderItem = {
                ...this.orderItems[this.editingIndex],
                items: this.getSelectedItems(this.selectedProduct.items || []),
                vergiliFiyat: this.selectedProduct.calculatedPrice || this.selectedProduct.standartFiyat,
            };
            this.orderItems = [
                ...this.orderItems.slice(0, this.editingIndex),
                updatedOrderItem,
                ...this.orderItems.slice(this.editingIndex + 1),
            ];
            this.isEditing = false;
            this.editingIndex = null;
            this.calculateTotal();
            this.notificationService.showNotification(
                'Sipariş başarıyla güncellendi.',
                'success',
                'bottom-right'
            );

            // orderStateService güncelle
            this.orderStateService.setOrderItems(this.orderItems); // << OrderStateService değişiklik
        }
    }

    validateMaxSelectionForAll(items: Item[]): boolean {
        // (kod aynı)
        for (const item of items) {
            if (item.disabled) continue;
            const maxSecimSayisi = item.itemDetails?.maxSecimSayisi || 0;
            const selectedCount = item.itemDetails?.items?.filter((child) => child.selected && !child.disabled).length || 0;
            if (maxSecimSayisi > 0 && selectedCount !== maxSecimSayisi) {
                return false;
            }
            if (item.itemDetails?.items && !this.validateMaxSelectionForAll(item.itemDetails.items)) {
                return false;
            }
        }
        return true;
    }


    getSelectedItems(items: Item[]): Item[] {
        // (kod aynı)
        let selectedItems: Item[] = [];
        items.forEach((item) => {
            if (item.selected && !item.disabled) {
                const selectedItem: Item = { ...item };
                const childItems = item.itemDetails?.items;
                if (childItems && childItems.length > 0) {
                    const selectedChildItems = this.getSelectedItems(childItems);
                    if (selectedChildItems.length > 0) {
                        selectedItem.itemDetails = {
                            ...item.itemDetails,
                            items: selectedChildItems,
                        } as ItemDetails;
                    }
                }

                const urunItems = item.itemDetails?.urunItems;
                if (urunItems && urunItems.length > 0) {
                    const selectedUrunItems = this.getSelectedUrunItems(urunItems);
                    if (selectedUrunItems.length > 0) {
                        selectedItem.itemDetails = {
                            ...selectedItem.itemDetails,
                            urunItems: selectedUrunItems,
                        } as ItemDetails;
                    }
                }

                selectedItems.push(selectedItem);
            }
        });
        return selectedItems;
    }

    getSelectedUrunItems(urunItems: urunItem[]): urunItem[] {
        // (kod aynı)
        let selectedUrunItems: urunItem[] = [];
        urunItems.forEach((urunItem) => {
            if (urunItem.urun?.items) {
                const selectedChildItems = this.getSelectedItems(urunItem.urun.items);
                if (selectedChildItems.length > 0) {
                    selectedUrunItems.push({
                        ...urunItem,
                        urun: {
                            ...urunItem.urun,
                            items: selectedChildItems,
                        },
                    });
                } else {
                    selectedUrunItems.push(urunItem);
                }
            } else {
                selectedUrunItems.push(urunItem);
            }
        });
        return selectedUrunItems;
    }


    updateDisabledStates(items: Item[], maxSecimSayisi: number): void {
        // (kod aynı)
        if (!items) return;
        if (maxSecimSayisi === 1) {
            items.forEach(item => {
                if (!item.selected) {
                    item.disabled = items.filter(i => i.selected).length >= maxSecimSayisi;
                }
            });
        } else if (maxSecimSayisi > 1) {
            const selectedCount = items.filter(i => i.selected).length;
            items.forEach(item => {
                if (!item.selected) {
                    item.disabled = selectedCount >= maxSecimSayisi;
                }
            });
        }
    }

    showMaxSelectionMessage(max: number): void {
        // (kod aynı)
        this.notificationService.showNotification(
            `En fazla ${max} seçim yapabilirsiniz.`,
            'warning',
            'topRight'
        );
    }
    removeCircularReferences(obj: any, seen: Set<any> = new Set()): any {
        // (kod aynı)
        if (!obj || typeof obj !== 'object') {
            return obj;
        }
        if (seen.has(obj)) {
            return undefined;
        }
        seen.add(obj);
        if (Array.isArray(obj)) {
            return obj.map((item) => this.removeCircularReferences(item, new Set(seen)));
        }
        const cleanObj: any = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                cleanObj[key] = this.removeCircularReferences(obj[key], new Set(seen));
            }
        }
        return cleanObj;
    }


    addToOrder(orderItem: OrderItem): void {
        if (this.orderCompleted) {
            // Sipariş tamamlandı, hiçbir değişiklik yapma
            this.notificationService.showNotification('Tamamlanmış bir siparişe müdahale edemezsiniz.', 'warning', 'topRight');
            return;
        }
        // İlk önce local olarak ürünlerimize ekleyelim
        // Ürünün yapildimi alanını yenigirildi olarak ayarlayalım.
        orderItem.yapildimi = "yenigirildi";

        // orderId 0 ise henüz bir sipariş yok, yeni sipariş oluştur
        if (this.orderId === "0") {
            const initialOrderData: any = {
                magazaKodu: this.store,
                satisKaynak: this.satiskaynakid,
                urunler: [
                    {
                        urunId: orderItem.urunId,
                        urunAdi: orderItem.urunAdi,
                        miktar: orderItem.miktar,
                        vergisizFiyat: orderItem.vergiliFiyat / 1.20,
                        vergiliFiyat: orderItem.vergiliFiyat,
                        yapildimi: "yenigirildi",
                        items: this.mapItems(orderItem.items || [])
                    }
                ],
                masaBilgisi: this.masaBilgisi
                    ? {
                        masaId: this.id,
                        cuverUcreti: this.masaBilgisi.cuverUcreti || 0,
                        kisiSayisi: this.masaBilgisi.kisiSayisi || 0,
                    }
                    : null,
                toplamVergiliFiyat: orderItem.vergiliFiyat,
                toplamVergisizFiyat: orderItem.vergiliFiyat / 1.20,
                toplamIndirim: 0,
                siparisTarihi: new Date()
            };

            // Eğer müşteri bilgisi varsa
            if (this.customerId && this.customerId.trim() !== '' && this.customerInfoData) {
                initialOrderData.musteri = {
                    musteriId: this.customerId,
                    ad: this.customerInfoData.ad || '',
                    soyad: this.customerInfoData.soyad || '',
                    telefon: this.customerInfoData.telefon || '',
                    aciklama: this.customerInfoData.aciklama || ''
                };
            }

            // Eğer adres bilgisi varsa ilk sipariş ekleme sırasında da ekleyelim
            if (this.selectedAddressData && Object.values(this.selectedAddressData).some(val => typeof val === 'string' && val.trim() !== '')) {
                initialOrderData.siparisAdresi = {
                    adres: this.selectedAddressData.adres || '',
                    postaKodu: this.selectedAddressData.postaKodu || '',
                    sehir: this.selectedAddressData.il || '',
                    ulke: this.selectedAddressData.ulke || 'Türkiye',
                    aciklama: this.selectedAddressData.adresAciklama || '',
                    il: this.selectedAddressData.il || '',
                    ilce: this.selectedAddressData.ilce || '',
                    mahalle: this.selectedAddressData.mahalle || '',
                    yolAdi: this.selectedAddressData.yolAdi || '',
                    adresTipi: this.selectedAddressData.adresTipi || 'ev'
                };
            }

            this.orderService.createOrder(initialOrderData).subscribe({
                next: (response) => {
                    this.orderId = response._id || "0";
                    this.orderNo = response.orderNo;
                    this.currentOrderGelen = response;

                    // Sunucudan gelen güncel urunler listesini orderItems'a aktarın
                    this.orderItems = response.urunler.map((u: any) => ({
                        _id: u._id,
                        urunId: u.urunId,
                        urunAdi: u.urunAdi,
                        vergiliFiyat: u.vergiliFiyat,
                        yapildimi: u.yapildimi,
                        miktar: u.miktar,
                        items: u.items
                    }));

                    this.notificationService.showNotification(
                        `${orderItem.urunAdi} sepete eklendi.`,
                        'success',
                        'bottom-end'
                    );
                    this.calculateTotal();

                    const sumOfPayments = response.odemeler ? response.odemeler.reduce((acc: number, o: any) => acc + o.tutar, 0) : 0;
                    const total = this.totalAmount;
                    this.remainingAmount = Math.max(total - sumOfPayments, 0);
                    this.isFullyPaid = (sumOfPayments >= total);

                    this.orderStateService.setOrderItems(this.orderItems);
                },
                error: (err) => {
                    console.error('Yeni sipariş oluşturulurken hata:', err);
                    const errorMessage = err.error?.error || 'Sipariş oluşturulamadı.';
                    this.notificationService.showNotification(
                        errorMessage,
                        'error',
                        'bottom-right'
                    );
                }
            });

        } else {
            // orderId 0 değil, yani sipariş var. O zaman mevcut siparişe ürün ekleyeceğiz.
            this.orderItems.push(orderItem);
            this.notificationService.showNotification(
                `${orderItem.urunAdi} sepete eklendi.`,
                'success',
                'bottom-end'
            );
            this.calculateTotal();

            const orderData = this.generateOrderData(this.orderItems);
            this.orderService.updateOrder(this.orderId, orderData).subscribe({
                next: (response) => {
                    this.orderItems = response.urunler.map((u: any) => ({
                        _id: u._id,
                        urunId: u.urunId,
                        urunAdi: u.urunAdi,
                        vergiliFiyat: u.vergiliFiyat,
                        yapildimi: u.yapildimi,
                        miktar: u.miktar,
                        items: u.items
                    }));
                    this.orderStateService.setOrderItems(this.orderItems);
                    this.notificationService.showNotification(
                        'Sipariş başarıyla güncellendi.',
                        'success',
                        'bottom-right'
                    );
                },
                error: (err) => {
                    console.error('Sipariş güncellenirken hata:', err);
                    const errorMessage = err.error?.error || 'Sipariş güncellenemedi.';
                    this.notificationService.showNotification(errorMessage, 'error', 'bottom-right');
                }
            });
        }
    }



    findItemDetailsById(itemId: string): any {
        // (kod aynı)
        if (!this.selectedProduct || !this.selectedProduct.items) {
            return null;
        }
        const matchingItem = this.selectedProduct.items.find(item => item.itemId?.urunId === itemId);
        return matchingItem ? matchingItem.itemDetails : null;
    }
    closeProductDetailsModal(): void {
        // (kod aynı)
        this.productDetailsModal.close();
    }

    calculatePrice(): void {
        // (kod aynı)
        if (!this.selectedProduct) return;
        const selectedItems = this.getSelectedItems(this.selectedProduct.items || []);
        const totalPrice = selectedItems.reduce((sum, item) => sum + (item.itemDetails?.alisKdvOrani || 0) * item.miktar, 0);
        this.selectedProduct.calculatedPrice = totalPrice;
    }

    calculateOrderItemTotal(orderItem: any): number {
        // (kod aynı)
        const basePrice = orderItem.vergiliFiyat * orderItem.miktar;
        const subItemsTotal = this.calculateSubItemTotal(orderItem.items || []);
        return basePrice + subItemsTotal;
    }

    calculateTotal(): void {
        // (kod aynı)
        this.totalAmount = this.orderItems.reduce((total, item) => {
            const itemTotal = item.vergiliFiyat * item.miktar;
            const subItemTotal = this.calculateSubItemTotal(item.items || []);
            return total + itemTotal + subItemTotal;
        }, 0);
        this.updateOrderData(); // orderData update
    }
    calculateSubItemTotal(subItems: any[]): number {
        // (kod aynı)
        return subItems.reduce((total, subItem) => {
            if (!subItem.selected) {
                return total;
            }
            const subItemPrice = subItem.ekFiyat || 0;
            const deeperSubItemPrice = this.calculateSubItemTotal(subItem.itemDetails?.items || []);
            const urunItemPrice = this.calculateUrunItemTotal(subItem.itemDetails?.urunItems || []);
            return total + subItemPrice + deeperSubItemPrice + urunItemPrice;
        }, 0);
    }

    calculateUrunItemTotal(urunItems: any[]): number {
        // (kod aynı)
        return urunItems.reduce((total, urunItem) => {
            const urunItemPrice = urunItem.ekFiyat || 0;
            const deeperUrunItemPrice = urunItem.urun?.items
                ? this.calculateSubItemTotal(urunItem.urun.items)
                : 0;
            return total + urunItemPrice + deeperUrunItemPrice;
        }, 0);
    }

    updateOrderInfo(currentOrder: any): void {
        this.currentOrderGelen = currentOrder; // İlk atama: state.orderInfo'dan gelen order
        this.mockOrderSource = this.source;
        this.mockTableInfo = { tableName: currentOrder.masaAdi, tableNumber: currentOrder.masaId };
        this.mockCustomerInfo = currentOrder.musteriBilgisi
            ? { name: currentOrder.musteriBilgisi.ad + " " + currentOrder.musteriBilgisi.soyad }
            : { name: '' };
        this.orderNo = currentOrder.orderNo;
        this.orderId = currentOrder._id || "0";
        this.mockOrderDate = currentOrder.siparisTarihi.split('T')[0];
        this.mockOrderTime = currentOrder.siparisTarihi.split('T')[1].split('.')[0];
        this.orderUname = currentOrder.kullaniciAdi;

        // Sipariş durumu kontrolü
        if (currentOrder.statu === 'tamamlandi') {
            this.orderCompleted = true;
            this.showPaymentTypes = true;
            this.loadPaymentTypesComplated();
        } else {
            this.orderCompleted = false;
            this.showPaymentTypes = false;
        }

        if (this.orderId !== "0" && this.orderId !== null) {
            this.orderService.getOrder(this.orderId).subscribe({
                next: (response) => {
                    this.currentOrderGelen = response; // BURAYA DİKKAT: Gelen güncel order bilgisini currentOrderGelen'e atıyoruz.

                    this.orderItems = response.urunler;
                    this.calculateTotal();

                    if (response.coupons && response.coupons.length > 0) {
                        this.selectedCoupons = response.coupons.map((c: any) => ({
                            _id: c._id,
                            kod: c.kod,
                            indirimMiktari: c.indirimMiktari || 0,
                            kuponTipi: c.kuponTipi,
                            kullanildi: true
                        }));
                        this.calculateDiscountedTotal();
                    }
                    this.orderUname = response.kullaniciAdi || 'Bilinmiyor';


                    const sumOfPayments = response.odemeler ? response.odemeler.reduce((acc: number, o: any) => acc + o.tutar, 0) : 0;
                    const total = this.totalAmount;
                    this.remainingAmount = Math.max(total - sumOfPayments, 0);
                    this.isFullyPaid = (sumOfPayments >= total);


                    this.mockCustomerInfo = response.musteri
                        ? { name: response.musteri.ad + " " + response.musteri.soyad }
                        : { name: '' };
                    // orderStateService'e de set edelim
                    this.orderStateService.setOrderItems(this.orderItems);
                },
                error: (err) => {
                    console.error('sipariş çekildi:', err);
                },
            });
        }
    }


    applyCoupon(): void {
        // (kod aynı)
        this.openCouponModal();
    }

    openCouponModal(): void {
        // (kod aynı)
        this.couponModal.open();
    }

    closeCouponModal(): void {
        // (kod aynı)
        this.couponModal.close();
    }

    confirmApplyCoupon(): void {
        // (kod aynı)
        if (!this.couponCode || this.couponCode.trim() === '') {
            this.notificationService.showNotification('Lütfen geçerli bir kupon kodu girin', 'warning');
            return;
        }

        this.couponService.getCouponByCode(this.couponCode).subscribe({
            next: (coupon) => {
                console.log('Kupon Bilgisi:', coupon);

                if (this.isCouponValidForCurrentOrder(coupon)) {
                    this.selectedCoupons.push({
                        _id: coupon._id,
                        kod: this.couponCode,
                        indirimMiktari: coupon.indirimMiktari || 0,
                        kuponTipi: coupon.kuponTipi,
                        kullanildi: true
                    });

                    this.closeCouponModal();
                    this.notificationService.showNotification('Kupon başarıyla uygulandı!', 'success');
                    this.calculateDiscountedTotal();

                    // orderStateService'e kuponları da ekleyelim isterseniz
                    this.orderStateService.selectedCoupons = this.selectedCoupons; // << OrderStateService değişiklik
                } else {
                    this.notificationService.showNotification('Kupon belirtilen koşullarda geçerli değil.', 'warning');
                }
            },
            error: (err) => {
                console.error('Kupon doğrulama hatası:', err);
                this.notificationService.showNotification('Kupon bulunamadı veya geçersiz.', 'warning');
            }
        });
    }


    isCouponValidForCurrentOrder(coupon: any): boolean {
        // (kod aynı)
        const now = new Date();
        if (!coupon.baslangicTarihi || !coupon.bitisTarihi) {
            this.notificationService.showNotification('Kuponun geçerlilik tarihleri eksik.', 'warning');
            return false;
        }
        if (now < new Date(coupon.baslangicTarihi) || now > new Date(coupon.bitisTarihi)) {
            this.notificationService.showNotification('Kuponun geçerlilik süresi dolmuş veya henüz başlamamış.', 'warning');
            return false;
        }
        const usedCouponItem = coupon.kuponOgesi?.find((ko: any) => ko.kod === this.couponCode);
        if (!usedCouponItem) {
            this.notificationService.showNotification('Bu kupon geçerli değil (Kod bulunamadı).', 'warning');
            return false;
        }
        if (usedCouponItem.kullanildi) {
            this.notificationService.showNotification('Bu kupon daha önce kullanılmış.', 'warning');
            return false;
        }
        if (coupon.satisKaynaklari && coupon.satisKaynaklari.length > 0) {
            const kaynakIds = coupon.satisKaynaklari.map((id: string) => id.toString());
            if (!this.satiskaynakid) {
                this.notificationService.showNotification('Satış kaynağı tanımlı değil.', 'warning');
                return false;
            }
            if (!kaynakIds.includes(this.satiskaynakid.toString())) {
                this.notificationService.showNotification('Bu kupon bu satış kaynağında geçerli değil.', 'warning');
                return false;
            }
        }
        if (coupon.magazalar && coupon.magazalar.length > 0) {
            const magazaIds = coupon.magazalar
                .filter((m: any) => m && m._id)
                .map((m: any) => m._id.toString());

            if (!this.store) {
                this.notificationService.showNotification('Mağaza bilgisi bulunamadı.', 'warning');
                return false;
            }
            if (!magazaIds.includes(this.store.toString())) {
                this.notificationService.showNotification('Bu kupon bu mağazada geçerli değil.', 'warning');
                return false;
            }
        }
        if (coupon.urunler && coupon.urunler.length > 0) {
            const couponUrunIds = coupon.urunler
                .filter((u: any) => u && u._id)
                .map((u: any) => u._id.toString());

            const orderItemUrunIds = this.orderItems.map((item: any) => item.urunId?.toString());
            const match = orderItemUrunIds.some((urunId: string) => couponUrunIds.includes(urunId));
            if (!match) {
                this.notificationService.showNotification('Bu kupon siparişinizdeki ürünler için geçerli değil.', 'warning');
                return false;
            }
        }

        return true;
    }



    calculateDiscountedTotal(): void {
        // (kod aynı)
        this.calculateTotal();
        if (!this.selectedCoupons || this.selectedCoupons.length === 0) return;

        let discountedTotal = this.totalAmount;
        for (const coupon of this.selectedCoupons) {
            if (coupon.kuponTipi === 'indirim-yuzde') {
                discountedTotal = discountedTotal * (1 - (coupon.indirimMiktari / 100));
            } else if (coupon.kuponTipi === 'indirim-tl') {
                discountedTotal = discountedTotal - coupon.indirimMiktari;
                if (discountedTotal < 0) discountedTotal = 0;
            } else if (coupon.kuponTipi === 'bedava') {
                discountedTotal = 0;
            }
        }

        this.totalAmount = discountedTotal;
    }

    removeCoupon(index: number): void {
        if (this.orderCompleted) {
            // Sipariş tamamlandı, hiçbir değişiklik yapma
            this.notificationService.showNotification('Tamamlanmış bir siparişe müdahale edemezsiniz.', 'warning', 'topRight');
            return;
        }
        // (kod aynı)
        this.selectedCoupons.splice(index, 1);
        this.calculateDiscountedTotal();
        // orderStateService kupon güncelle
        this.orderStateService.selectedCoupons = this.selectedCoupons; // << OrderStateService değişiklik
    }

    isItemFullyPaid(item: OrderItem): boolean {
        const totalItemPrice = this.calculateOrderItemTotal(item);
        const paidAmount = (item.partialPayments || []).reduce((sum, p) => sum + p.tutar, 0);
        return paidAmount >= totalItemPrice;
    }

    // Kısmi ödeme ekranında sadece tam ödenmemiş ürünleri göstermek istiyoruz
    getNotFullyPaidItems(): OrderItem[] {
        return this.orderItems.filter(item => {
            // Bu ürüne yapılmış tüm kısmi ödemeleri toplayalım
            const paidAmount = (item.partialPayments || []).reduce((sum, p) => sum + p.tutar, 0);

            // Eğer ödenen miktar 0 ise (hiç ödeme yapılmadıysa), bu ürünü listede göster.
            // Eğer ödenen miktar 0'dan büyükse, demek ki kısmen veya tamamen ödeme yapılmış,
            // bu durumda ürünü tekrar "Ödemeyi Böl" ekranında göstermiyoruz.
            return paidAmount === 0;
        });
    }
    ngAfterViewInit(): void {
        const lightbox = GLightbox({
            selector: '.glightbox' // Replace with your selector as needed
        });
    }


}
