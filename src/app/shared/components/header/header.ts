import { DOCUMENT } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);

  readonly searchTerm = signal('');

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  readonly isOnProductsPage = computed(() => this.currentUrl().split('?')[0] === '/productos');

  onSearchInput(value: string): void {
    this.searchTerm.set(value);
    // Si ya estamos en /productos, el filtro se aplica en vivo mientras se escribe
    // (incluida la búsqueda vacía, que debe volver a mostrar todos los productos).
    if (this.isOnProductsPage()) {
      this.navigateWithQuery(value);
    }
  }

  onSearchSubmit(): void {
    const q = this.searchTerm().trim();
    if (!q && !this.isOnProductsPage()) {
      return;
    }
    this.navigateWithQuery(q);
  }

  private navigateWithQuery(q: string): void {
    // null quita el query param en vez de dejar "" en la URL.
    this.router.navigate(['/productos'], {
      queryParams: { q: q.trim() || null },
      queryParamsHandling: 'merge',
    });
  }

  scrollToContact(): void {
    // El footer vive en el shell (app.html), montado en toda ruta, así que
    // no hace falta navegar — solo desplazar hasta él.
    this.document.getElementById('footer')?.scrollIntoView({ behavior: 'smooth' });
  }
}
