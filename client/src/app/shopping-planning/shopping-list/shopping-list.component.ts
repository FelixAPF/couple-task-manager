import { Component, OnInit } from '@angular/core';
import { SharedModule } from '../../shared.module';
import { ShoppingService } from '../../service/shopping.service';
import { ShoppingItem } from '../../model/shopping-item';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { AddShoppingItemDialogComponent } from '../add-shopping-item-dialog/add-shopping-item-dialog.component';

@Component({
  selector: 'app-shopping-list',
  imports: [SharedModule],
  templateUrl: './shopping-list.component.html',
  styleUrl: './shopping-list.component.css',
  providers: [MessageService, ConfirmationService]
})
export class ShoppingListComponent implements OnInit {
  shoppingItems: ShoppingItem[] = [];

  items(row: any) {
    return [
      {
        label: 'Update', 
        icon: 'pi pi-clone', 
        command: () => {
          this.onModify(row);
        }
      }
    ];
  }

  constructor(private shoppingService: ShoppingService, private dialogService: DialogService){
  }

  ngOnInit(): void {
    this.retrieveShoppingList();
  }

  retrieveShoppingList(){
    this.shoppingService.retrieveShoppingListNotBought().subscribe((list) => this.shoppingItems = list);
  }

  onModify(row: any){
    this.openNewTaskDialog(row);
  }

  delete(event: any, id: number){
    this.shoppingService.deleteTaskList(id).subscribe(() => this.retrieveShoppingList());
  }

  public trackById(index: number, item: any): string | number { // <-- Use your actual item type instead of 'any'
    return item.id; // Assuming each item has a unique 'id' property
  }

  openNewTaskDialog(shoppingItem: ShoppingItem | null = null){
    const dialogRef = this.dialogService.open(AddShoppingItemDialogComponent, {
      width: '20vw',
      dismissableMask: true,
      modal:true,
      breakpoints: {
      '1199px': '75vw', '575px': '90vw'
      },
      data: {
        shoppingItem: shoppingItem
      }
    });  
    dialogRef.onClose.subscribe(() => {
      this.retrieveShoppingList();
    })
  }
}
