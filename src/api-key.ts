import { nanoid } from 'nanoid';
import { Request, Response, NextFunction } from 'express';
import { prisma } from './prisma';

export function generateApiKey() {
  return `api-${nanoid(32)}`;
}

// Middleware: requires a valid API key on ?apikey= or the x-api-key header.
// Attaches the owning user (minus password) to req.apiUser.
export async function requireApiKey(req: Request, res: Response, next: NextFunction) {
  const key = (req.query.apikey as string) || (req.headers['x-api-key'] as string);

  if (!key) {
    return res.status(401).json({
      status: false,
      message: "مفتاح API مطلوب. أضفه كـ ?apikey=مفتاحك أو أنشئ حساب من /register للحصول على واحد.",
    });
  }

  const user = await prisma.user.findUnique({ where: { apiKey: key } });
  if (!user) {
    return res.status(401).json({ status: false, message: 'مفتاح API غير صالح.' });
  }

  (req as any).apiUser = { id: user.id, name: user.name, role: user.role };
  next();
}
