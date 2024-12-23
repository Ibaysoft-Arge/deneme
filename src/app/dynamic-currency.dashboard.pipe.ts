// dynamic-currency.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { CurrencyService } from './service/currency.service';



@Pipe({
  name: 'dynamicCurrencydast',
  pure: false, // Dinamik veri için false
})
export class DynamicCurrencyPipeDashBoard implements PipeTransform {
  constructor(private currencyPipe: CurrencyPipe, private currencyService: CurrencyService) {}

  transform(value: number, currencyCode?: string, display?: 'symbol' | 'code' | 'symbol-narrow', digitsInfo?: string, locale?: string): string | null {
    const selectedCurrency = this.currencyService.getCurrency();
    return this.currencyPipe.transform(value, currencyCode || selectedCurrency, display, digitsInfo, locale);
  }
}
