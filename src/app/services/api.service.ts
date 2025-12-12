import { Injectable } from '@angular/core';
import axios from 'axios';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';
import { TokenService } from './token.service';

@Injectable({
    providedIn: 'root'
})
export class ApiService {

    constructor(private tokenService: TokenService, private router: Router) {
        const baseUrl = environment.baseUrl;
        axios.defaults.baseURL = baseUrl;

        axios.interceptors.request.use(async (request: any) => {
            const token = await this.tokenService.getToken();
            if (token) {
                request.headers = request.headers || {};
                request.headers.Authorization = `Bearer ${token}`;
            }
            return request;
        }, (err: any) => Promise.reject(err));

        axios.interceptors.response.use((response: any) => response, (err: any) => {
            if (err.response && err.response.status == 401 && this.router.url != "/login") {
                this.router.navigateByUrl("/login");
            }
            return Promise.reject(err);
        });
    }


    // Auth
    login = (data: { email: string, password: string }) => axios.post("/auth/login", data);
    register = (data: any) => axios.post("/auth/register", data);
    getProfile = () => axios.get("/auth/profile");
    updateProfile = (data: any) => axios.put("/auth/profile", data);

    // Products
    getProducts = (params?: any) => axios.get("/products", { params });
    getProductById = (id: string) => axios.get(`/products/${id}`);
    getFeaturedProducts = () => axios.get("/products/featured");

    // Cart
    getCart = () => axios.get("/cart");
    addToCart = (data: { productId: string, variantId: string, quantity: number }) => axios.post("/cart", data);
    updateCartItem = (itemId: string, quantity: number) => axios.put(`/cart/${itemId}`, { quantity });
    removeFromCart = (itemId: string) => axios.delete(`/cart/${itemId}`);
    clearCart = () => axios.delete("/cart");

    // Wishlist
    getWishlist = () => axios.get("/wishlist");
    addToWishlist = (productId: string) => axios.post("/wishlist", { productId });
    removeFromWishlist = (productId: string) => axios.delete(`/wishlist/${productId}`);

    // Customization
    submitCustomization = (data: any) => axios.post("/customization", data);
    getCustomizationRequests = () => axios.get("/customization");

    // Contact
    sendMessage = (data: any) => axios.post("/contact", data);

    // Orders
    createOrder = (data: any) => axios.post("/orders", data);
    getOrders = () => axios.get("/orders");
    getOrderById = (id: string) => axios.get(`/orders/${id}`);
}
