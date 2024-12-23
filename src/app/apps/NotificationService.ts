import { Injectable } from '@angular/core';
import Swal, { SweetAlertIcon } from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor() { }

  showNotification(msg: string, color: string = 'success', position: string = 'top-end', duration: number = 3000): void {
    let icon: SweetAlertIcon;

    // color değerini uygun bir SweetAlertIcon'a dönüştür
    switch (color) {
        case 'success':
            icon = 'success';
            break;
        case 'danger':
            icon = 'error';
            break;
        case 'warning':
            icon = 'warning';
            break;
        case 'info':
            icon = 'info';
            break;
        default:
            icon = 'info';
            break;
    }

    const toast = Swal.mixin({
        toast: true,
        position: position as any,
        showConfirmButton: false,
        timer: duration,
        showCloseButton: true,
        customClass: {
            popup: `color-${color}`,  // CSS sınıfı olarak 'toast-success', 'toast-danger', vb. kullanılabilir
        },
        target: document.getElementById(color + '-toast') || 'body',
    });

    toast.fire({
        title: msg,
        icon: icon  // Burada icon değeri sadece SweetAlertIcon türünden olmalı
    });
}


}
