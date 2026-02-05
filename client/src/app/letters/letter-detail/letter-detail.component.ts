import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LetterService } from '../../service/letter.service';
import { Letter } from '../../model/letter';

@Component({
  selector: 'app-letter-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './letter-detail.component.html',
  styleUrls: ['./letter-detail.component.css']
})
export class LetterDetailComponent implements OnInit {
  letter: Letter | null = null;
  selectedChoice: string = '';
  isSubmitting = false;

  constructor(
    private route: ActivatedRoute,
    private letterService: LetterService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.letterService.getLetter(+id).subscribe(data => {
        this.letter = data;
        if (data.selectedOption) {
          this.selectedChoice = data.selectedOption;
        }
      });
    }
  }

  submitReply() {
    if (!this.letter || !this.selectedChoice) return;

    this.isSubmitting = true;
    this.letterService.replyLetter(this.letter.id, this.selectedChoice).subscribe({
      next: (updatedLetter) => {
        this.letter = updatedLetter;
        this.isSubmitting = false;
        alert('Reply sent!');
        this.router.navigate(['/letters']);
      },
      error: () => this.isSubmitting = false
    });
  }
}
