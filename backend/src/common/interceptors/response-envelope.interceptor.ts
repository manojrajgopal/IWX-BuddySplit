import {
  CallHandler, ExecutionContext, Injectable, NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

@Injectable()
export class ResponseEnvelopeInterceptor<T> implements NestInterceptor<T, { success: true; data: T }> {
  intercept(_ctx: ExecutionContext, next: CallHandler<T>): Observable<{ success: true; data: T }> {
    return next.handle().pipe(map((data) => ({ success: true, data })));
  }
}
