import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvatarModule } from 'primeng/avatar';
import { InputTextModule } from 'primeng/inputtext';
import { BadgeModule } from 'primeng/badge';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, AvatarModule, InputTextModule, BadgeModule],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header {
  public authService = inject(AuthService);
}
