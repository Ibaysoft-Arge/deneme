// product.model.ts
import { Category, Item, SubCategory } from './item.model';

export interface Product {
    urunId: string;
    urunAdi: string;
    aciklama: string;
    user: string;
    urunKategori: Category;
    urunAltKategori: SubCategory;
    urunResmi: string;
    qrcodeUrl: string;
    barcode: string;
    standartFiyat: number;
    ozelFiyat: number;
    yapildimi: string;
    isOzelFiyat: boolean;

    items: Item[];
    maxSecimSayisi: number;
    olusturmaTarihi: string;
    guncellemeTarihi: string;
    __v: number;
    selected?: boolean;
    calculatedPrice?: number;
}


interface CouponData {
    _id: string;
    kod: string;
    indirimMiktari: number;
    kuponTipi: string;
    kullanildi: boolean;
  }

  interface OrderData {
    magazaKodu: string;
    satisKaynak: string;
    urunler: {
      _id: any;
      urunId: any;
      urunAdi: any;
      miktar: any;
      vergisizFiyat: number;
      vergiliFiyat: number;
      yapildimi: any;
      indirim: number;
      items: any[];
    }[];
    masaBilgisi?: {
      masaId: string;
      cuverUcreti: number;
      kisiSayisi: number;
    } | null;
    toplamVergisizFiyat: number;
    toplamVergiliFiyat: number;
    toplamIndirim: number;
    siparisTarihi: Date;
    coupons?: CouponData[];
  }
