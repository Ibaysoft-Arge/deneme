// category.model.ts

export interface Category {
    _id: string;
    ad: string;
    // Diğer gerekli alanlar...
  }

  export interface SubCategory {
    _id: string;
    ad: string;
    urunkategori: string | Category;
    aciklama?: string;
    // Diğer gerekli alanlar...
  }
