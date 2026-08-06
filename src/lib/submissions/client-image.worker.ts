/// <reference lib="webworker" />

import imageCompression from "browser-image-compression";

import { PUBLIC_SUBMISSION } from "@/config/public-submission";

type WorkerRequest = {
  file: File;
  outputMime: "image/webp" | "image/jpeg";
};

type WorkerResponse =
  | { type: "progress"; progress: number }
  | { type: "success"; file: File }
  | { type: "error"; message: string };

const workerScope = self as unknown as DedicatedWorkerGlobalScope;

workerScope.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  try {
    const compressed = await imageCompression(event.data.file, {
      maxSizeMB: PUBLIC_SUBMISSION.preparedTargetBytes / 1024 / 1024,
      maxWidthOrHeight: PUBLIC_SUBMISSION.maximumDimension,
      useWebWorker: false,
      preserveExif: false,
      fileType: event.data.outputMime,
      initialQuality: 0.88,
      onProgress: (progress) => {
        workerScope.postMessage({ type: "progress", progress } satisfies WorkerResponse);
      },
    });

    workerScope.postMessage({ type: "success", file: compressed } satisfies WorkerResponse);
  } catch (error) {
    workerScope.postMessage({
      type: "error",
      message: error instanceof Error ? error.message : "Image preparation failed.",
    } satisfies WorkerResponse);
  }
};

export {};

