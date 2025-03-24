// kebab-case.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';
import { Frequency, Room } from '../../model/task';
@Pipe({
  name: 'roomPipe',
})
export class RoomPipe implements PipeTransform {
  transform(value: string): string {
    switch(value){
        case Room.BATHROOM: return 'Salle de bain';
        case Room.BEDROOM: return 'Chambre';
        case Room.EVERYWHERE: return 'Partout';
        case Room.HALLWAY: return 'Couloir';
        case Room.KITCHEN: return 'Cuisine';
        case Room.LIVING_ROOM: return 'Salon';
        case Room.OFFICE: return 'Bureau';
        case Room.OUTSIDE: return 'Dehors';
        case Room.OTHER:
        default:
             return 'Autre';
    }
  }
}