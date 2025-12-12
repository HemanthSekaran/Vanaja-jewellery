import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { ProductList } from './pages/product-list/product-list';
import { ProductDetails } from './pages/product-details/product-details';
import { About } from './pages/about/about';
import { Contact } from './pages/contact/contact';
import { Wishlist } from './pages/wishlist/wishlist';
import { Cart } from './pages/cart/cart';

export const routes: Routes = [
    { path: '', component: Home },
    { path: 'products', component: ProductList },
    { path: 'products/:id', component: ProductDetails },
    { path: 'about', component: About },
    { path: 'contact', component: Contact },
    { path: 'wishlist', component: Wishlist },
    { path: 'wishlist', component: Wishlist },
    { path: 'cart', component: Cart },
    { path: 'customization', loadComponent: () => import('./pages/customization/customization').then(m => m.customization) },
    { path: 'login', loadComponent: () => import('./pages/login/login').then(m => m.Login) },
    { path: 'signup', loadComponent: () => import('./pages/signup/signup').then(m => m.Signup) },
    { path: 'admin/product/new', loadComponent: () => import('./pages/admin-product/admin-product').then(m => m.AdminProduct) },
    { path: 'admin/product/edit/:id', loadComponent: () => import('./pages/admin-product/admin-product').then(m => m.AdminProduct) },
    { path: '**', redirectTo: '' }
];
