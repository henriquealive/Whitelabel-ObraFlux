import { Role } from '../enums/roles.enum';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  phone?: string | null;
  role: Role;
  tenantId: string;
  twoFactorEnabled: boolean;
  isEmailVerified: boolean;
  createdAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: UserProfile;
  tokens: AuthTokens;
  requiresTwoFactor: boolean;
}

export interface JwtPayload {
  sub: string;       // userId
  email: string;
  tenantId: string;
  role: Role;
  iat?: number;
  exp?: number;
}
