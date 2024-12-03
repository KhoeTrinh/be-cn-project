import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class Key {
  Api_key: string;
  Api_key_Array: string[]

  constructor(private configService: ConfigService) {
    this.Api_key = this.configService.get('API_KEY');
    this.Api_key_Array = this.Api_key.split(',')
  }
}