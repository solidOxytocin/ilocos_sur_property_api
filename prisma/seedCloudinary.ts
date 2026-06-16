import cloudinary from "../config/cloudinary";
import fs from "node:fs";
import path from "node:path";

const uploadedBySourceUrl = new Map<string, { url: string; cloudinaryPublicId: string }>();
const uploadedByLocalPath = new Map<string, { url: string; cloudinaryPublicId: string }>();

export function hasCloudinaryConfig(): boolean {
    return !!(
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
    );
}

/**
 * Fetches each unique source URL into Cloudinary (Cloudinary pulls the remote image).
 * Reuses the same Cloudinary asset when multiple mock rows share the same URL.
 */
export async function seedImageToCloudinary(sourceUrl: string): Promise<{
    url: string;
    cloudinaryPublicId: string | null;
}> {
    if (!hasCloudinaryConfig()) {
        return { url: sourceUrl, cloudinaryPublicId: null };
    }

    const cached = uploadedBySourceUrl.get(sourceUrl);
    if (cached) {
        return { url: cached.url, cloudinaryPublicId: cached.cloudinaryPublicId };
    }

    const result = await cloudinary.uploader.upload(sourceUrl, {
        folder: "properties/seed",
        resource_type: "image",
        overwrite: false,
        unique_filename: true,
        invalidate: true,
    });

    const out = { url: result.secure_url, cloudinaryPublicId: result.public_id };
    uploadedBySourceUrl.set(sourceUrl, out);
    return out;
}

/**
 * Uploads a local image file to Cloudinary. Reuses the same asset per absolute file path.
 */
export async function uploadLocalFileToCloudinary(
    filePath: string,
    options: { folder: string; publicId?: string } = { folder: "properties/camella" },
): Promise<{
    url: string;
    cloudinaryPublicId: string | null;
}> {
    const absolutePath = path.resolve(filePath);
    if (!fs.existsSync(absolutePath)) {
        throw new Error(`Image file not found: ${absolutePath}`);
    }

    if (!hasCloudinaryConfig()) {
        return { url: absolutePath, cloudinaryPublicId: null };
    }

    const cached = uploadedByLocalPath.get(absolutePath);
    if (cached) {
        return { url: cached.url, cloudinaryPublicId: cached.cloudinaryPublicId };
    }

    const uploadOptions: Record<string, unknown> = {
        folder: options.folder,
        resource_type: "image",
        overwrite: true,
        invalidate: true,
    };
    if (options.publicId) {
        uploadOptions.public_id = options.publicId;
    }

    const result = await cloudinary.uploader.upload(absolutePath, uploadOptions);
    const out = { url: result.secure_url, cloudinaryPublicId: result.public_id };
    uploadedByLocalPath.set(absolutePath, out);
    return out;
}

export async function destroyCloudinaryPublicId(publicId: string): Promise<void> {
    if (!hasCloudinaryConfig() || !publicId) return;
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch {
        /* ignore */
    }
}
