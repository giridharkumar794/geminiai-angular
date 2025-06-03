import { Routes } from '@angular/router';
import { CartComponent } from './cart/cart.component';
import { PromptComponent } from './prompt/prompt.component';
import { ProductsComponent } from './products/products.component';

export const routes: Routes = [
    {
        component: CartComponent,path: 'cart'
    },
    {
        component: PromptComponent, path: 'prompt'
    },
    {
        component: ProductsComponent, path: 'products'
    },
];
