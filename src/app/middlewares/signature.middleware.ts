import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

@Injectable()
export class SignatureMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const signature = req.headers['x-signature'] as string;
    const timestamp = req.headers['x-timestamp'] as string;
    const secret = process.env.SHARED_SECRET; // Bí mật

    if (!signature || !timestamp) {
      throw new UnauthorizedException('Missing signature or timestamp');
    }

    // Kiểm tra thời gian (giới hạn 5 phút)
    const currentTimestamp = Date.now();
    if (Math.abs(currentTimestamp - parseInt(timestamp)) > 300000) {
      throw new UnauthorizedException('Timestamp is too old or invalid');
    }

    // Tạo chữ ký từ URL và timestamp
    const url = req.originalUrl;
    const payload = `${url}:${timestamp}`;
    const validSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    if (signature !== validSignature) {
      throw new UnauthorizedException('Invalid signature');
    }

    next();
  }
}
