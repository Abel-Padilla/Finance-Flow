import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ConflictException,
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  Module,
  Inject,
} from "@nestjs/common";
import { JwtService, JwtModule } from "@nestjs/jwt";
import { ThrottlerGuard } from "@nestjs/throttler";
import { Request, Response } from "express";
import { hash, verify } from "argon2";
import { randomBytes, createHash } from "node:crypto";
import { eq, and, gt } from "drizzle-orm";
import { db } from "./db";
import { users, refreshTokens } from "./schema";
import { seedCategories } from "./seed";
import { RegisterDto, LoginDto } from "./dto";
export type AuthRequest = Request & { userId: string };
export const publicUser = (u: any) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  currency: u.currency,
  onboarded: u.onboarded,
  monthlyIncome: u.monthlyIncome,
});
const digest = (s: string) => createHash("sha256").update(s).digest("hex");
@Injectable()
export class AuthService {
  constructor(@Inject(JwtService) private jwt: JwtService) {}
  async issue(userId: string, tx: any = db) {
    const refresh = randomBytes(48).toString("base64url");
    await tx
      .insert(refreshTokens)
      .values({
        userId,
        hash: digest(refresh),
        expiresAt: new Date(Date.now() + 30 * 86400000),
      });
    return {
      accessToken: await this.jwt.signAsync(
        { sub: userId },
        { expiresIn: "15m" },
      ),
      refresh,
    };
  }
  async register(d: RegisterDto) {
    const passwordHash = await hash(d.password);
    try {
      return await db.transaction(async (tx) => {
        const [u] = await tx
          .insert(users)
          .values({
            name: d.name.trim(),
            email: d.email.toLowerCase().trim(),
            passwordHash,
            currency: d.currency,
          })
          .returning();
        await seedCategories(u.id, tx);
        return { user: publicUser(u), ...(await this.issue(u.id, tx)) };
      });
    } catch (e: any) {
      if (e.code === "23505" || e.cause?.code === "23505")
        throw new ConflictException("El correo ya está registrado.");
      throw e;
    }
  }
  async login(d: LoginDto) {
    const [u] = await db
      .select()
      .from(users)
      .where(eq(users.email, d.email.trim().toLowerCase()));
    if (!u || !(await verify(u.passwordHash, d.password)))
      throw new UnauthorizedException("Credenciales inválidas.");
    return { user: publicUser(u), ...(await this.issue(u.id)) };
  }
  async refresh(token: string) {
    if (!token) throw new UnauthorizedException("Sesión expirada.");
    return db.transaction(async (tx) => {
      const [old] = await tx
        .delete(refreshTokens)
        .where(
          and(
            eq(refreshTokens.hash, digest(token)),
            gt(refreshTokens.expiresAt, new Date()),
          ),
        )
        .returning();
      if (!old) throw new UnauthorizedException("Sesión expirada.");
      return this.issue(old.userId, tx);
    });
  }
  async logout(token: string) {
    if (token)
      await db
        .delete(refreshTokens)
        .where(eq(refreshTokens.hash, digest(token)));
    return { success: true };
  }
  async me(id: string) {
    const [u] = await db.select().from(users).where(eq(users.id, id));
    if (!u) throw new UnauthorizedException();
    return publicUser(u);
  }
}
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(@Inject(JwtService) private jwt: JwtService) {}
  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest<AuthRequest>();
    try {
      const token = req.headers.authorization?.replace(/^Bearer /, "");
      if (!token) throw new Error();
      const data = await this.jwt.verifyAsync(token);
      req.userId = data.sub;
      return true;
    } catch {
      throw new UnauthorizedException("Inicia sesión para continuar.");
    }
  }
}
@Controller("auth")
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(@Inject(AuthService) private service: AuthService) {}
  private send(res: Response, result: any) {
    res.cookie("ff_refresh", result.refresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/api/v1/auth",
      maxAge: 30 * 86400000,
    });
    const { refresh: _refresh, ...body } = result;
    return body;
  }
  @Post("register") async register(
    @Body() d: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.send(res, await this.service.register(d));
  }
  @Post("login") async login(
    @Body() d: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.send(res, await this.service.login(d));
  }
  @Post("refresh") async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.send(res, await this.service.refresh(req.cookies?.ff_refresh));
  }
  @Post("logout") async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.service.logout(req.cookies?.ff_refresh);
    res.clearCookie("ff_refresh", {
      path: "/api/v1/auth",
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });
    return result;
  }
  @Get("me") @UseGuards(AuthGuard) me(@Req() r: AuthRequest) {
    return this.service.me(r.userId);
  }
}
@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => {
        const secret = process.env.JWT_ACCESS_SECRET;
        if (!secret || secret.length < 32)
          throw new Error(
            "JWT_ACCESS_SECRET must contain at least 32 characters",
          );
        return { secret };
      },
    }),
  ],
  providers: [AuthService, AuthGuard],
  controllers: [AuthController],
  exports: [AuthService, AuthGuard, JwtModule],
})
export class AuthModule {}
