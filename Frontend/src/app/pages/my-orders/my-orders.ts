import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AlertService } from '../../services/alert.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { ExportService } from '../../services/export.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule, RouterModule],
  providers: [DatePipe],
  templateUrl: './my-orders.html',
  styles: []
})
export class MyOrdersComponent implements OnInit {
  orders: any[] = [];
  loading = true;
  errorMessage: string | null = null;
  isAdmin = false;
  selectedImage: string | null = null;

  private api = inject(ApiService);
  private router = inject(Router);
  private cd = inject(ChangeDetectorRef);
  private authService = inject(AuthService);
  private alertService = inject(AlertService);
  private toastService = inject(ToastService);
  private exportService = inject(ExportService);
  private datePipe = inject(DatePipe);

  ngOnInit() {
    this.checkUserRole();
  }

  checkUserRole() {
    try {
      const storedUser = sessionStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        const userData = parsedUser.user || parsedUser;
        this.isAdmin = userData?.role === 'admin';
      }
    } catch (e) {
      console.error("Error parsing user from session", e);
    }

    this.fetchOrders();
  }

  fetchOrders() {
    this.loading = true;
    this.errorMessage = null;

    const fetchPromise = this.isAdmin ? this.api.getAllOrdersAdmin() : this.api.getOrders();

    fetchPromise
      .then((res: any) => {
        if (res.data && res.data.data && Array.isArray(res.data.data.orders)) {
          this.orders = res.data.data.orders;
        } else if (res.data && res.data.orders && Array.isArray(res.data.orders)) {
          this.orders = res.data.orders;
        } else if (res.data && Array.isArray(res.data)) {
          this.orders = res.data;
        } else {
          this.orders = [];
        }
        console.log('Orders loaded:', this.orders);
      })
      .catch((err: any) => {
        console.error("Failed to fetch orders", err);
        this.errorMessage = "Failed to load orders. Please try again.";
      })
      .finally(() => {
        this.loading = false;
        this.cd.detectChanges();
      });
  }

  async updateStatus(orderId: string, status: string) {
    const confirmed = await this.alertService.confirm('Update Status', `Are you sure you want to change order #${orderId} status to ${status}?`);
    if (!confirmed) return;

    this.api.updateOrderStatus(orderId, status)
      .then((res: any) => {
        const order = this.orders.find(o => o.order_id === orderId);
        if (order) {
          if (res.data && res.data.data && res.data.data.order) {
            Object.assign(order, res.data.data.order);
          } else {
            order.order_status = status;
          }
          this.cd.detectChanges();
          this.toastService.success('Order status updated successfully');
        }
      })
      .catch((err: any) => {
        console.error("Failed to update status", err);
        this.toastService.error("Failed to update status");
      });
  }

  getImageUrl(filename: string): string {
    if (!filename) return 'assets/images/placeholder.jpg';
    if (filename.startsWith('http')) return filename;
    return `http://localhost:5000/uploads/products/${filename}`;
  }

  onImageError(event: any) {
    event.target.src = 'assets/images/placeholder.jpg';
  }

  openLightbox(imageUrl: string) {
    this.selectedImage = imageUrl;
    document.body.style.overflow = 'hidden';
  }

  closeLightbox() {
    this.selectedImage = null;
    document.body.style.overflow = 'auto';
  }

  downloadImage(imageUrl: string) {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = imageUrl.split('/').pop() || 'order-product.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  exportToExcel() {
    const exportData = this.orders.map(order => ({
      'Order ID': order.order_id,
      'Date': this.datePipe.transform(order.created_at, 'mediumDate'),
      'Customer Name': order.user_name || 'Anonymous',
      'Customer Email': order.user_email,
      'Product': order.product_name,
      'Metal': `${order.metal} ${order.metal_purity}`,
      'Weight (g)': order.weight,
      'Price (INR)': order.final_price,
      'Status': order.order_status
    }));

    this.exportService.exportToExcel(exportData, `Orders_${this.isAdmin ? 'Admin' : 'User'}_${new Date().getTime()}`);
  }

  exportToPDF() {
    const headers = ['ID', 'Date', 'Customer', 'Product', 'Weight', 'Price', 'Status'];
    const data = this.orders.map(order => [
      `#${order.order_id}`,
      this.datePipe.transform(order.created_at, 'mediumDate'),
      order.user_name || 'Anonymous',
      order.product_name,
      `${order.weight}g`,
      `₹${order.final_price}`,
      order.order_status || 'pending'
    ]);

    const title = this.isAdmin ? 'All Orders Report' : 'My Orders Report';
    this.exportService.exportToPDF(headers, data, `Orders_${this.isAdmin ? 'Admin' : 'User'}_${new Date().getTime()}`, title);
  }
}
