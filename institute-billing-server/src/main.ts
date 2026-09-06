import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix: /api
  app.setGlobalPrefix('api');

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: false,
    }),
  );

  // CORS
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      process.env.FRONTEND_URL || 'http://localhost:3000',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Swagger Documentation & OpenAPI JSON endpoint (supports orval / codegen)
  const config = new DocumentBuilder()
    .setTitle('Institute Billing & Invoicing System API')
    .setDescription('Multi-tenant SaaS API for Institute Management, Course Billing, and Student Invoicing')
    .setVersion('1.0')
    .addTag('Dashboard')
    .addTag('Courses')
    .addTag('Students')
    .addTag('Enrollments')
    .addTag('Payments')
    .addTag('Invoices')
    .addTag('Discounts')
    .addTag('SMS Notifications')
    .addTag('Reports')
    .addTag('Settings')
    .addTag('Public Student Portal')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Expose /api/json explicitly for client tools (e.g., Orval)
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/api/json', (req: any, res: any) => {
    res.json(document);
  });

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  console.log(`🚀 Institute Billing Server running on: http://localhost:${port}/api`);
  console.log(`📚 Swagger Docs available on: http://localhost:${port}/api/docs`);
  console.log(`📄 OpenAPI Spec available on: http://localhost:${port}/api/json`);
}

await bootstrap();
