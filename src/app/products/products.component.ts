import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ProductService } from '../services/product.service';

@Component({
  selector: 'app-products',
  imports: [CommonModule],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css'
})
export class ProductsComponent {
  products: any[] = [];
  ps:any="";
  constructor()
  {
    this.ps=inject(ProductService);
  }
  ngOnInit() 
  {
    this.products = this.ps.getProducts();
  }
}
