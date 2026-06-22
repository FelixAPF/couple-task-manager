import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared.module';
import { ProcedureService } from '../../service/procedure.service';
import { Procedure } from '../../model/procedure';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ProcedureDialogComponent } from '../procedure-dialog/procedure-dialog.component';

@Component({
  selector: 'app-procedures-list',
  standalone: true,
  imports: [CommonModule, SharedModule],
  templateUrl: './procedures-list.component.html',
  providers: [DialogService, ConfirmationService, MessageService]
})
export class ProceduresListComponent implements OnInit {
  procedures: Procedure[] = [];
  ref: DynamicDialogRef | undefined;

  constructor(
    private procedureService: ProcedureService,
    private dialogService: DialogService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadProcedures();
  }

  loadProcedures(): void {
    this.procedureService.getProcedures().subscribe(data => {
      this.procedures = data;
    });
  }

  openProcedureDialog(procedure?: Procedure): void {
    this.ref = this.dialogService.open(ProcedureDialogComponent, {
      header: procedure ? 'Edit Procedure' : 'Create Procedure',
      width: '90%',
      data: { procedure: procedure },
      baseZIndex: 10000
    });

    this.ref.onClose.subscribe((result: boolean) => {
      if (result) {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Procedure saved successfully.' });
        this.loadProcedures();
      }
    });
  }

  deleteProcedure(procedure: Procedure, event: Event): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Are you sure you want to delete "${procedure.name}"?`,
      header: 'Delete Procedure',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: "p-button-danger p-button-text",
      rejectButtonStyleClass: "p-button-text p-button-text",
      accept: () => {
        if (procedure.id) {
          this.procedureService.deleteProcedure(procedure.id).subscribe(() => {
            this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Procedure deleted.' });
            this.loadProcedures();
          });
        }
      }
    });
  }
}