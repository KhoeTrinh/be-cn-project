import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable } from '@nestjs/common';
import { Key } from './app.collection';
import { IndexService } from 'src/index/index.service';
import { ImageInfo } from './app.dto';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AppService {
  index: number = 0;
  api_key: string = '';
  headers: any = {};
  constructor(
    private httpService: HttpService,
    private keyService: Key,
    private indexService: IndexService,
  ) {}
  async getImageInfo(data: ImageInfo) {
    try {
      this.index = await this.indexService.getIndex();
      this.api_key = this.keyService.Api_key_Array[this.index];
      if (!this.api_key) {
        throw new HttpException('Invalid API Key Index', 400);
      }
      this.headers = {
        'Api-Key': this.api_key,
        'Content-Type': 'application/json',
      };
      const url1 = 'https://insect.kindwise.com/api/v1/usage_info';
      const check = await firstValueFrom(
        this.httpService.get(url1, { headers: this.headers }),
      );
      if (check.data.remaining.total <= 0) {
        this.index = await this.indexService.updateIndexByPlusOne();
        this.api_key = this.keyService.Api_key_Array[this.index];
        this.headers = {
          'Api-Key': this.api_key,
          'Content-Type': 'application/json',
        };
      }
      const params = {
        details:
          'common_names,url,taxonomy,rank,description,images,danger_description,role,inaturalist_id',
        language: 'en',
      };
      const url2 = `https://insect.kindwise.com/api/v1/identification?details=${params.details}&language=${params.language}`;
      const payload = {
        images: [data.images[0]],
        similar_images: true,
      };
      const res = await firstValueFrom(
        this.httpService.post(url2, payload, { headers: this.headers }),
      );
      if (res.data.result.is_insect.probability <= 0.3) {
        throw new HttpException('This picture is not an insect', 400);
      }
      return res.data;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.error('Error fetching image info:', error.message || error);
      throw new HttpException('Failed to fetch image info', 500);
    }
  }
}
