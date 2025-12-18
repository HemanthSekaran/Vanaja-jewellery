import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Product } from '../models/product.model';
import { mockProducts, featuredCollections } from '../data/products.data';

@Injectable({
    providedIn: 'root'
})
export class ProductService {
    constructor() { }

    getProducts(): Observable<Product[]> {
        return of(mockProducts);
    }

    getFeaturedCollections() {
        return of(featuredCollections);
    }

    getProductById(id: string): Observable<Product | undefined> {
        return of(mockProducts.find(p => p.id === id));
    }

    addProduct(product: Product): Observable<boolean> {
        mockProducts.push(product);
        return of(true);
    }

    updateProduct(product: Product): Observable<boolean> {
        const index = mockProducts.findIndex(p => p.id === product.id);
        if (index !== -1) {
            mockProducts[index] = product;
            return of(true);
        }
        return of(false);
    }

    deleteProduct(id: string): Observable<boolean> {
        const index = mockProducts.findIndex(p => p.id === id);
        if (index !== -1) {
            mockProducts.splice(index, 1);
            return of(true);
        }
        return of(false);
    }
}
