import { Component, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { Item, urunItem } from './item.model';
import { Product } from './product.model';
import { NotificationService } from '../../NotificationService';

@Component({
    selector: 'app-item',
    templateUrl: './app-item.component.html',
})
export class AppItemComponent {
    @Input() item!: Item;
    @Input() parentItem?: Item;
    @Input() product?: Product;
    @Output() selectionChangeEvent = new EventEmitter<Item>();

    constructor(private cdr: ChangeDetectorRef, private notificationService: NotificationService,) { }

    onSelectionChange(): void {

        const siblings = this.parentItem?.itemDetails?.items || this.product?.items || [];
        const maxSecimSayisi = this.parentItem?.maxSecimSayisi || this.product?.maxSecimSayisi || 0;

        const selectedCount = siblings.filter((sibling) => sibling.selected).length;

     //   console.log("pp:", this.parentItem);
        // Eğer seçim sınırını aşıyorsa, seçimi iptal et
        // if (this.item.selected && selectedCount > maxSecimSayisi && maxSecimSayisi > 0) {
        //     this.item.selected = false;
        //     this.notificationService.showNotification(
        //         `En fazla ${maxSecimSayisi} adet seçim yapabilirsiniz.`,
        //         'warning',
        //         'topRight'
        //     );
        //     return;
        // }

        // Parent seçim durumunu güncelle
        if (this.parentItem) {
            this.parentItem.selected = siblings.some((sibling) => sibling.selected);
        }



        this.selectionChangeEvent.emit(this.item);
        this.cdr.detectChanges();
    }



    selectChildItems(item: Item): void {
        item.itemDetails?.items?.forEach((child) => {
            child.selected = true;
            this.selectChildItems(child);
        });
    }

    deselectChildItems(item: Item): void {
        item.itemDetails?.items?.forEach((child) => {
            child.selected = false;
            this.deselectChildItems(child);
        });
    }

    isItemDisabled(): boolean {
        console.log('Item:', this.item, 'Disabled:', this.item.disabled);
        const siblings = this.parentItem?.itemDetails?.items || this.product?.items || [];
        const maxSecimSayisi = this.parentItem?.maxSecimSayisi || this.product?.maxSecimSayisi || 0;

        if (!this.item.selected) {
            const selectedCount = siblings.filter((sibling) => sibling.selected).length;
            return selectedCount >= maxSecimSayisi;
        }

        return false;
    }
    toggleDetailsUrunItems(): void {
        if (this.item.itemDetails) {
            this.item.itemDetails.showDetailsUrun = !this.item.itemDetails.showDetailsUrun;
        }
    //    this.item.itemDetails?.showDetails = !this.item.showDetails;
        this.cdr.detectChanges();
    }
    toggleDetails(): void {
        this.item.showDetails = !this.item.showDetails;
        this.cdr.detectChanges();
    }

    onIngredientSelectionChange(recipeItem: Item): void {
        this.selectionChangeEvent.emit(recipeItem);
    }
    onDetailSelectionChange(detail: Item, parentItem: Item): void {
        console.log("detail:", detail);
        console.log("parentItem:", parentItem);
        if (detail.selected) {
            // Parent'ı seç
            parentItem.selected = true;


            const selectedCount = parentItem.itemDetails?.items?.filter((sibling) => sibling.selected).length || 0;
            const maxsemic = parentItem.itemDetails?.maxSecimSayisi || 0;
            // Aynı seviyedeki diğer detayları pasif yap
            parentItem.itemDetails?.items?.forEach((sibling) => {


                if (sibling !== detail) {

                   // console.log("sibling:",sibling);
                    if (maxsemic == selectedCount) {
                        if(!sibling.selected)
                        {
                        // console.log("Buraya girdi");
                        // console.log("maxsemic:",maxsemic);
                        // console.log("selectedCount:",selectedCount);
                        sibling.disabled = true; // Diğer detayları pasif yap
                        this.disableAllChildren(sibling); // Alt detayları da pasif yap
                        }
                    }
                }
            });

            // Daha üst seviyedeki parent'ı seç
            let currentParent: Item | undefined = parentItem;
            while (currentParent) {
                currentParent.selected = true; // Üst parent'ı seç
                currentParent = currentParent.parent; // Bir üst seviyeye geç
            }

            // Paralel parent'ları ve bunların çocuklarını pasif yap
            const grandParent = parentItem.parent;
            if (grandParent) {



                const selectedCountgp = grandParent.itemDetails?.items?.filter((sibling) => sibling.selected).length || 0;
                const maxsemicgp = grandParent.itemDetails?.maxSecimSayisi || 0;
                grandParent.itemDetails?.items?.forEach((sibling) => {
                    if (sibling !== parentItem) {


                        if (maxsemicgp == selectedCountgp) {

                            if (!sibling.selected) {

                                sibling.disabled = true; // Paralel parent'ı pasif yap
                                sibling.selected = false; // Paralel parent'ın seçimini kaldır
                                this.disableAllChildren(sibling);
                            }
                            else{
                                // sibling.disabled = true; // Paralel parent'ı pasif yap
                                // this.disableAllChildren(sibling);

                            }
                        }

                    }
                });

                const grandgrandParent = grandParent.parent;
                if (grandgrandParent) {

                    console.log("grandgrandParent:",grandgrandParent);
                    const selectedCountgp = grandgrandParent.itemDetails?.items?.filter((sibling) => sibling.selected).length || 0;
                    const maxsemicgp = grandgrandParent.itemDetails?.maxSecimSayisi || 0;
                    console.log("maxsemicgpccc:",maxsemicgp);
                    console.log("selectedCountgpcc:",selectedCountgp);

                    if(selectedCountgp==maxsemicgp)
                    {
                        const selectedsblings=   grandgrandParent.itemDetails?.items?.filter((sibling) => sibling.selected);
                        console.log("selectedsblings:",selectedsblings);
                        for (const gelenitem of grandgrandParent.itemDetails?.items || []) {
                            if (!selectedsblings?.includes(gelenitem)) {
                                if(!gelenitem.selected)
                                {
                                gelenitem.disabled = true; // Paralel parent'ı pasif yap
                                gelenitem.selected = false; // Paralel parent'ın seçimini kaldır
                                this.disableAllChildren(gelenitem);
                                }
                            }


                            // if(selectedsblings!=gelenitem)
                            // {

                            // }

                        }
                    }


                }
            }



        } else {
            // Seçim kaldırıldığında diğer detayları tekrar aktif hale getir
            const anySelected = parentItem.itemDetails?.items?.some((item) => item.selected);
            if (!anySelected) {
                parentItem.selected = false; // Parent seçimini kaldır
                parentItem.itemDetails?.items?.forEach((sibling) => {
                    sibling.disabled = false; // Diğer detayları aktif yap
                    this.enableAllChildren(sibling); // Alt detayları da aktif yap
                });

                // Parent'ın üst seviyesindeki seçim durumunu kontrol et
                let currentParent: Item | undefined = parentItem.parent;
                while (currentParent) {
                    const anySiblingSelected = currentParent.itemDetails?.items?.some((item) => item.selected);
                    if (!anySiblingSelected) {
                        currentParent.selected = false; // Üst parent seçimini kaldır
                        currentParent.itemDetails?.items?.forEach((sibling) => {
                            sibling.disabled = false; // Paralel parent'ları aktif yap
                            this.enableAllChildren(sibling); // Paralel parent'ın alt detaylarını aktif yap
                        });
                    }
                    currentParent = currentParent.parent; // Bir üst seviyeye geç
                }
            }
        }

        // Angular değişikliklerini algılat
        this.cdr.detectChanges();
    }

    onDetailSelectionChangeeklenecek(detail: urunItem, parentItem: Item): void {


        // Angular değişikliklerini algılat
        this.cdr.detectChanges();
    }
    onDetailSelectionChangecikartilacaklar(detail: Item, parentItem: Item): void {


        // Angular değişikliklerini algılat
        this.cdr.detectChanges();
    }


    // Alt detayları pasif yap
    disableAllChildren(item: Item): void {
        if (item.itemDetails?.items) {
            item.itemDetails.disabled = true;
            item.itemDetails.selected = false;
            item.itemDetails.items.forEach((child) => {
                child.disabled = true; // Alt detayları pasif yap
                this.disableAllChildren(child); // Alt detayların alt detaylarını da pasif yap
            });
        }
    }

    // Alt detayları aktif yap
    enableAllChildren(item: Item): void {
        if (item.itemDetails?.items) {
            item.itemDetails.items.forEach((child) => {
                child.disabled = false; // Alt detayları aktif yap
                this.enableAllChildren(child); // Alt detayların alt detaylarını da aktif yap
            });
        }
    }


    getItemName(detail: any) {

        //    console.log(detail);
        return detail.item?.urunAdi
    }


    selectParentRecursively(item: Item): void {
        if (item.parent) {
            item.parent.selected = true;
            console.log("Parent recursively selected:", item.parent);
            this.selectParentRecursively(item.parent);
        } else {
            console.log("No parent found for item:", item);
        }
    }



    updateDisabledStates(items: Item[], maxSecimSayisi: number): void {
        if (!items || maxSecimSayisi <= 0) return;

        const selectedCount = items.filter((item) => item.selected).length;

        items.forEach((item) => {
            if (!item.selected) {
                item.disabled = selectedCount >= maxSecimSayisi; // Sınır dolmuşsa pasif yap
            }
        });
    }




}
