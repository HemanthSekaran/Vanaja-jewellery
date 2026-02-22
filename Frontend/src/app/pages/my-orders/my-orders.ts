import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AlertService } from '../../services/alert.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-orders.html',
  styles: []
})
export class MyOrdersComponent implements OnInit {
  orders: any[] = [];
  loading = true;
  errorMessage: string | null = null;
  isAdmin = false;

  private api = inject(ApiService);
  private router = inject(Router);
  private cd = inject(ChangeDetectorRef);
  private authService = inject(AuthService);
  private alertService = inject(AlertService);
  private toastService = inject(ToastService);

  ngOnInit() {
    this.checkUserRole();
  }

  checkUserRole() {
    // Check role similar to ProductCard logic or design-list
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
        // Handle different response structures gracefully
        if (res.data && res.data.success && res.data.data && Array.isArray(res.data.data.orders)) {
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

  viewOrder(id: string) {
    // Navigate to order details if implemented, or just show alert for now
    // this.router.navigate(['/orders', id]); 
  }

  async updateStatus(orderId: string, status: string) {
    const confirmed = await this.alertService.confirm('Update Status', `Are you sure you want to change order #${orderId} status to ${status}?`);
    if (!confirmed) return; // The UI select might need to be reset if cancelled, but standard select doesn't easily allow revert without binding. We'll accept this for now.

    this.api.updateOrderStatus(orderId, status)
      .then((res: any) => {
        // Update local state
        const order = this.orders.find(o => o.order_id === orderId);
        if (order) {
          // DB returns the updated order object, usually. Or we just trust the input status.
          // Based on orderController.js updateOrderStatus: sends { order: updatedOrder }
          if (res.data && res.data.data && res.data.data.order) {
            // Full refresh of that order item preferable
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
}
