import { Injectable } from '@angular/core';
import { Product } from '../models/product';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  constructor() { }
  private products: Product[] = [];

  setProducts(products: Product[]): void {
    this.products = products;
  }

  getProducts(): Product[] {
    return this.products;
  }
}
