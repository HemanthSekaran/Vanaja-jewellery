import { Injectable, Injector } from '@angular/core';
import axios from 'axios';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';
import { TokenService } from './token.service';
import { ToastService } from './toast.service';
import { AuthService } from './auth.service';


@Injectable({
    providedIn: 'root'
})
export class ApiService {

    constructor(
        private tokenService: TokenService,
        private router: Router,
        private toastService: ToastService,
        private injector: Injector
    ) {
        const baseUrl = environment.baseUrl;
        axios.defaults.baseURL = baseUrl;

        axios.interceptors.request.use(async (request: any) => {
            const token = await this.tokenService.getToken();
            if (token) {
                if (this.tokenService.isTokenExpired(token)) {
                    // Trigger logout but don't reject yet to allow synchronous flow
                    // Actually best to reject so the actual call doesn't happen
                    const authService = this.injector.get(AuthService);
                    authService.logout();
                    return Promise.reject(new Error('Token expired'));
                }
                request.headers = request.headers || {};
                request.headers.Authorization = `Bearer ${token}`;
            }
            return request;
        }, (err: any) => Promise.reject(err));

        axios.interceptors.response.use((response: any) => response, (err: any) => {
            const errorMessage = err.response?.data?.message || err.message || 'Something went wrong';

            if (err.response && err.response.status == 401) {
                const authService = this.injector.get(AuthService);
                authService.logout();
            } else if (errorMessage !== 'Token expired') {
                this.toastService.show(errorMessage, 'error');
            }

            return Promise.reject(err);
        });
    }


    // Auth
    login = (data: { email: string }) => axios.post("/auth/login", data);
    loginVerify = (data: { email: string, otp: string }) => axios.post("/auth/login/verify", data);
    register = (data: any) => axios.post("/auth/register", data);
    registerVerify = (data: { email: string, otp: string }) => axios.post("/auth/register/verify", data);
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
    getFilterOptions = () => axios.get("/products/filter-options");
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
    createOrder = (data: any) => axios.post("/orders/checkout", data);
    getOrders = () => axios.get("/orders");
    getAllOrdersAdmin = () => axios.get("/orders/admin/all");
    getOrderById = (id: string) => axios.get(`/orders/${id}`);
    updateOrderStatus = (id: string, status: string) => axios.put(`/orders/${id}/status`, { status });

    // Metal Prices
    getMetalPrices = () => axios.get("/metal-prices");
    updateMetalPrice = (metalName: string, price: number) => axios.put(`/metal-prices/${metalName}`, { price });

    // Wastage
    getWastages = () => axios.get("/wastage");
    createWastage = (data: { jewel_type: string; wastage: string }) => axios.post("/wastage", data);
    updateWastage = (id: number, data: { jewel_type: string; wastage: string }) => axios.put(`/wastage/${id}`, data);
    deleteWastage = (id: number) => axios.delete(`/wastage/${id}`);
}
