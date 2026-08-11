import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError, switchMap, BehaviorSubject, filter, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

// These URLs should never trigger a token refresh on 401
const AUTH_BYPASS_URLS = [
  'auth/login',
  'auth/refresh-token',
  'auth/me',
  'auth/forgot-password',
  'auth/reset-password',
  'settings/public'
];

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<boolean | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  const authReq = req.clone({ withCredentials: true });

  const isAuthBypass = AUTH_BYPASS_URLS.some(url => req.url.includes(url));

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isAuthBypass) {
        if (!isRefreshing) {
          isRefreshing = true;
          refreshTokenSubject.next(null);

          return authService.refreshToken().pipe(
            switchMap(() => {
              isRefreshing = false;
              refreshTokenSubject.next(true);
              return next(authReq);
            }),
            catchError((refreshErr) => {
              isRefreshing = false;
              refreshTokenSubject.next(false);
              authService.clearLocalState();
              return throwError(() => refreshErr);
            })
          );
        } else {
          // If already refreshing, wait for the first one to finish
          return refreshTokenSubject.pipe(
            filter(result => result !== null),
            take(1),
            switchMap(result => {
              if (result === true) {
                return next(authReq);
              }
              return throwError(() => error);
            })
          );
        }
      }
      return throwError(() => error);
    })
  );
};
