import {
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { DataService } from '../../core/services/data.service';
import { SeoService } from '../../core/services/seo.service';
import { ProductCard } from '../../shared/components/product-card/product-card';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-products-list',
  imports: [ProductCard],
  templateUrl: './products-list.html',
  styleUrl: './products-list.scss',
})
export class ProductsList {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly seo = inject(SeoService);
  protected readonly data = inject(DataService);

  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  protected readonly selectedBrand = computed(() => this.queryParams().get('brand'));
  protected readonly selectedGroup = computed(() => this.queryParams().get('group'));
  protected readonly searchTerm = computed(() => this.queryParams().get('q') ?? '');

  protected readonly filterableBrands = computed(() =>
    this.data.brands().filter((brand) => brand.hasProducts),
  );

  protected readonly groupOptions = computed(() =>
    this.selectedBrand() === 'chardon' ? this.data.groupsForBrand('chardon')() : [],
  );

  protected readonly filteredProducts = computed(() => {
    const brandId = this.selectedBrand();
    const groupId = this.selectedGroup();
    const term = this.searchTerm().trim().toLowerCase();

    let list = brandId ? this.data.productsByBrand(brandId)() : this.data.products();

    if (groupId) {
      list = list.filter((p) => p.groupIds.includes(groupId));
    }
    if (term) {
      list = list.filter((p) => p.name.toLowerCase().includes(term));
    }
    return list;
  });

  private readonly visibleCount = signal(PAGE_SIZE);

  protected readonly visibleProducts = computed(() =>
    this.filteredProducts().slice(0, this.visibleCount()),
  );

  protected readonly hasMore = computed(() => this.visibleCount() < this.filteredProducts().length);

  private readonly sentinel = viewChild<ElementRef<HTMLElement>>('sentinel');
  private observer: IntersectionObserver | null = null;

  constructor() {
    effect(() => {
      // Cualquier cambio de filtro reinicia la ventana visible a la primera página.
      this.selectedBrand();
      this.selectedGroup();
      this.searchTerm();
      this.visibleCount.set(PAGE_SIZE);
    });

    effect(() => {
      const brandId = this.selectedBrand();
      const brand = brandId ? this.data.brands().find((b) => b.id === brandId) : null;
      const title = brand ? `Productos ${brand.name} — ENTO` : 'Catálogo de productos — ENTO';
      const description = brand
        ? `Explora los productos de ${brand.name} disponibles en ENTO Aislantes e Ingeniería.`
        : 'Catálogo completo de accesorios y aislantes para equipos de media y baja tensión.';

      this.seo.update({ title, description, path: '/productos' });

      const products = this.filteredProducts();
      this.seo.setJsonLd('ld-products-list', {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        itemListElement: products.map((product, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: product.name,
        })),
      });
    });

    effect(() => {
      const el = this.sentinel()?.nativeElement;
      if (!el || !isPlatformBrowser(this.platformId)) {
        return;
      }
      this.observer?.disconnect();
      this.observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting) && this.hasMore()) {
          this.visibleCount.update((n) => Math.min(n + PAGE_SIZE, this.filteredProducts().length));
        }
      });
      this.observer.observe(el);
    });
  }

  selectBrand(brandId: string | null): void {
    this.navigateWithFilters({ brand: brandId, group: null });
  }

  selectGroup(groupId: string | null): void {
    this.navigateWithFilters({ group: groupId });
  }

  private navigateWithFilters(changes: Record<string, string | null>): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: changes,
      queryParamsHandling: 'merge',
    });
  }
}
