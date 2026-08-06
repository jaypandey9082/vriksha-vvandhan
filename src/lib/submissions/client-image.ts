import { PUBLIC_SUBMISSION, type PreparedImageExtension } from "@/config/public-submission";

export type PreparedImage = {
  file: File;
  extension: PreparedImageExtension;
  mimeType: "image/webp" | "image/jpeg";
  originalBytes: number;
  preparedBytes: number;
};

export class ClientImageError extends Error {
  constructor(
    public readonly code:
      | "input_too_large"
      | "unsupported_image"
      | "heic_unsupported"
      | "compression_failed"
      | "prepared_too_large",
    message: string,
  ) {
    super(message);
    this.name = "ClientImageError";
  }
}

function extensionOf(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

export function validateImageInput(file: File): void {
  if (file.size <= 0) {
    throw new ClientImageError("unsupported_image", "Choose a non-empty photograph.");
  }
  if (file.size > PUBLIC_SUBMISSION.inputMaxBytes) {
    throw new ClientImageError(
      "input_too_large",
      "That photograph is larger than 15 MB. Choose a smaller image.",
    );
  }

  const extension = extensionOf(file.name);
  const validMime = PUBLIC_SUBMISSION.acceptedInputMimeTypes.includes(
    file.type.toLowerCase() as (typeof PUBLIC_SUBMISSION.acceptedInputMimeTypes)[number],
  );
  const validExtension = PUBLIC_SUBMISSION.acceptedInputExtensions.includes(
    extension as (typeof PUBLIC_SUBMISSION.acceptedInputExtensions)[number],
  );

  if ((!file.type && !validExtension) || (file.type && !validMime)) {
    throw new ClientImageError(
      "unsupported_image",
      "Choose a JPEG, PNG, WebP, HEIC or HEIF photograph.",
    );
  }
}

function isHeic(file: File): boolean {
  return ["heic", "heif"].includes(extensionOf(file.name)) ||
    ["image/heic", "image/heif"].includes(file.type.toLowerCase());
}

async function supportsWebpOutput(): Promise<boolean> {
  if (typeof document === "undefined") return false;
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL("image/webp").startsWith("data:image/webp");
}

async function compressOnMainThread(
  file: File,
  outputMime: "image/webp" | "image/jpeg",
  signal: AbortSignal,
  onProgress?: (progress: number) => void,
): Promise<File> {
  const { default: imageCompression } = await import("browser-image-compression");
  return imageCompression(file, {
    maxSizeMB: PUBLIC_SUBMISSION.preparedTargetBytes / 1024 / 1024,
    maxWidthOrHeight: PUBLIC_SUBMISSION.maximumDimension,
    useWebWorker: false,
    preserveExif: false,
    fileType: outputMime,
    initialQuality: 0.88,
    signal,
    onProgress,
  });
}

function compressInProjectWorker(
  file: File,
  outputMime: "image/webp" | "image/jpeg",
  signal: AbortSignal,
  onProgress?: (progress: number) => void,
): Promise<File> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./client-image.worker.ts", import.meta.url), {
      type: "module",
      name: "vriksha-image-preparation",
    });

    const stop = () => worker.terminate();
    signal.addEventListener("abort", () => {
      stop();
      reject(signal.reason ?? new DOMException("Image preparation cancelled.", "AbortError"));
    }, { once: true });

    worker.onerror = () => {
      stop();
      reject(new Error("The image worker could not start."));
    };
    worker.onmessage = (event: MessageEvent<
      | { type: "progress"; progress: number }
      | { type: "success"; file: File }
      | { type: "error"; message: string }
    >) => {
      if (event.data.type === "progress") {
        onProgress?.(event.data.progress);
        return;
      }
      stop();
      if (event.data.type === "success") resolve(event.data.file);
      else reject(new Error(event.data.message));
    };

    worker.postMessage({ file, outputMime });
  });
}

export async function prepareImage(
  file: File,
  options: { signal: AbortSignal; onProgress?: (progress: number) => void },
): Promise<PreparedImage> {
  validateImageInput(file);
  const outputMime = (await supportsWebpOutput()) ? "image/webp" : "image/jpeg";

  try {
    const prepared =
      typeof Worker === "function"
        ? await compressInProjectWorker(file, outputMime, options.signal, options.onProgress)
        : await compressOnMainThread(file, outputMime, options.signal, options.onProgress);

    if (prepared.size > PUBLIC_SUBMISSION.preparedMaxBytes) {
      throw new ClientImageError(
        "prepared_too_large",
        "That photograph could not be reduced below 2 MB. Please choose a simpler or smaller image.",
      );
    }

    const extension: PreparedImageExtension = outputMime === "image/webp" ? "webp" : "jpg";
    const safeFile = new File([prepared], `submission.${extension}`, {
      type: outputMime,
      lastModified: Date.now(),
    });

    return {
      file: safeFile,
      extension,
      mimeType: outputMime,
      originalBytes: file.size,
      preparedBytes: safeFile.size,
    };
  } catch (error) {
    if (error instanceof ClientImageError || options.signal.aborted) throw error;
    if (isHeic(file)) {
      throw new ClientImageError(
        "heic_unsupported",
        "This browser could not prepare that HEIC photo. Please take a new photo or choose a JPEG, PNG or WebP image.",
      );
    }
    throw new ClientImageError(
      "compression_failed",
      "We could not prepare that photograph. Please replace it or try again.",
    );
  }
}

export function revokePreviewUrl(url: string | null): void {
  if (url) URL.revokeObjectURL(url);
}

