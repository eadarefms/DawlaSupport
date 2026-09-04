import { Request, Response, NextFunction } from "express";
import { verifyToken, JwtPayload } from "../utils/jwt";

export interface AuthedRequest extends Request {
  auth?: JwtPayload;
}

/** يتحقق من وجود توكن JWT صالح ويحقن بيانات المستخدم في req.auth */
export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "غير مصرح: التوكن مفقود" });
  }
  try {
    const token = header.slice("Bearer ".length);
    req.auth = verifyToken(token);
    next();
  } catch {
    return res.status(401).json({ message: "التوكن غير صالح أو منتهي الصلاحية" });
  }
}

/** يتحقق من أن دور المستخدم ضمن الأدوار المسموح بها (RBAC) */
export function requireRole(...roles: string[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.auth) {
      return res.status(401).json({ message: "غير مصرح" });
    }
    if (!roles.includes(req.auth.role)) {
      return res.status(403).json({ message: "ليست لديك الصلاحية للوصول إلى هذا المورد" });
    }
    next();
  };
}

/**
 * يحصر نطاق البيانات على مديرية المنسق الإقليمي فقط، ويترك رئيس المصلحة
 * والمسؤول بدون قيد (نطاق جهوي كامل). يُستعمل داخل الـ controllers
 * عبر req.scopedProvinceId.
 */
export function scopeToProvince(req: AuthedRequest, _res: Response, next: NextFunction) {
  const auth = req.auth;
  (req as any).scopedProvinceId =
    auth?.role === "PROVINCIAL_COORDINATOR" ? auth.provinceId ?? null : null;
  next();
}
