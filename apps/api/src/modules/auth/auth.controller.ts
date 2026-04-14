import {
  Controller,
  Post,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import {
  LoginDto,
  RefreshTokenDto,
  VerifyTotpDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/login.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Request } from 'express';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new tenant + admin user' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email/password' })
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, req.ip, req.headers['user-agent']);
  }

  @Public()
  @Post('verify-2fa')
  @HttpCode(HttpStatus.OK)
  verify2fa(@Body() dto: VerifyTotpDto, @Req() req: Request) {
    return this.authService.verifyTwoFactor(dto.userId, dto.code, req.ip, req.headers['user-agent']);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  logout(@CurrentUser() user: { id: string }, @Body() dto: RefreshTokenDto) {
    return this.authService.logout(user.id, dto.refreshToken);
  }

  @Get('setup-2fa')
  @ApiBearerAuth()
  setup2fa(@CurrentUser() user: { id: string; email: string }) {
    return this.authService.setupTwoFactor(user.id);
  }

  @Post('confirm-2fa')
  @ApiBearerAuth()
  confirm2fa(@CurrentUser() user: { id: string }, @Body() dto: VerifyTotpDto) {
    return this.authService.confirmTwoFactor(user.id, dto.code);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  forgotPassword(@Body() dto: ForgotPasswordDto, @Req() req: Request & { tenantId?: string }) {
    return this.authService.forgotPassword(dto.email, req.tenantId || '');
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  @Get('me')
  @ApiBearerAuth()
  me(@CurrentUser() user: Record<string, unknown>) {
    return user;
  }
}
