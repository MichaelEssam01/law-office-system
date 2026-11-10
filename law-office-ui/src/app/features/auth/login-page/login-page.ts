import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MessageModule } from 'primeng/message';
import { AuthService } from '../../../core/services/auth.service';
import { AppStateService } from '../../../core/services/app-state.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    MessageModule,
    TranslateModule
  ],
  templateUrl: './login-page.html',
  styleUrl: './login-page.css',
})
export class LoginPage implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private translate = inject(TranslateService);
  public appState = inject(AppStateService);
  public currentYear = new Date().getFullYear();

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  loading = signal(false);
  showPassword = signal(false);
  errorMessage = signal<string | null>(null);
  authNoticeKey = signal<string | null>(null);
  private returnUrl = '/dashboard';

  ngOnInit() {
    this.route.queryParamMap.subscribe(params => {
      const returnUrl = params.get('returnUrl');
      if (returnUrl && returnUrl.startsWith('/') && !returnUrl.startsWith('/login')) {
        this.returnUrl = returnUrl;
      }

      const reason = params.get('reason');
      if (reason === 'auth_required') {
        this.authNoticeKey.set('AUTH.LOGIN_REQUIRED_NOTICE');
      } else if (reason === 'session_expired') {
        this.authNoticeKey.set('AUTH.SESSION_EXPIRED_NOTICE');
      } else {
        this.authNoticeKey.set(null);
      }
    });
  }

  async onSubmit() {
    if (this.loginForm.valid) {
      this.loading.set(true);
      this.errorMessage.set(null);
      this.authNoticeKey.set(null);

      try {
        await this.authService.login(this.loginForm.value);
        await this.appState.refreshSettings();
        this.router.navigateByUrl(this.returnUrl || '/dashboard');
      } catch (err: any) {
        if (err.error?.code === 'ACCOUNT_INACTIVE') {
          this.errorMessage.set(this.translate.instant('AUTH.ERROR_INACTIVE'));
        } else if (err.error?.code === 'ACCOUNT_LOCKED') {
          this.errorMessage.set(this.translate.instant('AUTH.ERROR_LOCKED'));
        } else {
          this.errorMessage.set(err.error?.message || this.translate.instant('AUTH.ERROR_INVALID'));
        }
        this.loading.set(false);
      }
    }
  }
}
