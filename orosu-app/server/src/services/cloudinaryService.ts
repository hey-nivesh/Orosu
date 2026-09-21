import { v2 as cloudinary } from "cloudinary";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

const isConfigured = Boolean(cloudName && apiKey && apiSecret);

if (isConfigured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

/**
 * Uploads a generated PDF buffer to Cloudinary under orosu/resumes/{userId}/{versionId}.pdf
 */
export async function uploadResumePDF(
  pdfBuffer: Buffer,
  userId: string,
  versionId: string
): Promise<{ secure_url: string; public_id: string }> {
  if (!isConfigured) {
    console.info("ℹ️ Cloudinary credentials not configured. Using application streaming URL.");
    return {
      secure_url: `/api/resumes/versions/${versionId}/pdf`,
      public_id: `orosu/resumes/${userId}/${versionId}`,
    };
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        folder: `orosu/resumes/${userId}`,
        public_id: `${versionId}.pdf`,
        format: "pdf",
        overwrite: true,
      },
      (error, result) => {
        if (error || !result) {
          console.error("Cloudinary PDF upload error:", error);
          // Fall back gracefully to local streaming endpoint
          resolve({
            secure_url: `/api/resumes/versions/${versionId}/pdf`,
            public_id: `orosu/resumes/${userId}/${versionId}`,
          });
        } else {
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
          });
        }
      }
    );

    (uploadStream as any).end(pdfBuffer);
  });
}
