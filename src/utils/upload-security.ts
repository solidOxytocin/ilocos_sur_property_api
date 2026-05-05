import type { Express } from "express";
import { fileTypeFromBuffer } from "file-type";

const allowedImageMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export function isAllowedImageMimeType(mimeType: string) {
  return allowedImageMimeTypes.has(mimeType.toLowerCase());
}

export async function assertValidImageSignature(file: Express.Multer.File) {
  if (!isAllowedImageMimeType(file.mimetype)) {
    throw new Error(`Unsupported MIME type: ${file.mimetype}`);
  }

  const detectedType = await fileTypeFromBuffer(file.buffer);

  if (!detectedType || !isAllowedImageMimeType(detectedType.mime)) {
    throw new Error("File content signature does not match allowed image types");
  }

  if (detectedType.mime !== file.mimetype.toLowerCase()) {
    throw new Error(`MIME mismatch. Declared: ${file.mimetype}, detected: ${detectedType.mime}`);
  }
}

export async function validateUploadedImages(files: Express.Multer.File[]) {
  if (!files.length) {
    throw new Error("No files provided");
  }

  for (const file of files) {
    await assertValidImageSignature(file);
  }
}
