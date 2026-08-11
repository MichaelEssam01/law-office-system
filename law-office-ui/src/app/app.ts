import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ApiService } from './services/api.service';
import { TranslateService, TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, TranslateModule],
  template: `
    <router-outlet></router-outlet>
  `,
  styleUrl: './app.css'
})
export class App {
  private translate = inject(TranslateService);
  
  constructor(private apiService: ApiService) {
    this.translate.addLangs(['ar', 'en']);
    this.translate.setDefaultLang('ar');
    
    const browserLang = this.translate.getBrowserLang();
    this.translate.use(browserLang?.match(/ar|en/) ? browserLang : 'ar');
  }
}
