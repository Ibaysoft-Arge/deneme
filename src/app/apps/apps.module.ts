import { NgModule } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';

// shared module
import { SharedModule } from 'src/shared.module';

import { ScrumboardComponent } from './scrumboard';
import { ContactsComponent } from './contacts';
import { NotesComponent } from './notes';
import { TodolistComponent } from './todolist';
import { InvoicePreviewComponent } from './invoice/preview';
import { InvoiceAddComponent } from './invoice/add';
import { InvoiceEditComponent } from './invoice/edit';
import { CalendarComponent } from './calendar';
import { ChatComponent } from './chat';
import { MailboxComponent } from './mailbox';
import { InvoiceListComponent } from './invoice/list';
import { PermissionComponent } from './permission';
import { StokComponent } from './pages/stok';
import { MagazalarimComponent } from './pages/magazalarim';
import { PageAccessGuard } from './PageAccessGuard';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgSelectModule } from '@ng-select/ng-select';
import { IconModule } from '../shared/icon/icon.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IMaskModule } from 'angular-imask';
import { UserAccountSettingsComponent } from '../users/user-account-settings';
import { AuthGuard } from './AuthGuard';
import { RecipeComponent } from './pages/recipe';
import { UrunComponent } from './pages/urun.component';
import { NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { CouponComponent } from './pages/coupon.component';
import { MenuComponent } from './pages/menu.component';
import { SatisKaynakComponent } from './pages/satiskaynak';
import { MasaComponent } from './pages/masa.component';
import { QrMenuAyarlarComponent } from './pages/qrmenuayarlar';
import { HeaderComponent } from '../layouts/header';
import { OdemeTipiComponent } from './pages/odemetipi';
import { OrderComponent } from './pages/order';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { KeepOriginalOrderPipe } from './pages/keep-original-order.pipe';

import { GelalComponent } from './pages/gelal.component';
import { CapitalizePipe } from './pages/capitalize.pipe';
import { ButtonPanelComponent } from './pages/ordercomponent/ButtonPanelComponent';
import { SiparisOzetiComponent } from './pages/ordercomponent/SiparisOzetiComponent';
import { KategorilerComponent } from './pages/ordercomponent/KategorilerComponent';
import { ProductListComponent } from './pages/ordercomponent/product-list.component';
import { AppItemComponent } from './pages/ordercomponent/AppItemComponent';
import { PaketComponent } from './pages/paket.component';
import { YemekSepetiSettingsComponent } from './pages/yemeksepeti/yemeksepetientegrasyon';
import { TrendyolSettingsComponent } from './pages/trendyol/trendyolentegrasyon';
import { MigrosSettingsComponent } from './pages/migros/migrosentegrasyon';
import { GofodySettingsComponent } from './pages/gofody/gofodyentegrasyon';
import { GetirSettingsComponent } from './pages/getir/getirentegrasyon';
import { DynamicCurrencyPipe } from './dynamic-currency.pipe';
import { OrderDataService } from '../service/order-data.service';
import { SiparisOzetiMusteriComponent } from './pages/ordercomponent/siparis-ozeti-musteri.component';
import { CikisIrsaliyeComponent } from './pages/irsaliye/cikisIrsaliye';
import { GirisIrsaliyeComponent } from './pages/irsaliye/girisirsaliye';
import { SiparisEkraniOlusturmaComponent } from './pages/siparisEkrani/siparisEkraniOlusturma';
import { SayimComponent } from './pages/sayim/sayim';
import { KitchenComponent } from './pages/kitchen';
import { AltUrunHierarchyComponent } from './pages/ordercomponent/alturun-hierarchy.component';
import { DashboardComponent } from './pages/dashboard';
import { ProductSalesComponent } from './pages/raporlar/ProductSalesComponent';
import { StoreRevenueComponent } from './pages/raporlar/StoreRevenueComponent';
import { StoreSourceReportComponent } from './pages/raporlar/StoreSourceReportComponent';
import { HourlySalesByStoreComponent } from './pages/raporlar/hourly-sales-by-store.component';
import { ReportBuilderComponent } from './pages/raporlar/report-builder.component';
import { FieldPanelComponent } from './companent/field-panel.component';
import { LayoutPanelComponent } from './companent/layout-panel.component';
import { FilterPanelComponent } from './companent/filter-panel.component';
import { ReportTableComponent } from './companent/report-table.component';
import { DataSourcePanelComponent } from './companent/data-source-panel.component';
import { PaymentReportComponent } from './pages/raporlar/PaymentReportComponent';
import { DailyEndReportComponent } from './pages/raporlar/DailyEndReportComponent';
import { DailyEndHistoryComponent } from './pages/raporlar/daily-end-history.component';
import { StockMovementsComponent } from './pages/raporlar/stock-movements.component';
import { OrderListComponent } from './pages/raporlar/OrderListComponent';
import { RegionSalesReportComponent } from './pages/raporlar/region-sales-report.component';
import { VerimlilikComponent } from './pages/raporlar/verimlilik.component';
import { CariComponent } from './pages/cari';


const routes: Routes = [
    { path: 'apps/chat', component: ChatComponent, canActivate: [AuthGuard] ,data: { title: 'Chat' } },
    { path: 'apps/mailbox', component: MailboxComponent, canActivate: [AuthGuard] , data: { title: 'Mailbox' } },
    { path: 'apps/scrumboard', component: ScrumboardComponent, data: { title: 'Scrumboard' } },
    { path: 'apps/contacts', component: ContactsComponent, canActivate: [AuthGuard] , data: { title: 'Contacts' } },
    { path: 'apps/notes', component: NotesComponent, canActivate: [AuthGuard] , data: { title: 'Notes' } },
    { path: 'apps/todolist', component: TodolistComponent, canActivate: [AuthGuard] , data: { title: 'Todolist' } },
    { path: 'apps/invoice/list', component: InvoiceListComponent, canActivate: [AuthGuard] , data: { title: 'Invoice List' } },
    { path: 'apps/invoice/preview', component: InvoicePreviewComponent, canActivate: [AuthGuard] , data: { title: 'Invoice Preview' } },
    { path: 'apps/invoice/add', component: InvoiceAddComponent, canActivate: [AuthGuard] , data: { title: 'Invoice Add' } },
    { path: 'apps/invoice/edit', component: InvoiceEditComponent, canActivate: [AuthGuard] , data: { title: 'Invoice Edit' } },
    { path: 'apps/calendar', component: CalendarComponent, canActivate: [AuthGuard] , data: { title: 'Calendar' } },
    { path: 'apps/permission', component: PermissionComponent, canActivate: [AuthGuard] , data: { title: 'Permission' } },
    { path: 'apps/stok', component: StokComponent, canActivate: [AuthGuard,PageAccessGuard] , data: { title: 'Stok' } },
    { path: 'apps/magazalarim', component: MagazalarimComponent, canActivate: [AuthGuard,PageAccessGuard], data: { title: 'Mağazalarım' } },
    { path: 'apps/urun', component: UrunComponent, canActivate: [AuthGuard,PageAccessGuard], data: { title: 'Ürünler' } },
    { path: 'apps/recete', component: RecipeComponent , canActivate: [AuthGuard,PageAccessGuard], data: { title: 'Reçete' } },
    { path: 'apps/kupon', component: CouponComponent , canActivate: [AuthGuard,PageAccessGuard], data: { title: 'Kupon' } },
    { path: 'apps/menu', component: MenuComponent , canActivate: [AuthGuard,PageAccessGuard], data: { title: 'Menü' } },
    { path: 'apps/masa', component: MasaComponent , canActivate: [AuthGuard,PageAccessGuard], data: { title: 'Masaya Satış' } },
    { path: 'apps/satis-kaynak', component: SatisKaynakComponent , canActivate: [AuthGuard,PageAccessGuard], data: { title: 'Satış Kaynak' } },
    { path: 'apps/qrayarlar', component: QrMenuAyarlarComponent , canActivate: [AuthGuard,PageAccessGuard], data: { title: 'Qr Menü Ayalar' } },
    { path: 'apps/odemetipi', component: OdemeTipiComponent , canActivate: [AuthGuard,PageAccessGuard], data: { title: 'Ödeme Tipi' } },
    { path: 'apps/order', component: OrderComponent , canActivate: [AuthGuard], data: { title: 'Sipariş Sayfası' } },
    { path: 'apps/gelal', component: GelalComponent , canActivate: [AuthGuard], data: { title: 'Gel Al Sayfası' } },
    { path: 'apps/paket', component: PaketComponent , canActivate: [AuthGuard], data: { title: 'Paket Sayfası' } },
    { path: 'apps/yemeksepetientegrasyon', component: YemekSepetiSettingsComponent , canActivate: [AuthGuard], data: { title: 'Yemek Sepeti Sayfası' } },
    { path: 'apps/trendyolentegrasyon', component: TrendyolSettingsComponent , canActivate: [AuthGuard], data: { title: 'Yemek Sepeti Sayfası' } },
    { path: 'apps/migrosentegrasyon', component: MigrosSettingsComponent , canActivate: [AuthGuard], data: { title: 'Migros Sayfası' } },
    { path: 'apps/gofodyentegrasyon', component: GofodySettingsComponent , canActivate: [AuthGuard], data: { title: 'Gofody Sayfası' } },
    { path: 'apps/getirentegrasyon', component: GetirSettingsComponent , canActivate: [AuthGuard], data: { title: 'Getir Sayfası' } },
    { path: 'apps/cikisirsaliye', component: CikisIrsaliyeComponent , canActivate: [AuthGuard], data: { title: 'Çıkış İrsaliye' } },
    { path: 'apps/girisirsaliye', component: GirisIrsaliyeComponent , canActivate: [AuthGuard], data: { title: 'Giriş İrsaliye' } },
    { path: 'apps/sayim', component: SayimComponent , canActivate: [AuthGuard], data: { title: 'Sayım' } },
    { path: 'apps/kitchen', component: KitchenComponent , canActivate: [AuthGuard], data: { title: 'Mutfak Ekranı' } },
    { path: 'apps/dashboard', component: DashboardComponent , canActivate: [AuthGuard], data: { title: 'Dashboard' } },
    { path: 'apps/siparisolusturmaekrani', component: SiparisEkraniOlusturmaComponent , canActivate: [AuthGuard], data: { title: 'Sipariş Oluşturma Ekranı' } },
    { path: 'apps/ProductSalesReport', component: ProductSalesComponent , canActivate: [AuthGuard], data: { title: 'Ürün Satış Raporu' } },
    { path: 'apps/SalesStoreReport', component: StoreRevenueComponent , canActivate: [AuthGuard], data: { title: 'Mağaza Ciro Raporu' } },
    { path: 'apps/StoreSourceSalesReport', component: StoreSourceReportComponent , canActivate: [AuthGuard], data: { title: 'Kaynak Bazlı Mağazar Ciro Raporu' } },
    { path: 'apps/SoruceHoursSalesReport', component: HourlySalesByStoreComponent , canActivate: [AuthGuard], data: { title: 'Saatlik Satış Raporu' } },
    { path: 'apps/ReportBuilder', component: ReportBuilderComponent , canActivate: [AuthGuard], data: { title: 'Rapor Sihirbazı' } },
    { path: 'apps/paymentreport', component: PaymentReportComponent , canActivate: [AuthGuard], data: { title: 'Ödeme Bazında Rapor' } },
    { path: 'apps/gunsonu', component: DailyEndReportComponent , canActivate: [AuthGuard], data: { title: 'Gün sonu' } },
    { path: 'apps/gecmisgunsonu', component: DailyEndHistoryComponent , canActivate: [AuthGuard], data: { title: 'Geçmiş Gün sonu' } },
    { path: 'apps/skureports', component: StockMovementsComponent , canActivate: [AuthGuard], data: { title: 'Sku Hareketleri Raporu' } },
    { path: 'apps/siparisList', component: OrderListComponent , canActivate: [AuthGuard], data: { title: 'Sipariş Listesi' } },
    { path: 'apps/regionsales', component: RegionSalesReportComponent , canActivate: [AuthGuard], data: { title: 'Bölge Satış Listesi' } },
    { path: 'apps/verimlilikreport', component: VerimlilikComponent , canActivate: [AuthGuard], data: { title: 'Verimlilik Raporu' } },
    { path: 'apps/cariler', component: CariComponent , canActivate: [AuthGuard], data: { title: 'Cari' } },

];

@NgModule({
    imports: [RouterModule.forChild(routes), CommonModule, SharedModule.forRoot(), NgxPaginationModule, NgSelectModule, IconModule, FormsModule, ReactiveFormsModule, IMaskModule,NgbModalModule,DragDropModule],
    declarations: [
        ChatComponent,
        ScrumboardComponent,
        ContactsComponent,
        NotesComponent,
        TodolistComponent,
        InvoiceListComponent,
        InvoicePreviewComponent,
        InvoiceAddComponent,
        InvoiceEditComponent,
        CalendarComponent,
        MailboxComponent,
        PermissionComponent,
        StokComponent,
        MagazalarimComponent,
        RecipeComponent,
        UrunComponent,
        CouponComponent,
        MenuComponent,
        SatisKaynakComponent,
        MasaComponent,
        QrMenuAyarlarComponent,
        OdemeTipiComponent,
        OrderComponent,
        KeepOriginalOrderPipe,
        GelalComponent,
        CapitalizePipe,
        ButtonPanelComponent,
        SiparisOzetiComponent,
        SiparisOzetiMusteriComponent,
        KategorilerComponent,
        ProductListComponent,
        AppItemComponent,
        PaketComponent,
        YemekSepetiSettingsComponent,
        TrendyolSettingsComponent,
        MigrosSettingsComponent,
        GofodySettingsComponent,
        GetirSettingsComponent,
        DynamicCurrencyPipe,
        CikisIrsaliyeComponent,
        GirisIrsaliyeComponent,
        SayimComponent,
        KitchenComponent,
        AltUrunHierarchyComponent,
        DashboardComponent,
        SiparisEkraniOlusturmaComponent,
        ProductSalesComponent,
        StoreRevenueComponent,
        StoreSourceReportComponent,
        HourlySalesByStoreComponent,
        ReportBuilderComponent,
        FieldPanelComponent,
        LayoutPanelComponent,
        FilterPanelComponent,
        ReportTableComponent,
        DataSourcePanelComponent,
        PaymentReportComponent,
        DailyEndReportComponent,
        DailyEndHistoryComponent,
        StockMovementsComponent,
        OrderListComponent,
        RegionSalesReportComponent,
        VerimlilikComponent,
        CariComponent
    ],
    providers: [CurrencyPipe,OrderDataService,DynamicCurrencyPipe],
})
export class AppsModule { }
