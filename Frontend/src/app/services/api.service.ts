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
    getProfile = () => axios.get("/auth/me");
    updateProfile = (data: any) => axios.put("/auth/profile", data); // Keeping as placeholder if needed, or remove if not in list

    // Products
    getProducts = (params?: {
        page?: number;
        limit?: number;
        filterType?: 'category' | 'metal' | 'metalPurity' | 'weight';
        filterValue?: string;
        availability?: string;
    }) => axios.get("/products", { params });
    getTopSellingProducts = (params?: { page?: number; limit?: number }) => axios.get("/products/top-selling", { params });
    getFeaturedProducts = (params?: { page?: number; limit?: number }) => axios.get("/products/featured", { params });
    getCategories = () => axios.get("/products/categories/list");
    getProductById = (id: string) => axios.get(`/products/${id}`);
    createProduct = (formData: FormData) => axios.post("/products", formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    updateProduct = (id: string, formData: FormData) => axios.put(`/products/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    // JSON update for status toggles to avoid multipart string conversion issues
    updateProductStatus = (id: string, data: any) => axios.put(`/products/${id}`, data);
    deleteProduct = (id: string) => axios.delete(`/products/${id}`);

    // User Data
    getCart = () => axios.get("/products/user/cart");
    getWishlist = () => axios.get("/products/user/wishlist");

    // Customization
    submitCustomization = (data: any) => axios.post("/designs", data);
    updateDesign = (id: string, data: any) => axios.put(`/designs/${id}`, data);
    getUserDesigns = () => axios.get("/designs");
    getDesign = (id: string) => axios.get(`/designs/${id}`);

    // Admin Customization
    getAllDesigns = () => axios.get("/designs/admin/all");
    updateDesignStatus = (id: string, status: string) => axios.put(`/designs/${id}/status`, { status });

    // Contact
    sendMessage = (data: any) => axios.post("/contact", data);

    // Orders
    createOrder = (data: any) => axios.post("/orders", data);
    getOrders = () => axios.get("/orders");
    getOrderById = (id: string) => axios.get(`/orders/${id}`);

    // Metal Prices
    getMetalPrices = () => axios.get("/metal-prices");
    updateMetalPrice = (metalName: string, price: number) => axios.put(`/metal-prices/${metalName}`, { price });
}
