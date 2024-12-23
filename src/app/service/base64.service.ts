import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class Base64Service {

  constructor() {}

  // String -> Base64 dönüştürme işlevi
  encodeToBase64(text: string): string {
    return btoa(text);
  }

  // Base64 -> String dönüştürme işlevi
  decodeFromBase64(base64: string): string {
    return atob(base64);
  }
}
