import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../../modules/audit/audit.service';
import { AuditAction } from '@prisma/client';

const METHOD_ACTION_MAP: Record<string, AuditAction> = {
  POST: AuditAction.CREATE,
  PUT: AuditAction.UPDATE,
  PATCH: AuditAction.UPDATE,
  DELETE: AuditAction.DELETE,
};

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user, tenantId, ip, headers } = request;
    const action = METHOD_ACTION_MAP[method];

    if (!action || !user || !tenantId) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(() => {
        // Fire-and-forget audit log (non-blocking)
        this.auditService
          .log({
            tenantId,
            userId: user.id,
            action,
            entity: this.extractEntity(url),
            entityId: this.extractEntityId(url),
            ip: ip as string,
            userAgent: headers['user-agent'] as string,
            requestId: headers['x-request-id'] as string,
          })
          .catch(() => {
            // Silently ignore audit failures
          });
      }),
    );
  }

  private extractEntity(url: string): string {
    const parts = url.split('/').filter(Boolean);
    // e.g. /api/v1/projects/123 → "projects"
    const apiIdx = parts.indexOf('v1');
    return apiIdx >= 0 && parts[apiIdx + 1] ? parts[apiIdx + 1] : 'unknown';
  }

  private extractEntityId(url: string): string | undefined {
    const parts = url.split('/').filter(Boolean);
    const apiIdx = parts.indexOf('v1');
    return apiIdx >= 0 ? parts[apiIdx + 2] : undefined;
  }
}
