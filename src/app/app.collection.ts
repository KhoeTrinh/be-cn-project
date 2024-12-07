import { HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class Key {
  Api_key_Array: string[]

  constructor(private configService: ConfigService) {
    const apikeys = this.configService.get('API_KEY');
    if(!apikeys) throw new HttpException('Api key not found', 400)
    this.Api_key_Array = apikeys.split(',')
  }
}