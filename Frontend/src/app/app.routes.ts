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
    { path: 'customization', loadComponent: () => import('./pages/customization/customization').then(m => m.CustomizationComponent) },
    { path: 'customization/list', loadComponent: () => import('./pages/customization/design-list').then(m => m.DesignListComponent) },
    { path: 'customization/edit/:id', loadComponent: () => import('./pages/customization/customization').then(m => m.CustomizationComponent) },
    { path: 'login', loadComponent: () => import('./pages/login/login').then(m => m.Login) },
    { path: 'signup', loadComponent: () => import('./pages/signup/signup').then(m => m.Signup) },
    { path: 'profile', loadComponent: () => import('./pages/profile/profile').then(m => m.Profile) },
    { path: 'admin/product/new', loadComponent: () => import('./pages/admin-product/admin-product').then(m => m.AdminProduct) },
    { path: 'admin/product/edit/:id', loadComponent: () => import('./pages/admin-product/admin-product').then(m => m.AdminProduct) },
    { path: 'admin/wastage', loadComponent: () => import('./pages/admin/wastage/wastage').then(m => m.WastageComponent) },
    { path: '**', redirectTo: '' }
];
