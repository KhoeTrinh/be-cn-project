import { MiddlewareConsumer, Module,RequestMethod  } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HttpModule } from '@nestjs/axios';
import { IndexModule } from 'src/index/index.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Key } from './app.collection';
import { SignatureMiddleware } from './middlewares/signature.middleware'; // Import middleware

@Module({
  imports: [
    HttpModule,
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get('DB_URL'),
      }),
      inject: [ConfigService],
    }),
    IndexModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService, Key],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SignatureMiddleware)  // Áp dụng middleware
      .forRoutes(                    // Chỉ áp dụng cho các route cụ thể
        { path: '/', method: RequestMethod.ALL },
        { path: '/details', method: RequestMethod.ALL }
      );
  }
}