import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { vi } from 'vitest';
import { Home } from './home';
import { Brand, Product } from '../../core/models';

const BRANDS: Brand[] = [
  { id: 'chardon', name: 'Chardon', logoUrl: '', hasGroups: true, hasProducts: true },
  { id: 'weidmann', name: 'Weidmann', logoUrl: '', hasGroups: false, hasProducts: true },
  { id: 'abb', name: 'ABB', logoUrl: '', hasGroups: false, hasProducts: true },
];

const PRODUCTS: Product[] = [
  { id: 'p1', name: 'Chardon 1', brandId: 'chardon', groupIds: [], imageUrl: '', featured: true },
  { id: 'p2', name: 'Chardon 2', brandId: 'chardon', groupIds: [], imageUrl: '' },
  { id: 'p3', name: 'Weidmann 1', brandId: 'weidmann', groupIds: [], imageUrl: '', featured: true },
];

async function createComponent() {
  TestBed.configureTestingModule({
    imports: [Home],
    providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
  });

  const httpMock = TestBed.inject(HttpTestingController);
  const fixture = TestBed.createComponent(Home);
  fixture.detectChanges();

  httpMock.expectOne('data/products.json').flush(PRODUCTS);
  httpMock.expectOne('data/brands.json').flush(BRANDS);
  httpMock.expectOne('data/groups.json').flush([]);
  await fixture.whenStable();
  fixture.detectChanges();

  return fixture;
}

describe('Home featuredBrands', () => {
  it('builds one section per configured featured brand id, in order', async () => {
    const fixture = await createComponent();
    const sections = fixture.componentInstance['featuredBrands']();

    expect(sections.map((s) => s.brandId)).toEqual(['chardon', 'weidmann', 'abb']);
    expect(sections[0].brand?.name).toBe('Chardon');
  });

  it('only includes featured products for each brand, up to the given limit', async () => {
    const fixture = await createComponent();
    const sections = fixture.componentInstance['featuredBrands']();

    const chardonSection = sections.find((s) => s.brandId === 'chardon')!;
    expect(chardonSection.products.map((p) => p.id)).toEqual(['p1']);
  });

  it('returns an empty products list for a featured brand id with no featured products', async () => {
    const fixture = await createComponent();
    const sections = fixture.componentInstance['featuredBrands']();

    const abbSection = sections.find((s) => s.brandId === 'abb')!;
    expect(abbSection.products).toEqual([]);
  });
});

describe('Home navigation and modal', () => {
  it('navigates to /productos with the brand filter on goToBrand', async () => {
    const fixture = await createComponent();
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockReturnValue(Promise.resolve(true));

    fixture.componentInstance.goToBrand('weidmann');

    expect(navigateSpy).toHaveBeenCalledWith(['/productos'], { queryParams: { brand: 'weidmann' } });
  });

  it('opens and closes the product modal', async () => {
    const fixture = await createComponent();
    const component = fixture.componentInstance;

    expect(component['selectedProduct']()).toBeNull();

    component.openProduct(PRODUCTS[0]);
    expect(component['selectedProduct']()).toEqual(PRODUCTS[0]);

    component.closeProduct();
    expect(component['selectedProduct']()).toBeNull();
  });
});
