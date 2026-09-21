import "reflect-metadata";
import "dotenv/config";
import { NestFactory } from "@nestjs/core";
import {
  Module,
  ValidationPipe,
  Catch,
  ExceptionFilter,
  ArgumentsHost,
  HttpException,
} from "@nestjs/common";
import { ThrottlerModule } from "@nestjs/throttler";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { Request, Response, NextFunction } from "express";
import { AuthModule } from "./auth";
import { FinanceModule } from "./controllers";
@Catch()
class ApiErrors implements ExceptionFilter {
  catch(error: any, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    const pg = error.code || error.cause?.code;
    let status = error instanceof HttpException ? error.getStatus() : 500;
    let message: any =
      error instanceof HttpException
        ? error.getResponse()
        : "No se pudo completar la operación.";
    if (typeof message === "object") message = message.message;
    if (pg === "23503") {
      status = 409;
      message =
        "Este recurso tiene movimientos asociados. Elimina o reasigna esos movimientos primero.";
    }
    if (pg === "23505") {
      status = 409;
      message = "Ya existe un registro con estos datos.";
    }
    if (status === 500) console.error(error);
    res
      .status(status)
      .json({
        success: false,
        statusCode: status,
        code:
          status === 409
            ? "CONFLICT"
            : status === 401
              ? "UNAUTHORIZED"
              : status === 404
                ? "NOT_FOUND"
                : status === 400
                  ? "VALIDATION_ERROR"
                  : "REQUEST_ERROR",
        message: Array.isArray(message) ? message.join(" ") : message,
      });
  }
}
@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 20 }]),
    AuthModule,
    FinanceModule,
  ],
})
class AppModule {}
async function main() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api/v1");
  app.use(helmet());
  app.use(cookieParser());
  const origin = process.env.FRONTEND_URL || "http://localhost:3001";
  app.enableCors({ origin, credentials: true });
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (
      !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      req.headers.origin &&
      req.headers.origin !== origin
    )
      return res
        .status(403)
        .json({
          success: false,
          statusCode: 403,
          code: "ORIGIN_REJECTED",
          message: "Origen no permitido.",
        });
    next();
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new ApiErrors());
  app.enableShutdownHooks();
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`API running on port ${port}`);
}
main();
