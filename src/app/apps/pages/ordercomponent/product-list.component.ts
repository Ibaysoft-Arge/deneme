import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
    selector: 'app-product-list',
    templateUrl: './product-list.component.html'
})
export class ProductListComponent {
    @Input() groupedProducts: Map<string, any[]> | null = new Map<string, any[]>();


    @Output() productClick = new EventEmitter<any>(); // Ürün tıklandığında dışarıya aktarılacak olay

    // Ürün resmi URL'sini alır
    // getImageUrl(product: any): string | null {
    //     const invalidValues = ['d', 'null', 'undefined', '', ' '];
    //     const base64Pattern = /^data:image\/(png|jpeg|jpg|gif);base64,/;
    //     return invalidValues.includes(product?.urunResmi?.trim()) || !base64Pattern.test(product?.urunResmi)
    //         ? null
    //         : product.urunResmi;
    // }

    getImageUrl(product: any): string | null {
       
        if (product?.urunResmi) {
            return product.urunResmi; 
        }
        return null; 
    }

    // Ürün tıklandığında dışarıya aktar
    onProductClick(product: any): void {
        this.productClick.emit(product);
    }
    trackByGroupKey(index: number, group: any): string {
        return group.key; // Grup için benzersiz bir anahtar döndür
    }

    trackByProductId(index: number, product: any): string {
        return product.urunId; // Ürün için benzersiz bir ID döndür
    }
}
