import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../core/services/order.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-container">
      <h2>Reports & Analytics</h2>

      <!-- Statistics Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-title">Total Revenue</div>
          <div class="stat-value">EGP {{ totalRevenue | number: '1.2-2' }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-title">Total Orders</div>
          <div class="stat-value">{{ totalOrders }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-title">Total Products Sold</div>
          <div class="stat-value">{{ totalProductsSold }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-title">Average Order Value</div>
          <div class="stat-value">EGP {{ averageOrderValue | number: '1.2-2' }}</div>
        </div>
      </div>

      <!-- Order Status Report -->
      <div class="report-section">
        <h3>Order Status Distribution</h3>
        <table class="table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Count</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of orderStatusReport">
              <td>{{ item.status }}</td>
              <td>{{ item.count }}</td>
              <td>{{ item.percentage }}%</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Top Products -->
      <div class="report-section">
        <h3>Top Selling Products</h3>
        <table class="table">
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Units Sold</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let product of topProducts">
              <td>{{ product.name }}</td>
              <td>{{ product.unitsSold }}</td>
              <td>EGP {{ product.revenue | number: '1.2-2' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Export Options -->
      <div class="export-section">
        <button class="btn btn-primary" (click)="exportToCSV()">Export as CSV</button>
        <button class="btn btn-primary" (click)="exportToPDF()">Export as PDF</button>
      </div>
    </div>
  `,
  styles: [
    `
      .admin-container {
        padding: 20px;
        background: #f5f5f5;
        border-radius: 8px;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
        margin-bottom: 30px;
      }

      .stat-card {
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        text-align: center;
      }

      .stat-title {
        color: #666;
        font-size: 14px;
        margin-bottom: 10px;
      }

      .stat-value {
        font-size: 28px;
        font-weight: bold;
        color: #007bff;
      }

      .report-section {
        background: white;
        padding: 20px;
        border-radius: 8px;
        margin-bottom: 20px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .report-section h3 {
        margin-top: 0;
        margin-bottom: 15px;
        color: #333;
      }

      .table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
      }

      .table th,
      .table td {
        padding: 12px;
        text-align: left;
        border-bottom: 1px solid #ddd;
      }

      .table th {
        background: #f8f9fa;
        font-weight: bold;
        color: #333;
      }

      .export-section {
        display: flex;
        gap: 10px;
        padding: 20px;
        background: white;
        border-radius: 8px;
      }

      .btn {
        padding: 10px 20px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
      }

      .btn-primary {
        background: #007bff;
        color: white;
      }

      .btn-primary:hover {
        background: #0056b3;
      }
    `,
  ],
})
export class AdminReportsComponent implements OnInit {
  totalRevenue = 0;
  totalOrders = 0;
  totalProductsSold = 0;
  averageOrderValue = 0;
  orderStatusReport: any[] = [];
  topProducts: any[] = [];

  constructor(
    private orderService: OrderService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router,
  ) {
    this.checkAdminAccess();
  }

  ngOnInit() {
    this.loadReports();
  }

  checkAdminAccess() {
    const user = this.authService.getCurrentUser();
    if (!user || user.role !== 'admin') {
      this.router.navigate(['/']);
    }
  }

  loadReports() {
    // Call API to load reports
    this.orderService.getDashboardStats().subscribe(
      (response: any) => {
        if (response.success && response.stats) {
          const stats = response.stats;
          this.totalRevenue = stats.monthlyRevenue || 0;
          this.totalOrders = stats.totalOrders || 0;
          this.totalProductsSold = stats.totalProducts || 0; // Approximate
          this.averageOrderValue = this.totalOrders > 0 ? this.totalRevenue / this.totalOrders : 0;
        }
      },
      (error: any) => {
        console.error('Failed to load reports:', error);
      },
    );

    // Load order status report and top products
    this.orderService.getAllOrders().subscribe(
      (response: any) => {
        if (response.orders) {
          const orders = response.orders;
          const statusCounts: any = {};
          const productSalesMap = new Map<
            string,
            { name: string; unitsSold: number; revenue: number }
          >();

          // Process orders for status report and top products
          orders.forEach((order: any) => {
            // Status counting
            const status = order.status;
            statusCounts[status] = (statusCounts[status] || 0) + 1;

            // Top products calculation
            if (order.items && Array.isArray(order.items)) {
              order.items.forEach((item: any) => {
                const productName = item.name || item.productName || 'Unknown Product';
                const productId = item._id || item.id || item.productId || productName;
                const quantity = item.quantity || 1;
                const price = item.price || 0;
                const revenue = quantity * price;

                if (productSalesMap.has(productId)) {
                  const existing = productSalesMap.get(productId)!;
                  existing.unitsSold += quantity;
                  existing.revenue += revenue;
                } else {
                  productSalesMap.set(productId, {
                    name: productName,
                    unitsSold: quantity,
                    revenue: revenue,
                  });
                }
              });
            }
          });

          // Process status report
          const total = Object.values(statusCounts).reduce((a: any, b: any) => a + b, 0);
          this.orderStatusReport = Object.entries(statusCounts).map(([status, count]: any) => ({
            status,
            count,
            percentage: Math.round((count / (total as number)) * 100),
          }));

          // Process top products (top 10 by revenue)
          this.topProducts = Array.from(productSalesMap.values())
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);

          console.log('✅ Top Products Loaded:', this.topProducts);
        }
      },
      (error: any) => {
        console.error('Failed to load order status report:', error);
      },
    );
  }

  exportToCSV() {
    // Prepare report data
    const reportData = {
      statistics: [
        { metric: 'Total Revenue', value: this.totalRevenue },
        { metric: 'Total Orders', value: this.totalOrders },
        { metric: 'Total Products Sold', value: this.totalProductsSold },
        { metric: 'Average Order Value', value: this.averageOrderValue },
      ],
      orderStatusReport: this.orderStatusReport,
      topProducts: this.topProducts,
    };

    // Build CSV content
    let csvContent = 'Reports & Analytics Export\n';
    csvContent += `Export Date: ${new Date().toLocaleString()}\n\n`;

    // Statistics Section
    csvContent += 'STATISTICS\n';
    csvContent += 'Metric,Value\n';
    reportData.statistics.forEach((stat) => {
      csvContent += `"${stat.metric}","${stat.value.toFixed(2)}"\n`;
    });

    csvContent += '\n\nORDER STATUS DISTRIBUTION\n';
    csvContent += 'Status,Count,Percentage\n';
    reportData.orderStatusReport.forEach((status) => {
      csvContent += `"${status.status}","${status.count}","${status.percentage}%"\n`;
    });

    csvContent += '\n\nTOP SELLING PRODUCTS\n';
    csvContent += 'Product Name,Units Sold,Revenue\n';
    reportData.topProducts.forEach((product) => {
      csvContent += `"${product.name}","${product.unitsSold}","${product.revenue.toFixed(2)}"\n`;
    });

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `reports_${new Date().getTime()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    this.notificationService.success('Report exported as CSV successfully!');
  }

  exportToPDF() {
    // Generate HTML content for PDF
    let htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Reports & Analytics</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              background: #f5f5f5;
            }
            .header {
              background: #007bff;
              color: white;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 20px;
              text-align: center;
            }
            h1 {
              margin: 0;
              font-size: 28px;
            }
            .export-date {
              font-size: 12px;
              opacity: 0.9;
              margin-top: 10px;
            }
            .section {
              background: white;
              padding: 20px;
              margin-bottom: 20px;
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            .section h2 {
              border-bottom: 2px solid #007bff;
              padding-bottom: 10px;
              margin-bottom: 15px;
              color: #333;
            }
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 15px;
              margin-bottom: 15px;
            }
            .stat-box {
              background: #f9f9f9;
              padding: 15px;
              border-left: 4px solid #007bff;
              border-radius: 4px;
            }
            .stat-label {
              color: #666;
              font-size: 12px;
              font-weight: bold;
              text-transform: uppercase;
              margin-bottom: 5px;
            }
            .stat-value {
              font-size: 24px;
              font-weight: bold;
              color: #007bff;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            th {
              background-color: #f0f0f0;
              padding: 12px;
              text-align: left;
              font-weight: bold;
              border-bottom: 2px solid #007bff;
            }
            td {
              padding: 10px 12px;
              border-bottom: 1px solid #ddd;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .footer {
              text-align: center;
              color: #666;
              font-size: 12px;
              margin-top: 30px;
              border-top: 1px solid #ddd;
              padding-top: 15px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📊 Reports & Analytics</h1>
            <div class="export-date">
              Generated on: ${new Date().toLocaleString()}
            </div>
          </div>

          <!-- Statistics Section -->
          <div class="section">
            <h2>Key Statistics</h2>
            <div class="stats-grid">
              <div class="stat-box">
                <div class="stat-label">Total Revenue</div>
                <div class="stat-value">EGP ${this.totalRevenue.toFixed(2)}</div>
              </div>
              <div class="stat-box">
                <div class="stat-label">Total Orders</div>
                <div class="stat-value">${this.totalOrders}</div>
              </div>
              <div class="stat-box">
                <div class="stat-label">Total Products Sold</div>
                <div class="stat-value">${this.totalProductsSold}</div>
              </div>
              <div class="stat-box">
                <div class="stat-label">Average Order Value</div>
                <div class="stat-value">EGP ${this.averageOrderValue.toFixed(2)}</div>
              </div>
            </div>
          </div>

          <!-- Order Status Distribution -->
          <div class="section">
            <h2>Order Status Distribution</h2>
            <table>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Count</th>
                  <th>Percentage</th>
                </tr>
              </thead>
              <tbody>
                ${this.orderStatusReport
                  .map(
                    (item) => `
                  <tr>
                    <td>${item.status}</td>
                    <td>${item.count}</td>
                    <td>${item.percentage}%</td>
                  </tr>
                `,
                  )
                  .join('')}
              </tbody>
            </table>
          </div>

          <!-- Top Selling Products -->
          <div class="section">
            <h2>Top Selling Products</h2>
            <table>
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Units Sold</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                ${this.topProducts
                  .map(
                    (product) => `
                  <tr>
                    <td>${product.name}</td>
                    <td>${product.unitsSold}</td>
                    <td>EGP ${product.revenue.toFixed(2)}</td>
                  </tr>
                `,
                  )
                  .join('')}
              </tbody>
            </table>
          </div>

          <div class="footer">
            <p>© 2026 E-commerce Reports. All rights reserved.</p>
            <p>This is an automatically generated report.</p>
          </div>
        </body>
      </html>
    `;

    // Open print dialog
    const printWindow = window.open('', '', 'height=800,width=1000');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
        this.notificationService.success('Report ready for PDF export!');
      }, 250);
    } else {
      this.notificationService.error('Could not open print dialog. Check popup blockers.');
    }
  }
}
