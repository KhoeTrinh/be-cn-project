import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Index } from '.';
import { Model } from 'mongoose';

@Injectable()
export class IndexService {
  constructor(@InjectModel(Index.name) private indexModel: Model<Index>) {}

  async getIndex(): Promise<number> {
    const index = await this.indexModel.findOne();
    return index ? index.index : 0;
  }

  async updateIndexByPlusOne(): Promise<number> {
    const index = await this.indexModel.findOne();
    if (!index) {
      const newIndex = new this.indexModel({ index: 1 });
      await newIndex.save();
      return 1;
    }
    index.index += 1;
    await index.save(); 
    return index.index;
  }
}
