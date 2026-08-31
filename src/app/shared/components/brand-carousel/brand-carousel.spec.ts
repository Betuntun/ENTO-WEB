import { TestBed } from '@angular/core/testing';
import { BrandCarousel } from './brand-carousel';
import { Brand } from '../../../core/models';

function makeBrand(id: string): Brand {
  return { id, name: id, logoUrl: '', hasGroups: false, hasProducts: true };
}

function createComponent(brands: Brand[]) {
  const fixture = TestBed.createComponent(BrandCarousel);
  fixture.componentRef.setInput('brands', brands);
  fixture.detectChanges();
  return fixture.componentInstance;
}

describe('BrandCarousel', () => {
  it('splits an even list of brands evenly between the two rows', () => {
    const brands = ['a', 'b', 'c', 'd'].map(makeBrand);
    const component = createComponent(brands);

    expect(component.topRow().map((b) => b.id)).toEqual(['a', 'b']);
    expect(component.bottomRow().map((b) => b.id)).toEqual(['c', 'd']);
  });

  it('gives the top row the extra brand when the list has an odd length', () => {
    const brands = ['a', 'b', 'c'].map(makeBrand);
    const component = createComponent(brands);

    expect(component.topRow().map((b) => b.id)).toEqual(['a', 'b']);
    expect(component.bottomRow().map((b) => b.id)).toEqual(['c']);
  });

  it('handles an empty brand list without throwing', () => {
    const component = createComponent([]);

    expect(component.topRow()).toEqual([]);
    expect(component.bottomRow()).toEqual([]);
  });

  it('puts every brand in the top row and none in the bottom when there is only one', () => {
    const component = createComponent([makeBrand('solo')]);

    expect(component.topRow().map((b) => b.id)).toEqual(['solo']);
    expect(component.bottomRow()).toEqual([]);
  });
});
