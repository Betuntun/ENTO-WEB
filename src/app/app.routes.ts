import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
  },
  {
    path: 'productos',
    loadComponent: () =>
      import('./features/products/products-list').then((m) => m.ProductsList),
  },
];
