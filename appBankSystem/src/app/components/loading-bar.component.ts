import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingService } from '../services/loading.service';

@Component({
  selector: 'app-loading-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loading-bar" *ngIf="loadingService.loading$ | async">
      <div class="loading-bar-inner"></div>
    </div>
  `,
  styles: [`
    .loading-bar {
      position: fixed; top: 0; left: 0; right: 0;
      height: 3px; z-index: 10001; overflow: hidden;
      background: rgba(30, 64, 175, 0.1);
    }
    .loading-bar-inner {
      height: 100%; width: 40%;
      background: #1e40af; border-radius: 0 2px 2px 0;
      animation: loading 1.2s ease-in-out infinite;
    }
    @keyframes loading {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(350%); }
    }
  `]
})
export class LoadingBarComponent {
  constructor(public loadingService: LoadingService) {}
}
