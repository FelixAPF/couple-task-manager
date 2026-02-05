import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LetterService } from '../../service/letter.service';
import { Letter } from '../../model/letter';
import { Router } from '@angular/router';
import { SharedModule } from '../../shared.module';
import { listAnimation } from '../../animations';

@Component({
  selector: 'app-letter-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './letter-list.component.html',
  animations: [listAnimation] // Register it
})
export class LetterListComponent implements OnInit {
  unopenedLetters: Letter[] = [];
  openedLetters: Letter[] = [];
  isLoading = true;

  constructor(private letterService: LetterService, private router: Router) {}

  ngOnInit(): void {
    this.loadLetters();
  }

  loadLetters() {
    this.isLoading = true;
    // Simulate slight delay for animation smoothness or real network
    this.letterService.getUnopenedLetters().subscribe(data => {
      this.unopenedLetters = data;
      this.isLoading = false;
    });
    this.letterService.getOpenedLetters().subscribe(data => this.openedLetters = data);
  }

  openLetter(id: number) {
    this.router.navigate(['/letters/view', id]);
  }

  deleteLetter(id: number, event: Event) {
    event.stopPropagation();
    if(confirm('Are you sure? This memory will be lost.')) {
      this.letterService.deleteLetter(id).subscribe(() => {
        this.loadLetters(); // Refresh
      });
    }
  }
}