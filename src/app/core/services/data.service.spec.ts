import { Product } from '../models';
import { sortChardonFirst, sortChardonMultiGroupFirst } from './data.service';

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
