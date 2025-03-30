// kebab-case.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';
import { Frequency } from '../../model/task';
@Pipe({
  name: 'frequencyPipe',
})
export class FrequencyPipe implements PipeTransform {
  transform(value: string): string {
    switch(value){
        case Frequency.DAILY: return 'Quotidien';
        case Frequency.WEEKLY: return 'Hebdomadaire';
        case Frequency.BIWEEKLY: return 'Bi-mensuel';
        case Frequency.MONTHLY: return 'Mensuel';
        case Frequency.QUARTERLY: return 'Trimestriel';
        case Frequency.BIYEARLY: return 'Bi-annuel';
        case Frequency.YEARLY: return 'Annuel';
        default: return "N/A"
    }
  }
}