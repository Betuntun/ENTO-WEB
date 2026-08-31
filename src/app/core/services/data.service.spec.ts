import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { Brand, Group, Product } from '../models';
import { DataService, sortChardonFirst, sortChardonMultiGroupFirst } from './data.service';

function makeProduct(id: string, groupIds: string[], brandId = 'chardon'): Product {
  return { id, name: id, brandId, groupIds, imageUrl: '' };
}

describe('sortChardonMultiGroupFirst', () => {
  it('places multi-group products before single/no-group products', () => {
    const single = makeProduct('single', ['g1']);
    const none = makeProduct('none', []);
    const multi = makeProduct('multi', ['g1', 'g2']);

    const result = sortChardonMultiGroupFirst([single, none, multi]);

    expect(result.map((p) => p.id)).toEqual(['multi', 'single', 'none']);
  });

  it('keeps original relative order within each group', () => {
    const multiA = makeProduct('multiA', ['g1', 'g2']);
    const multiB = makeProduct('multiB', ['g1', 'g3']);
    const singleA = makeProduct('singleA', ['g1']);
    const singleB = makeProduct('singleB', ['g2']);

    const result = sortChardonMultiGroupFirst([singleA, multiA, singleB, multiB]);

    expect(result.map((p) => p.id)).toEqual(['multiA', 'multiB', 'singleA', 'singleB']);
  });
});

describe('sortChardonFirst', () => {
  it('places all Chardón products before other brands', () => {
    const abb = makeProduct('abb1', [], 'abb');
    const chardonA = makeProduct('chardonA', [], 'chardon');
    const weidmann = makeProduct('weidmann1', [], 'weidmann');
    const chardonB = makeProduct('chardonB', [], 'chardon');

    const result = sortChardonFirst([abb, chardonA, weidmann, chardonB]);

    expect(result.map((p) => p.id)).toEqual(['chardonA', 'chardonB', 'abb1', 'weidmann1']);
  });
});

describe('DataService', () => {
  const BRANDS: Brand[] = [
    { id: 'chardon', name: 'Chardón', logoUrl: '', hasGroups: true, hasProducts: true },
    { id: 'abb', name: 'ABB', logoUrl: '', hasGroups: false, hasProducts: true },
  ];
  const GROUPS: Group[] = [
    { id: 'g1', brandId: 'chardon', name: 'Conectores' },
    { id: 'g2', brandId: 'chardon', name: 'Terminales' },
  ];
  const PRODUCTS: Product[] = [
    { id: 'p1', name: 'Boquilla ABB', brandId: 'abb', groupIds: [], imageUrl: '', featured: true },
    { id: 'p2', name: 'Conector Chardón', brandId: 'chardon', groupIds: ['g1'], imageUrl: '' },
    {
      id: 'p3',
      name: 'Interruptor Chardón',
      brandId: 'chardon',
      groupIds: ['g1', 'g2'],
      imageUrl: '',
      featured: true,
    },
    { id: 'p4', name: 'Terminal Chardón', brandId: 'chardon', groupIds: ['g2'], imageUrl: '', featured: true },
  ];

  async function createService() {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const httpMock = TestBed.inject(HttpTestingController);
    const service = TestBed.inject(DataService);

    httpMock.expectOne('/data/products.json').flush(PRODUCTS);
    httpMock.expectOne('/data/brands.json').flush(BRANDS);
    httpMock.expectOne('/data/groups.json').flush(GROUPS);
    await service.load();

    return service;
  }

  it('loads products, brands and groups exactly once even if load() is called multiple times', async () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const httpMock = TestBed.inject(HttpTestingController);
    const service = TestBed.inject(DataService);

    httpMock.expectOne('/data/products.json').flush(PRODUCTS);
    httpMock.expectOne('/data/brands.json').flush(BRANDS);
    httpMock.expectOne('/data/groups.json').flush(GROUPS);
    await service.load();
    await service.load();

    httpMock.verify();
    expect(service.products().length).toBe(4);
  });

  it('productsByBrand applies the Chardón multi-group-first order only for brands with hasGroups', async () => {
    const service = await createService();

    expect(service.productsByBrand('chardon')().map((p) => p.id)).toEqual(['p3', 'p2', 'p4']);
    expect(service.productsByBrand('abb')().map((p) => p.id)).toEqual(['p1']);
  });

  it('productsByBrand returns an empty list for a brand with no products', async () => {
    const service = await createService();
    expect(service.productsByBrand('unknown')()).toEqual([]);
  });

  it('groupsForBrand returns only the groups belonging to that brand', async () => {
    const service = await createService();

    expect(service.groupsForBrand('chardon')().map((g) => g.id)).toEqual(['g1', 'g2']);
    expect(service.groupsForBrand('abb')()).toEqual([]);
  });

  it('featuredByBrand filters by brand and featured flag, then applies the limit', async () => {
    const service = await createService();

    const featured = service.featuredByBrand('chardon', 1)();
    expect(featured.map((p) => p.id)).toEqual(['p3']);
  });

  it('featuredByBrand excludes non-featured products even within the matching brand', async () => {
    const service = await createService();

    const featured = service.featuredByBrand('chardon', 10)();
    expect(featured.map((p) => p.id).sort()).toEqual(['p3', 'p4']);
  });
});
