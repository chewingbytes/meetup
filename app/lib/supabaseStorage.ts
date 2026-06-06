import { createClient } from "@supabase/supabase-js";

// const STORAGE_SUPABASE_URL = process.env.EXPO_PUBLIC_STORAGE_SUPABASE_URL;
// const STORAGE_SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_STORAGE_SUPABASE_ANON_KEY;
// const STORAGE_BUCKET = process.env.EXPO_PUBLIC_STORAGE_BUCKET || "avatars";

const STORAGE_SUPABASE_URL = "https://nlsggkzpooovjifqcbig.supabase.co"
const STORAGE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sc2dna3pwb29vdmppZnFjYmlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA1MDU4NjMsImV4cCI6MjA1NjA4MTg2M30.BEjDniiAZAu1u3lBPiHf750OqdJiEWZu1M05j4_44xo"
const STORAGE_BUCKET = "image_storage";

const normalizeUrl = (value?: string | null) => {
  if (!value) return "";
  return value.trim().replace(/\.+$/, "");
};

const normalizedStorageUrl = normalizeUrl(STORAGE_SUPABASE_URL);
const normalizedStorageAnonKey = STORAGE_SUPABASE_ANON_KEY?.trim();
const normalizedStorageBucket = (STORAGE_BUCKET || "avatars").trim();

const hasStorageConfig =
  !!normalizedStorageUrl &&
  !!normalizedStorageAnonKey &&
  normalizedStorageUrl !== "" &&
  normalizedStorageAnonKey !== "";

const storageClient = hasStorageConfig
  ? createClient(normalizedStorageUrl, normalizedStorageAnonKey!, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

function assertStorageClient() {
  if (!storageClient) {
    throw new Error(
      "Storage Supabase is not configured. Set EXPO_PUBLIC_STORAGE_SUPABASE_URL and EXPO_PUBLIC_STORAGE_SUPABASE_ANON_KEY.",
    );
  }
  return storageClient;
}

function getExtensionFromUri(uri: string) {
  const withoutQuery = uri.split("?")[0];
  const ext = withoutQuery.split(".").pop()?.toLowerCase();
  if (!ext) return "jpg";
  return ext;
}

function getMimeType(extension: string) {
  switch (extension) {
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "heic":
      return "image/heic";
    case "heif":
      return "image/heif";
    case "jpg":
    case "jpeg":
    default:
      return "image/jpeg";
  }
}

export function getAvatarPublicUrl(path: string) {
  const client = assertStorageClient();
  const { data } = client.storage
    .from(normalizedStorageBucket)
    .getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Uploads a verification image (selfie, id-front, id-back) to the
 * `verification/{userId}/{imageType}.{ext}` path in the storage bucket.
 */
export async function uploadVerificationImage(
  userId: string,
  imageType: "selfie" | "id-front" | "id-back",
  localImageUri: string,
) {
  const client = assertStorageClient();
  const extension = getExtensionFromUri(localImageUri);
  const mimeType = getMimeType(extension);
  const filePath = `verification/${userId}/${imageType}.${extension}`;

  const response = await fetch(localImageUri);
  if (!response.ok) {
    throw new Error("Failed to read selected image file.");
  }
  const arrayBuffer = await response.arrayBuffer();

  const { error: uploadError } = await client.storage
    .from(normalizedStorageBucket)
    .upload(filePath, arrayBuffer, {
      contentType: mimeType,
      upsert: true,
      cacheControl: "3600",
    });

  if (uploadError) {
    throw new Error(uploadError.message || "Verification image upload failed.");
  }

  const { data: publicUrlData } = client.storage
    .from(normalizedStorageBucket)
    .getPublicUrl(filePath);

  return {
    filePath,
    publicUrl: publicUrlData.publicUrl,
  };
}

/**
 * Uploads selfie, id-front and id-back in parallel.
 * Returns an object with the public URL for each image type.
 */
export async function uploadVerificationImages({
  userId,
  selfieUri,
  idFrontUri,
  idBackUri,
}: {
  userId: string;
  selfieUri?: string | null;
  idFrontUri: string;
  idBackUri: string;
}) {
  const client = assertStorageClient();

  const uploadOne = async (
    imageType: "selfie" | "id-front" | "id-back",
    localUri: string,
  ) => {
    const extension = getExtensionFromUri(localUri);
    const mimeType = getMimeType(extension);
    const filePath = `verification/${userId}/${imageType}.${extension}`;

    const response = await fetch(localUri);
    if (!response.ok) throw new Error(`Failed to read image: ${imageType}`);
    const arrayBuffer = await response.arrayBuffer();

    const { error } = await client.storage
      .from(normalizedStorageBucket)
      .upload(filePath, arrayBuffer, {
        contentType: mimeType,
        upsert: true,
        cacheControl: "3600",
      });

    if (error) throw new Error(error.message || `Failed to upload ${imageType}`);

    const { data } = client.storage
      .from(normalizedStorageBucket)
      .getPublicUrl(filePath);

    return { filePath, publicUrl: data.publicUrl };
  };

  const tasks: Promise<{ filePath: string; publicUrl: string }>[] = [
    uploadOne("id-front", idFrontUri),
    uploadOne("id-back", idBackUri),
  ];
  if (selfieUri) tasks.push(uploadOne("selfie", selfieUri));

  const [idFront, idBack, selfie] = await Promise.all(tasks);
  return { idFront, idBack, selfie: selfie ?? null };
}

export async function uploadAvatarImage(userId: string, localImageUri: string) {
  const client = assertStorageClient();
  const extension = getExtensionFromUri(localImageUri);
  const mimeType = getMimeType(extension);
  const filePath = `${userId}/${Date.now()}.${extension}`;

  const response = await fetch(localImageUri);
  if (!response.ok) {
    throw new Error("Failed to read selected image file.");
  }
  const arrayBuffer = await response.arrayBuffer();

  const { error: uploadError } = await client.storage
    .from(normalizedStorageBucket)
    .upload(filePath, arrayBuffer, {
      contentType: mimeType,
      upsert: true,
      cacheControl: "3600",
    });

  if (uploadError) {
    throw new Error(uploadError.message || "Image upload failed.");
  }

  const { data: publicUrlData } = client.storage
    .from(normalizedStorageBucket)
    .getPublicUrl(filePath);

  return {
    filePath,
    publicUrl: publicUrlData.publicUrl,
  };
}
