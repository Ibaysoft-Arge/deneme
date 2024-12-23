export interface ReportField {
    name: string;  // örn: 'magazaAdi', 'ciro', 'fisAdeti', 'tarih', vs.
    label: string; // ekranda görünen isim
    type: 'dimension' | 'metric' | 'datetime'; // alan tipi
  }

  export interface ReportConfig {
    dimensions: string[];  // Satır alanları örn: ['magazaAdi', 'tur']
    columns: string[];     // Kolon alanları örn: ['saat']
    metrics: string[];     // Değer alanları örn: ['ciro', 'fisAdeti', 'sepetOrt']
    filters: {field:string, value:any}[]; // Filtreler örn: [{field:'tur',value:'Franchise'}]
    configName?: string;
  }
