import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ChartModule } from 'primeng/chart';
import { ButtonModule } from 'primeng/button';
import { AdminService, AdminMetricDto } from '../../service/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, TableModule, ChartModule, ButtonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  metrics: AdminMetricDto[] = [];
  
  expandedChartData: any;
  chartOptions: any;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.adminService.getMetrics().subscribe({
      next: (data) => {
        this.metrics = data;
        this.initChartOptions();
      },
      error: (err) => console.error('Failed to load admin metrics', err)
    });
  }

  initChartOptions() {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color');
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border');

    this.chartOptions = {
      maintainAspectRatio: false,
      aspectRatio: 2.5,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          ticks: { color: textColor },
          grid: { color: surfaceBorder, drawBorder: false }
        },
        y: {
          ticks: { color: textColor, stepSize: 1 },
          grid: { color: surfaceBorder, drawBorder: false }
        }
      }
    };
  }

  onRowExpand(event: any) {
    const metric: AdminMetricDto = event.data;
    const documentStyle = getComputedStyle(document.documentElement);
    
    // Generate a fresh chart just for the clicked row
    this.expandedChartData = {
      labels: ['Total Users', 'Total Recipes'],
      datasets: [
        {
          label: 'Count',
          backgroundColor: [
            documentStyle.getPropertyValue('--blue-500') || '#3B82F6',
            documentStyle.getPropertyValue('--pink-500') || '#EC4899'
          ],
          data: [metric.numberOfUsers, metric.numberOfRecipes]
        }
      ]
    };
  }
}