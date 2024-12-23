export interface Item {
    tip: string;
    itemId: ItemId;
    urunAdi: string;
    miktar: number;
    birim: string;
    ekFiyat: number;
    _id: string;
    item?:Item;
    itemDetails?: ItemDetails;
    selected?: boolean;
    disabled?: boolean;
    parent?: Item;
    maxSecimSayisi?: number;
    showDetails?: boolean; // Yeni ekleme
    yapildimi?: string;
}
export interface urunItemalt {
    _id: string;
    items?:Item[];

}

export interface urunItem {
    miktar: number;
    birim: string;
    _id: string;
    urun?:urunItemalt;

}

export interface ItemId {
    urunId: string;
    user: string;
    skuKod: string;
    urunAdi: string;
    kategori: string;
    altKategori: string;
    rafOmruGun: number;
    aciklama: string | null;
    barcode: string;
    renk: string;
    seriTakip: boolean;
    muhasebeKodu: string;
    anaBirim: string;
    altBirimler: AltBirim[];
    alisKdvOrani: number;
    satisKdvOrani: number;
    aktif: boolean;
    createdAt: string;
    updatedAt: string;
    __v: number;
}
export interface ItemDetails {
    urunId: string;
    user: string;
    skuKod: string;
    urunAdi: string;
    kategori: Category;
    altKategori: SubCategory;
    rafOmruGun: number;
    aciklama: string | null;
    barcode: string;
    renk: string;
    seriTakip: boolean;
    muhasebeKodu: string;
    anaBirim: string;
    altBirimler: AltBirim[];
    alisKdvOrani: number;
    satisKdvOrani: number;
    aktif: boolean;
    createdAt: string;
    updatedAt: string;
    __v: number;
    items?: Item[];
    urunItems?: urunItem[];
    showDetailsUrun?: boolean;
    selected?: boolean;
    disabled?: boolean;
    maxSecimSayisi?: number;
}


export interface Category {
    _id: string;
    ad: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
}

export interface SubCategory {
    _id: string;
    ad: string;
    kategori: string;
    aciklama: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
}

export interface AltBirim {
    birimAdi: string;
    katsayi: number;
    _id: string;
}
