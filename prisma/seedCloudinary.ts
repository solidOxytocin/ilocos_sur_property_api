import cloudinary from "../config/cloudinary";

const uploadedBySourceUrl = new Map<string, { url: string; cloudinaryPublicId: string }>();

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

export async function destroyCloudinaryPublicId(publicId: string): Promise<void> {
    if (!hasCloudinaryConfig() || !publicId) return;
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch {
        /* ignore */
    }
}
