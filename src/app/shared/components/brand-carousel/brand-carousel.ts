import { Component, computed, input } from '@angular/core';
import { Brand } from '../../../core/models';

@Component({
  selector: 'app-brand-carousel',
  templateUrl: './brand-carousel.html',
  styleUrl: './brand-carousel.scss',
})
export class BrandCarousel {
  readonly brands = input.required<Brand[]>();

  // Ambas filas muestran el set completo de marcas (no una partición entre
  // ellas) — cada fila anima en su propia dirección, pero todas las marcas
  // deben verse tanto arriba como abajo. La fila de abajo se rota a la mitad
  // de la lista para que, en cualquier instante, la marca alineada arriba
  // nunca coincida con la alineada justo abajo en la misma columna.
  readonly topRow = computed(() => this.brands());
  readonly bottomRow = computed(() => {
    const list = this.brands();
    if (list.length < 2) return list;
    const offset = Math.floor(list.length / 2);
    return [...list.slice(offset), ...list.slice(0, offset)];
  });
}
