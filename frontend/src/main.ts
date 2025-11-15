import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// Configure PDF.js worker before app bootstrap
(window as any).pdfWorkerSrc = '/pdf.worker.min.mjs';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
