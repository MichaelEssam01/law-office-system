import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
  name: 'suspensionReason',
  standalone: true,
  pure: true
})
export class SuspensionReasonPipe implements PipeTransform {
  private translate = inject(TranslateService);

  private static readonly REASON_KEY_MAP: Record<string, string> = {
    'أتعاب متأخرة': 'CASES.REASONS.LATE_FEES',
    'أتعاب': 'CASES.REASONS.LATE_FEES',
    'متأخرة': 'CASES.REASONS.LATE_FEES',
    'توكيل': 'CASES.REASONS.POA',
    'مستندات': 'CASES.REASONS.DOCUMENTS',
    'أخرى': 'CASES.REASONS.OTHER',
    'LATE_FEES': 'CASES.REASONS.LATE_FEES',
    'POA': 'CASES.REASONS.POA',
    'DOCUMENTS': 'CASES.REASONS.DOCUMENTS',
    'OTHER': 'CASES.REASONS.OTHER',
    'Overdue Fees': 'CASES.REASONS.LATE_FEES',
    'Late Fees': 'CASES.REASONS.LATE_FEES',
    'Power of Attorney': 'CASES.REASONS.POA',
    'Documents': 'CASES.REASONS.DOCUMENTS',
    'Other': 'CASES.REASONS.OTHER'
  };

  transform(reason?: string | null, lang?: string | null): string {
    if (!reason) return '';

    const isArabic = (lang || this.translate.currentLang || 'ar') === 'ar';
    const separator = isArabic ? '، ' : ', ';

    return reason
      .split(/[,،]/)
      .map(part => part.trim())
      .filter(Boolean)
      .map(part => {
        const key = SuspensionReasonPipe.REASON_KEY_MAP[part];
        return key ? this.translate.instant(key) : part;
      })
      .join(separator);
  }
}

