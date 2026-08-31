import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ProductsList } from './products-list';
import { Brand, Group, Product } from '../../core/models';

const BRANDS: Brand[] = [
  { id: 'chardon', name: 'Chardón', logoUrl: '', hasGroups: true, hasProducts: true },
  { id: 'abb', name: 'ABB', logoUrl: '', hasGroups: false, hasProducts: true },
];

const GROUPS: Group[] = [{ id: 'g1', brandId: 'chardon', name: 'Conectores' }];

const PRODUCTS: Product[] = [
  { id: 'p1', name: 'Boquilla ABB', brandId: 'abb', groupIds: [], imageUrl: '' },
  { id: 'p2', name: 'Conector Chardón', brandId: 'chardon', groupIds: ['g1'], imageUrl: '' },
  { id: 'p3', name: 'Interruptor Chardón', brandId: 'chardon', groupIds: [], imageUrl: '' },
];

async function createComponent(queryParams: Record<string, string>) {
  TestBed.configureTestingModule({
    imports: [ProductsList],
    providers: [
      provideRouter([]),
      provideHttpClient(),
      provideHttpClientTesting(),
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: { queryParamMap: convertToParamMap(queryParams) },
          queryParamMap: of(convertToParamMap(queryParams)),
        },
      },
    ],
  });

  const httpMock = TestBed.inject(HttpTestingController);
  const fixture = TestBed.createComponent(ProductsList);
  fixture.detectChanges();

  httpMock.expectOne('/data/products.json').flush(PRODUCTS);
  httpMock.expectOne('/data/brands.json').flush(BRANDS);
  httpMock.expectOne('/data/groups.json').flush(GROUPS);
  await fixture.whenStable();
  fixture.detectChanges();

  return fixture.componentInstance;
}

describe('ProductsList filtering', () => {
  it('shows all products with Chardón first when no filters are active', async () => {
    const component = await createComponent({});
    expect(component['filteredProducts']().map((p) => p.id)).toEqual(['p2', 'p3', 'p1']);
  });

  it('filters by brand', async () => {
    const component = await createComponent({ brand: 'chardon' });
    expect(component['filteredProducts']().map((p) => p.id).sort()).toEqual(['p2', 'p3']);
  });

  it('filters by brand and group together', async () => {
    const component = await createComponent({ brand: 'chardon', group: 'g1' });
    expect(component['filteredProducts']().map((p) => p.id)).toEqual(['p2']);
  });

  it('filters by search text', async () => {
    const component = await createComponent({ q: 'boquilla' });
    expect(component['filteredProducts']().map((p) => p.id)).toEqual(['p1']);
  });
});
