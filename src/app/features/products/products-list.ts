import {
  Component,
  DestroyRef,
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
import {
  DataService,
  normalizeSearchText,
  sortChardonFirst,
  sortChardonMultiGroupFirst,
} from '../../core/services/data.service';
import { SeoService } from '../../core/services/seo.service';
import { Product } from '../../core/models';
import { ProductCard } from '../../shared/components/product-card/product-card';
import { ProductModal } from '../../shared/components/product-modal/product-modal';

const PAGE_SIZE = 20;

function parseList(raw: string | null): string[] {
  return raw ? raw.split(',').filter(Boolean) : [];
}

@Component({
  selector: 'app-products-list',
  imports: [ProductCard, ProductModal],
  templateUrl: './products-list.html',
  styleUrl: './products-list.scss',
})
export class ProductsList {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly seo = inject(SeoService);
  protected readonly data = inject(DataService);

  protected readonly selectedProduct = signal<Product | null>(null);

  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  protected readonly selectedBrands = computed(() => parseList(this.queryParams().get('brand')));
  // El filtro de grupo solo tiene efecto cuando Chardon está entre las marcas marcadas (única con
  // grupos). Así, una URL con ?group=x sin Chardon en ?brand= (ej. compartida a mano) no deja un
  // filtro "fantasma" activo que no se refleje en el sidebar.
  protected readonly selectedGroups = computed(() =>
    this.selectedBrands().includes('chardon') ? parseList(this.queryParams().get('group')) : [],
  );
  protected readonly searchTerm = computed(() => this.queryParams().get('q') ?? '');

  protected readonly filterableBrands = computed(() =>
    this.data.brands().filter((brand) => brand.hasProducts),
  );

  protected readonly groupOptions = computed(() =>
    this.selectedBrands().includes('chardon') ? this.data.groupsForBrand('chardon')() : [],
  );

  // Mapa brandId -> nombre normalizado, para poder buscar también por marca
  // (p. ej. "chardon") sin depender de que el producto repita el nombre.
  private readonly brandNamesById = computed(() => {
    const map = new Map<string, string>();
    for (const brand of this.data.brands()) {
      map.set(brand.id, normalizeSearchText(brand.name));
    }
    return map;
  });

  protected readonly filteredProducts = computed(() => {
    const brandIds = this.selectedBrands();
    const groupIds = this.selectedGroups();
    const term = normalizeSearchText(this.searchTerm().trim());

    let list = brandIds.length
      ? this.data.products().filter((p) => brandIds.includes(p.brandId))
      : this.data.products();

    if (groupIds.length) {
      list = list.filter((p) => p.brandId !== 'chardon' || p.groupIds.some((g) => groupIds.includes(g)));
    }

    // Preserva la regla de negocio: los productos Chardon con múltiples grupos van primero
    // dentro de Chardon, y Chardon va primero en el listado general.
    list = sortChardonFirst(sortChardonMultiGroupFirst(list));

    if (term) {
      const brandNames = this.brandNamesById();
      list = list.filter(
        (p) =>
          normalizeSearchText(p.name).includes(term) ||
          (brandNames.get(p.brandId) ?? '').includes(term),
      );
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
      this.selectedBrands();
      this.selectedGroups();
      this.searchTerm();
      this.visibleCount.set(PAGE_SIZE);
    });

    effect(() => {
      const brandIds = this.selectedBrands();
      const brand =
        brandIds.length === 1 ? this.data.brands().find((b) => b.id === brandIds[0]) : null;
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
      this.observer?.disconnect();
      this.observer = null;
      if (!el || !isPlatformBrowser(this.platformId)) {
        return;
      }
      this.observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting) && this.hasMore()) {
          this.visibleCount.update((n) => Math.min(n + PAGE_SIZE, this.filteredProducts().length));
        }
      });
      this.observer.observe(el);
    });

    inject(DestroyRef).onDestroy(() => this.observer?.disconnect());
  }

  toggleBrand(brandId: string): void {
    const current = this.selectedBrands();
    const next = current.includes(brandId)
      ? current.filter((id) => id !== brandId)
      : [...current, brandId];

    this.navigateWithFilters({
      brand: next.length ? next.join(',') : null,
      ...(next.includes('chardon') ? {} : { group: null }),
    });
  }

  toggleGroup(groupId: string): void {
    const current = this.selectedGroups();
    const next = current.includes(groupId)
      ? current.filter((id) => id !== groupId)
      : [...current, groupId];

    this.navigateWithFilters({ group: next.length ? next.join(',') : null });
  }

  openProduct(product: Product): void {
    this.selectedProduct.set(product);
  }

  closeProduct(): void {
    this.selectedProduct.set(null);
  }

  private navigateWithFilters(changes: Record<string, string | null>): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: changes,
      queryParamsHandling: 'merge',
    });
  }
}
