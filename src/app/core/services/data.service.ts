import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Brand, Group, Product } from '../models';

export function sortChardonMultiGroupFirst(products: Product[]): Product[] {
  const multiGroup = products.filter((p) => p.groupIds.length > 1);
  const rest = products.filter((p) => p.groupIds.length <= 1);
  return [...multiGroup, ...rest];
}

export function sortChardonFirst(products: Product[]): Product[] {
  const chardon = products.filter((p) => p.brandId === 'chardon');
  const rest = products.filter((p) => p.brandId !== 'chardon');
  return [...chardon, ...rest];
}

// Las URLs en los JSON de datos empiezan con "/" (raíz del dominio), lo cual
// ignora el <base href> cuando el sitio se publica bajo una subruta (p. ej.
// GitHub Pages en /ENTO-WEB/). Se vuelven relativas para que el navegador las
// resuelva contra el base href actual.
function stripLeadingSlash(url: string): string {
  return url.startsWith('/') ? url.slice(1) : url;
}

@Injectable({ providedIn: 'root' })
export class DataService {
  private readonly http = inject(HttpClient);

  private readonly productsState = signal<Product[]>([]);
  private readonly brandsState = signal<Brand[]>([]);
  private readonly groupsState = signal<Group[]>([]);

  readonly products = this.productsState.asReadonly();
  readonly brands = this.brandsState.asReadonly();
  readonly groups = this.groupsState.asReadonly();

  private loadPromise: Promise<void> | null = null;

  constructor() {
    this.load();
  }

  load(): Promise<void> {
    if (!this.loadPromise) {
      this.loadPromise = Promise.all([
        firstValueFrom(this.http.get<Product[]>('data/products.json')),
        firstValueFrom(this.http.get<Brand[]>('data/brands.json')),
        firstValueFrom(this.http.get<Group[]>('data/groups.json')),
      ]).then(([products, brands, groups]) => {
        this.productsState.set(
          products.map((p) => ({ ...p, imageUrl: stripLeadingSlash(p.imageUrl) })),
        );
        this.brandsState.set(brands.map((b) => ({ ...b, logoUrl: stripLeadingSlash(b.logoUrl) })));
        this.groupsState.set(groups);
      });
    }
    return this.loadPromise;
  }

  productsByBrand(brandId: string) {
    return computed(() => {
      const products = this.products().filter((p) => p.brandId === brandId);
      const brand = this.brands().find((b) => b.id === brandId);
      return brand?.hasGroups ? sortChardonMultiGroupFirst(products) : products;
    });
  }

  groupsForBrand(brandId: string) {
    return computed(() => this.groups().filter((g) => g.brandId === brandId));
  }

  featuredByBrand(brandId: string, limit: number) {
    return computed(() =>
      this.products()
        .filter((p) => p.brandId === brandId && p.featured)
        .slice(0, limit),
    );
  }
}
