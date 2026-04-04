import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './guards/auth.guard';
import { Home } from './pages/home/home';
import { ProductList } from './pages/product-list/product-list';
import { ProductDetails } from './pages/product-details/product-details';
import { About } from './pages/about/about';
import { Wishlist } from './pages/wishlist/wishlist';
import { Cart } from './pages/cart/cart';

export const routes: Routes = [
    { path: '', component: Home },
    { path: 'products', component: ProductList },
    { path: 'products/:id', component: ProductDetails },
    { path: 'about', component: About },
    { path: 'contact', redirectTo: 'about', pathMatch: 'full' },
    { path: 'wishlist', component: Wishlist },
    { path: 'cart', component: Cart },
    { path: 'blog', loadComponent: () => import('./pages/blog/blog').then(m => m.BlogList) },
    { path: 'blog/:slug', loadComponent: () => import('./pages/blog-detail/blog-detail').then(m => m.BlogDetail) },
    { path: 'customization', loadComponent: () => import('./pages/customization/customization').then(m => m.CustomizationComponent) },
    { path: 'customization/list', loadComponent: () => import('./pages/customization/design-list').then(m => m.DesignListComponent) },
    { path: 'customization/edit/:id', loadComponent: () => import('./pages/customization/customization').then(m => m.CustomizationComponent) },
    { path: 'login', loadComponent: () => import('./pages/login/login').then(m => m.Login) },
    { path: 'signup', loadComponent: () => import('./pages/signup/signup').then(m => m.Signup) },
    {
        path: 'checkout',
        loadComponent: () => import('./pages/checkout/checkout').then(m => m.Checkout)
    },
    {
        path: 'orders',
        loadComponent: () => import('./pages/my-orders/my-orders').then(m => m.MyOrdersComponent)
    },
    { path: 'profile', loadComponent: () => import('./pages/profile/profile').then(m => m.Profile), canActivate: [authGuard] },
    { path: 'admin/product/new', loadComponent: () => import('./pages/admin-product/admin-product').then(m => m.AdminProduct), canActivate: [adminGuard] },
    { path: 'admin/product/edit/:id', loadComponent: () => import('./pages/admin-product/admin-product').then(m => m.AdminProduct), canActivate: [adminGuard] },
    { path: 'admin/wastage', loadComponent: () => import('./pages/admin/wastage/wastage').then(m => m.WastageComponent), canActivate: [adminGuard] },
    { path: 'admin/blog', loadComponent: () => import('./pages/admin-blog/admin-blog').then(m => m.AdminBlogList), canActivate: [adminGuard] },
    { path: 'admin/blog/new', loadComponent: () => import('./pages/admin-blog-form/admin-blog-form').then(m => m.AdminBlogForm), canActivate: [adminGuard] },
    { path: 'admin/blog/edit/:id', loadComponent: () => import('./pages/admin-blog-form/admin-blog-form').then(m => m.AdminBlogForm), canActivate: [adminGuard] },
    { path: '**', redirectTo: '' }
];
