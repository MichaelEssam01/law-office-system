import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { AppStateService } from '../../../core/services/app-state.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    TranslateModule
  ],
  templateUrl: './reset-password-page.html',
  styles: ``
})
export class ResetPasswordPage implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private translate = inject(TranslateService);
  public appState = inject(AppStateService);
  
  currentYear = new Date().getFullYear();

  otp: string | null = null;
  email: string | null = null;
  
  resetForm = this.fb.group({
    otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: this.passwordMatchValidator });

  loading = signal(false);
  success = signal(false);
  errorMessage = signal<string | null>(null);
  showPassword = signal(false);

  ngOnInit() {
    this.otp = this.route.snapshot.queryParamMap.get('otp');
    this.email = this.route.snapshot.queryParamMap.get('email');
    
    if (this.otp) {
      this.resetForm.patchValue({ otp: this.otp });
    }
    
    if (!this.email) {
      this.errorMessage.set('Invalid request. Email is required.');
    }
  }

  passwordMatchValidator(g: any) {
    const password = g.get('password').value;
    const confirmPassword = g.get('confirmPassword').value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  async onSubmit() {
    if (this.resetForm.valid && this.email) {
      this.loading.set(true);
      this.errorMessage.set(null);
      
      try {
        await this.authService.resetPassword({
          otp: this.resetForm.value.otp,
          email: this.email,
          newPassword: this.resetForm.value.password
        });
        this.success.set(true);
        setTimeout(() => this.router.navigate(['/login']), 3000);
      } catch (err: any) {
        this.errorMessage.set(err.error?.message || 'Error resetting password');
      } finally {
        this.loading.set(false);
      }
    }
  }
}
