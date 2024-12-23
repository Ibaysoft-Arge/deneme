import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-recursive-detail-Arti',
  template: `
    <ul class="list-disc list-inside space-y-1">
      <ng-container *ngFor="let detail of items">
        <ng-container *ngIf="getItemName(detail) as itemName">
          <div *ngFor="let urunitem of detail.urun.items"  >

          <div *ngIf="urunitem.selected">
            <li class="list-inside space-y-1">
            <!-- Ana öğe adı -->
            <span
              *ngIf="itemName?.name"
              [ngClass]="{
                'line-through text-gray-100': itemName.isExcluded,
                'text-sm': !itemName.isExcluded
              }"
            >
              {{ urunitem.itemId.urunAdi | capitalize }}
            </span>
            <span *ngIf="urunitem.ekFiyat > 0" class="text-green-400">
              +{{ urunitem.ekFiyat || 0 | dynamicCurrency: 'TRY' }}
            </span>

            <!-- itemDetails içindeki items -->
            </li>
          </div>
          </div>

        </ng-container>
        <ng-container *ngIf="getItemNameARti(detail) as itemNameArti">

          <div *ngFor="let urunitem of detail.items" >
            <div *ngIf="urunitem.selected">

            <li class="list-inside space-y-1">

            <!-- Ana öğe adı -->
            <span

            >
              {{ urunitem.itemId.urunAdi | capitalize }}
            </span>
            <span *ngIf="urunitem.ekFiyat > 0" class="text-green-400">
              +{{ urunitem.ekFiyat || 0 | dynamicCurrency: 'TRY' }}
            </span>
            </li>
            <!-- itemDetails içindeki items -->
            </div>
          </div>

        </ng-container>
      </ng-container>
    </ul>
  `,
})
export class RecursiveArtiDetailComponent {
  @Input() items: any[] = [];

  ngOnInit(): void {
  //  console.log('itemsxxx:', this.items);
  }
  getItemNameARti(detail: any): { name: string; isExcluded: boolean } | null {
  //  console.log('detailxxx', detail);


        return { name: "a" , isExcluded: false };; // Eğer hiçbir koşul karşılanmazsa null döner
      }
  getItemName(detail: any): { name: string; isExcluded: boolean } | null {
//console.log('detailxxx', detail);
    if (detail === false) {
      if (detail.selected === true) {
        return { name: detail.itemDetails?.urunAdi || detail.urun?.urunAdi, isExcluded: true };
      }
    } else if (detail.itemDetails?.urunAdi || detail.urun?.urunAdi) {
      return { name: detail.itemDetails?.urunAdi || detail.urun?.urunAdi, isExcluded: false };
    }

    return null; // Eğer hiçbir koşul karşılanmazsa null döner
  }
}
