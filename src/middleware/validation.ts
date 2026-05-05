import type { Request, Response, NextFunction } from "express";
import { z, type AnyZodObject, type ZodTypeAny } from "zod";

type ValidationSchemas = {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
};

function toShape(value: unknown) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") return value;
  return {};
}

function replaceObjectContents(target: Record<string, unknown>, source: Record<string, unknown>) {
  for (const key of Object.keys(target)) {
    delete target[key];
  }
  Object.assign(target, source);
}

export function validateRequest(schemas: ValidationSchemas) {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];

    if (schemas.params) {
      const parsed = schemas.params.safeParse(toShape(req.params));
      if (!parsed.success) {
        errors.push(...parsed.error.issues.map((issue) => `params.${issue.path.join(".")}: ${issue.message}`));
      } else {
        replaceObjectContents(req.params as Record<string, unknown>, parsed.data as Record<string, unknown>);
      }
    }

    if (schemas.query) {
      const parsed = schemas.query.safeParse(toShape(req.query));
      if (!parsed.success) {
        errors.push(...parsed.error.issues.map((issue) => `query.${issue.path.join(".")}: ${issue.message}`));
      } else {
        replaceObjectContents(req.query as Record<string, unknown>, parsed.data as Record<string, unknown>);
      }
    }

    if (schemas.body) {
      const parsed = schemas.body.safeParse(toShape(req.body));
      if (!parsed.success) {
        errors.push(...parsed.error.issues.map((issue) => `body.${issue.path.join(".")}: ${issue.message}`));
      } else {
        req.body = parsed.data;
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: "Validation failed",
        details: errors,
      });
    }

    return next();
  };
}

export const numericIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
