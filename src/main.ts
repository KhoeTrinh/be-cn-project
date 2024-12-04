import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { ValidationPipe } from '@nestjs/common';
import * as bodyParser from 'body-parser';
import { HttpService } from '@nestjs/axios';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
  app.enableCors();

  await app.listen(10000);

  // Khởi tạo HttpService
  const httpService = app.get(HttpService);

  const url = `https://be-cn-project.onrender.com`; // Replace with your Render URL

  async function reloadWebsite() {
    try {
      const response = await httpService.get(url).toPromise();
      console.log(`Response at ${new Date().toISOString()}:`, response.data);
    } catch (error) {
      console.error(
        `Error at ${new Date().toISOString()}:`,
        error.message
      );
    }
  }

  function getRandomInterval() {
    return Math.floor(Math.random() * (60000 - 30000 + 1)) + 30000; // 30s - 60s
  }

  // Hàm gọi lặp lại với khoảng thời gian ngẫu nhiên
  function startReloading() {
    setTimeout(async () => {
      await reloadWebsite();
      startReloading(); // Gọi lại chính nó sau khi hoàn thành
    }, getRandomInterval());
  }

  // Bắt đầu lần đầu tiên
  startReloading();
}

bootstrap();
