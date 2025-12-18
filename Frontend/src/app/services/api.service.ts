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
    getProducts = (params?: any) => axios.get("/products", { params });
    getCategories = () => axios.get("/products/categories/list");
    getProductById = (id: string) => axios.get(`/products/${id}`);
    createProduct = (data: any) => axios.post("/products", data);
    updateProduct = (id: string, data: any) => axios.put(`/products/${id}`, data);
    deleteProduct = (id: string) => axios.delete(`/products/${id}`);

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
}
