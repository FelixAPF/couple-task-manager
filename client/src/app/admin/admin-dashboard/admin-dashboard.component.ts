import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { AdminService, AdminMetricDto } from '../../service/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, ChartModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  metrics: AdminMetricDto[] = [];
  chartData: any;
  chartOptions: any;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.adminService.getMetrics().subscribe({
      next: (data) => {
        this.metrics = data;
        this.initChart();
      },
      error: (err) => console.error('Failed to load admin metrics', err)
    });
  }

  initChart(): void {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color');
    const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border');

    this.chartData = {
      labels: this.metrics.map(m => m.householdName),
      datasets: [
        {
          label: 'Number of Users',
          backgroundColor: documentStyle.getPropertyValue('--blue-500') || '#3B82F6',
          borderColor: documentStyle.getPropertyValue('--blue-500') || '#3B82F6',
          data: this.metrics.map(m => m.numberOfUsers)
        },
        {
          label: 'Number of Recipes',
          backgroundColor: documentStyle.getPropertyValue('--pink-500') || '#EC4899',
          borderColor: documentStyle.getPropertyValue('--pink-500') || '#EC4899',
          data: this.metrics.map(m => m.numberOfRecipes)
        }
      ]
    };

    this.chartOptions = {
      maintainAspectRatio: false,
      aspectRatio: 0.8,
      plugins: {
        legend: {
          labels: {
            color: textColor
          }
        },
        title: {
          display: true,
          text: 'Household Statistics',
          color: textColor,
          font: {
            size: 16
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: textColorSecondary,
            font: {
              weight: 500
            }
          },
          grid: {
            color: surfaceBorder,
            drawBorder: false
          }
        },
        y: {
          ticks: {
            color: textColorSecondary,
            stepSize: 1
          },
          grid: {
            color: surfaceBorder,
            drawBorder: false
          }
        }
      }
    };
  }
}