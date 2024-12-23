import { Injectable } from '@angular/core';

@Injectable({providedIn:'root'})
export class ReportConfigService {
  private storageKey = 'myDynamicReporterLastConfig';

  saveConfig(config: any) {
    localStorage.setItem(this.storageKey, JSON.stringify(config));
  }

  loadConfig(): any {
    const str = localStorage.getItem(this.storageKey);
    if (str) return JSON.parse(str);
    return null;
  }

  // Kaydetme, listeleme vs. eklenebilir.
}
