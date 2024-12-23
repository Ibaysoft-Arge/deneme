import { NgModule } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';

// shared module
import { SharedModule } from 'src/shared.module';
import { BoxedLockscreenComponent } from './boxed-lockscreen';
import { BoxedPasswordResetComponent } from './boxed-password-reset';
import { BoxedSigninComponent } from './boxed-signin';
import { BoxedSignupComponent } from './boxed-signup';
import { CoverLockscreenComponent } from './cover-lockscreen';
import { CoverLoginComponent } from './cover-login';
import { CoverPasswordResetComponent } from './cover-password-reset';
import { CoverPasswordComponent } from './cover-password';
import { CoverRegisterComponent } from './cover-register';
import { LandingComponent } from './landing';
import { AboutComponent } from './about';
import { ServicesComponent } from './services';
import { ContactComponent } from './contact';
import { QrMenuComponent } from './qrmenu';
import { KeepOriginalQrPipe } from './keep-original-qr.pipe';
import { DynamicqRCurrencyPipe } from './dynamicqR-currency.pipe';
import { PosSystemComponent } from './possystem';
import { StockManagementComponent } from './stockmanagement';
import { CourierApplicationComponent } from './courierapplication';
import { WaiterApplicationComponent } from './waiterapplication';
import { LoyaltyApplicationComponent } from './loyaltyapplication';
import { BusinessManagementComponent } from './businessmanagement';
import { MarketplacesComponent } from './marketplaces';
import { PaymentComponent } from './payment';
import { AccountingComponent } from './accounting';
import { ECommerceComponent } from './ecommerce';
import { EInvoiceComponent } from './einvoice';
import { HotelComponent } from './hotel';
import { VirtualPBXComponent } from './virtualpbx';
import { CashRegisterPOSComponent } from './cashregisterpos';



const routes: Routes = [
    { path: 'auth/boxed-lockscreen', component: BoxedLockscreenComponent, data: { title: 'Boxed Lockscreen' } },
    {
        path: 'auth/boxed-password-reset',
        component: BoxedPasswordResetComponent,
        data: { title: 'Boxed Password Reset' },
    },
    { path: 'auth/boxed-signin', component: BoxedSigninComponent, data: { title: 'Boxed Signin' } },
    { path: 'auth/boxed-signup', component: BoxedSignupComponent, data: { title: 'Boxed Signup' } },
    { path: 'auth/cover-lockscreen', component: CoverLockscreenComponent, data: { title: 'Cover Lockscreen' } },
    { path: 'auth/cover-login', component: CoverLoginComponent, data: { title: 'Login' } },
    {
        path: 'auth/cover-password-reset',
        component: CoverPasswordResetComponent,
        data: { title: 'Cover Password Reset' },
    },
    {
        path: 'auth/cover-password',
        component: CoverPasswordComponent,
        data: { title: 'Cover Password' },
    },
    { path: 'auth/cover-register', component: CoverRegisterComponent, data: { title: 'Register' } },
    { path: 'auth/landing', component: LandingComponent, data: { title: 'Landing' } },
    { path: 'auth/about', component: AboutComponent, data: { title: 'About' } },
    { path: 'auth/services', component: ServicesComponent, data: { title: 'Services' } },
    { path: 'auth/qrmenu', component: QrMenuComponent, data: { title: 'QR Menu' } },
    { path: 'auth/contact', component: ContactComponent, data: { title: 'Contact' } },
    { path: 'auth/possystem', component: PosSystemComponent, data: { title: 'Pos System' } },
    { path: 'auth/stockmanagement', component: StockManagementComponent, data: { title: 'Stock Management' } },
    { path: 'auth/courierapplication', component: CourierApplicationComponent, data: { title: 'Courier Application' } },
    { path: 'auth/waiterapplication', component: WaiterApplicationComponent, data: { title: 'Waiter Application' } },
    { path: 'auth/loyaltyapplication', component: LoyaltyApplicationComponent, data: { title: 'Loyalty Application' } },
    { path: 'auth/businessmanagement', component: BusinessManagementComponent, data: { title: 'Business Management' } },
    { path: 'auth/marketplaces', component:MarketplacesComponent, data: { title: 'Market Places' } },
    { path: 'auth/payment', component:PaymentComponent, data: { title: 'Payment' } },
    { path: 'auth/accounting', component:AccountingComponent, data: { title: 'Accounting' } },
    { path: 'auth/ecommerce', component:ECommerceComponent, data: { title: 'E-Commmerce' } },
    { path: 'auth/einvoice', component:EInvoiceComponent, data: { title: 'E-Invoice' } },
    { path: 'auth/hotel', component:HotelComponent, data: { title: 'Hotel' } },
    { path: 'auth/virtualpbx', component:VirtualPBXComponent, data: { title: 'Virtual PBX' } },
    { path: 'auth/cashregisterpos', component:CashRegisterPOSComponent, data: { title: 'Cash Register POS' } },

];
@NgModule({
    imports: [RouterModule.forChild(routes), CommonModule, SharedModule.forRoot()],
    declarations: [
        BoxedLockscreenComponent,
        BoxedPasswordResetComponent,
        BoxedSigninComponent,
        BoxedSignupComponent,
        CoverLockscreenComponent,
        CoverLoginComponent,
        CoverPasswordResetComponent,
        CoverPasswordComponent,
        CoverRegisterComponent,
        LandingComponent,
        AboutComponent,
        ServicesComponent,
        QrMenuComponent,
        ContactComponent,
        KeepOriginalQrPipe,
        DynamicqRCurrencyPipe,
        PosSystemComponent,
        StockManagementComponent,
        CourierApplicationComponent,
        WaiterApplicationComponent,
        LoyaltyApplicationComponent,
        BusinessManagementComponent,
        MarketplacesComponent,
        PaymentComponent,
        AccountingComponent,
        ECommerceComponent,
        EInvoiceComponent,
        HotelComponent,
        VirtualPBXComponent,
        CashRegisterPOSComponent,
        
    ],
    providers: [CurrencyPipe],
})
export class AuthModule {}
