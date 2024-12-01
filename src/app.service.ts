import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { ImageInfo } from './app.dto';

@Injectable()
export class AppService {
  constructor(private httpService: HttpService) {}

  async getImageInfo(data: ImageInfo) {
    const payload = ({
      ...data,
      model: 'model_3',
    });
    const headers = {
      accept: '*/*',
      'accept-encoding': 'gzip, deflate, br, zstd',
      'accept-language': 'vi,en-US;q=0.9,en;q=0.8',
      'content-type': 'application/json',
      origin: 'https://insect-identifier.netlify.app',
      referer: 'https://insect-identifier.netlify.app/',
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
    };
    const res = await firstValueFrom(
      this.httpService.post(
        'https://insect-identifier.netlify.app/api/identify-insect',
        payload,
        { headers },
      ),
    );
    console.log(res);
    return res.data.result
  }
}
