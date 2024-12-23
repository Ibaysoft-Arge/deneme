import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'keepOriginalQr',
  pure: false, // Borunun dinamik değişikliklere tepki vermesi için
})
export class KeepOriginalQrPipe implements PipeTransform {
  transform(value: Map<string, any[]>): { key: string; value: any[] }[] {
    if (value instanceof Map) {
      return Array.from(value.entries()).map(([key, value]) => ({ key, value }));
    }
    return [];
  }
}
