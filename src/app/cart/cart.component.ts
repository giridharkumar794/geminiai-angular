import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-cart',
  imports: [FormsModule,CommonModule],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css'
})
export class CartComponent {
  cartItems: any[] = [];
  ngOnInit(): void {
    fetch('http://localhost:3000/GetCart')
      .then(response => response.json())
      .then(data => {
        this.cartItems = data;
      })
      .catch(error => {
        console.error('Error fetching cart items:', error);
      });
  }
  getSubtotal(): number {
    return this.cartItems.reduce((total, item) => {
      return total + item.Price * item.Quantity;
    }, 0);
  }
  getTotalItems(): number {
    return this.cartItems.reduce((total, item) => total + item.Quantity, 0);
  }

}
