import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  private readonly router = inject(Router);

  readonly searchTerm = signal('');

  onSearchSubmit(): void {
    const q = this.searchTerm().trim();
    if (!q) {
      return;
    }
    this.router.navigate(['/productos'], { queryParams: { q } });
  }
}
