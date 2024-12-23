import { Injectable } from '@angular/core';
import QRCode from 'qrcode';

@Injectable({
  providedIn: 'root'
})
export class QRCodeService {

  constructor() {}

  // String'den QR kodu oluştur ve Data URL döndür
  async generateQRCode(text: string): Promise<string> {
    try {
      return await QRCode.toDataURL(text); // Data URL olarak döner
    } catch (error) {
      console.error('QR kod oluşturulurken hata oluştu:', error);
      throw error;
    }
  }

  // QR kodunu indir
  downloadQRCode(dataUrl: string, fileName: string = 'qrcode.png') {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName;
    link.click();
  }
}
