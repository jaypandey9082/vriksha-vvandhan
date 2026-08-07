export const ORIGINAL_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "webp",
  "heic",
  "heif",
] as const;

export type OriginalExtension = (typeof ORIGINAL_EXTENSIONS)[number];

export type SignedUploadDescriptor = {
  bucket: "submission-originals";
  path: string;
  token: string;
};

export type SignedReviewDescriptor = {
  bucket: "submission-originals";
  path: string;
  signedUrl: string;
  expiresIn: number;
};

export type SignedReviewThumbnailDescriptor = SignedReviewDescriptor & {
  path: string;
};
