import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { AppStateService } from '../../../core/services/app-state.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ButtonModule,
    InputTextModule,
    TranslateModule
  ],
  templateUrl: './forgot-password-page.html',
  styles: ``
})
export class ForgotPasswordPage {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private translate = inject(TranslateService);
  private router = inject(Router);
  public appState = inject(AppStateService);
  
  currentYear = new Date().getFullYear();

  forgotForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  loading = signal(false);
  success = signal(false);
  errorMessage = signal<string | null>(null);

  async onSubmit() {
    if (this.forgotForm.valid) {
      this.loading.set(true);
      this.errorMessage.set(null);
      
      try {
        await this.authService.forgotPassword(this.forgotForm.value.email!);
        this.success.set(true);
        // After showing success for a brief moment, navigate to reset password page
        setTimeout(() => {
          this.router.navigate(['/reset-password'], { 
            queryParams: { email: this.forgotForm.value.email }
          });
        }, 3000);
      } catch (err: any) {
        this.errorMessage.set(err.error?.message || 'Error sending reset email');
        // For demonstration purposes, let's show success if the API fails but we want to show the UI
        // this.success.set(true); 
      } finally {
        this.loading.set(false);
      }
    }
  }
}
