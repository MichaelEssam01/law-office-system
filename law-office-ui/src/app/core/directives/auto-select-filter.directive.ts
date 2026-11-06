import { Directive, effect, inject } from '@angular/core';
import { Select } from 'primeng/select';
import { TranslateService } from '@ngx-translate/core';
import { AppStateService } from '../services/app-state.service';

@Directive({
  selector: 'p-select',
  standalone: true
})
export class AutoSelectFilterDirective {
  private select = inject(Select);
  private translate = inject(TranslateService);
  private appState = inject(AppStateService);

  constructor() {
    // Automatically configure filter when options change
    effect(() => {
      const rawOpts = this.select.options;
      const opts = Array.isArray(rawOpts) ? rawOpts : [];
      const count = opts.length;

      if (count > 5) {
        this.select.filter = true;
        this.select.resetFilterOnHide = true;

        // If filterBy is not manually specified:
        if (!this.select.filterBy) {
          if (this.select.optionLabel) {
            this.select.filterBy = this.select.optionLabel;
          } else if (count > 0 && opts[0] && typeof opts[0] === 'object') {
            const first = opts[0] as Record<string, any>;
            if ('labelKey' in first) {
              this.select.filterBy = 'labelKey,label,name';
            } else if ('label' in first) {
              this.select.filterBy = 'label';
            } else if ('name' in first) {
              this.select.filterBy = 'name';
            } else if ('fullName' in first) {
              this.select.filterBy = 'fullName';
            }
          }
        }

        // Set translated filter placeholder dynamically
        const updatePlaceholder = () => {
          const trans = this.translate.instant('COMMON.SEARCH');
          if (trans && trans !== 'COMMON.SEARCH') {
            this.select.filterPlaceholder = trans;
          } else {
            // Fallback according to active language until translation file loads
            this.select.filterPlaceholder = this.appState.currentLang() === 'ar' ? 'بحث...' : 'Search...';
          }
        };

        updatePlaceholder();
        this.translate.get('COMMON.SEARCH').subscribe(res => {
          if (res && res !== 'COMMON.SEARCH') {
            this.select.filterPlaceholder = res;
          }
        });
      }
    });
  }
}
