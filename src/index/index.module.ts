import { Module } from '@nestjs/common';
import { IndexService } from './index.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Index, IndexSchema } from '.';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Index.name, schema: IndexSchema }]),
  ],
  providers: [IndexService],
  exports: [IndexService]
})
export class IndexModule {}
