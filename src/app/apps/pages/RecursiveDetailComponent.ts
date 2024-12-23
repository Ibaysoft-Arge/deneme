import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-recursive-detail',
  template: `
    <ul class="list-disc list-inside space-y-1">
      <ng-container *ngFor="let detail of items">
        <ng-container *ngIf="getItemName(detail) as itemName">
          <li class="list-inside space-y-1">
            <!-- Ana öğe adı -->
            <span
              *ngIf="itemName?.name"
              [ngClass]="{
                'line-through text-gray-100': itemName.isExcluded,
                'text-sm': !itemName.isExcluded
              }"
            >
              {{ itemName.name | capitalize }}
            </span>
            <span *ngIf="detail.ekFiyat > 0" class="text-green-400">
              +{{ detail.ekFiyat || 0 | dynamicCurrency: 'TRY' }}
            </span>

            <div *ngIf="detail.itemDetails?.urunItems?.length > 0"
                                class="mt-2 pl-6 border-l border-gray-300">

                                <app-recursive-detail-Arti [items]="detail.itemDetails.urunItems"></app-recursive-detail-Arti>
                            </div>
            <!-- itemDetails içindeki items -->
            <div
              *ngIf="detail.itemDetails?.items?.length > 0"
              class="mt-2 pl-6 border-l border-gray-300"
            >
              <app-recursive-detail [items]="detail.itemDetails.items"></app-recursive-detail>
            </div>

          </li>
        </ng-container>
      </ng-container>
    </ul>
  `,
})
export class RecursiveDetailComponent {
  @Input() items: any[] = [];

  getItemName(detail: any): { name: string; isExcluded: boolean } | null {
    if (detail.istenmeyen === false) {
      if (detail.selected === true) {
        return { name: detail.itemDetails?.urunAdi || detail.urun?.urunAdi, isExcluded: true };
      }
    } else if (detail.itemDetails?.urunAdi || detail.urun?.urunAdi) {
      return { name: detail.itemDetails?.urunAdi || detail.urun?.urunAdi, isExcluded: false };
    }

    return null; // Eğer hiçbir koşul karşılanmazsa null döner
  }
}
