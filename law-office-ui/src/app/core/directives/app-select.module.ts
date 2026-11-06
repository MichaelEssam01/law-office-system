import { NgModule } from '@angular/core';
import { SelectModule as PrimeSelectModule } from 'primeng/select';
import { AutoSelectFilterDirective } from './auto-select-filter.directive';

@NgModule({
  imports: [PrimeSelectModule, AutoSelectFilterDirective],
  exports: [PrimeSelectModule, AutoSelectFilterDirective]
})
export class AppSelectModule {}
export { AutoSelectFilterDirective };
