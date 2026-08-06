"use client";

import { Camera, ImagePlus, RefreshCw, Trash2 } from "lucide-react";

import { PUBLIC_SUBMISSION_ACCEPT } from "@/config/public-submission";
import type { PreparedImage } from "@/lib/submissions/client-image";

type PhotoSelectorProps = {
  preparedImage: PreparedImage | null;
  previewUrl: string | null;
  isPreparing: boolean;
  preparationProgress: number;
  error?: string;
  onFile: (file: File) => void;
  onRemove: () => void;
};

function formatBytes(bytes: number): string {
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function PhotoSelector({
  preparedImage,
  previewUrl,
  isPreparing,
  preparationProgress,
  error,
  onFile,
  onRemove,
}: PhotoSelectorProps) {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (file) onFile(file);
  };

  return (
    <fieldset className="photo-selector" aria-describedby={error ? "photo-error" : undefined}>
      <legend>Your photograph</legend>
      <p className="photo-selector__hint">
        Share one clear image. It is prepared in your browser and remains private during review.
      </p>

      {previewUrl && preparedImage ? (
        <div className="photo-preview">
          {/* A local object URL is intentionally used instead of persistent Base64 data. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="Preview of your prepared submission" />
          <div className="photo-preview__details">
            <span>Ready for secure upload</span>
            <dl>
              <div><dt>Original</dt><dd>{formatBytes(preparedImage.originalBytes)}</dd></div>
              <div><dt>Prepared</dt><dd>{formatBytes(preparedImage.preparedBytes)}</dd></div>
            </dl>
          </div>
          <div className="photo-preview__actions">
            <input
              className="visually-hidden"
              id="replace-photo"
              type="file"
              accept={PUBLIC_SUBMISSION_ACCEPT}
              onChange={handleChange}
            />
            <label className="button button--secondary" htmlFor="replace-photo">
              <RefreshCw aria-hidden="true" size={18} /> Replace photo
            </label>
            <button className="text-button" type="button" onClick={onRemove}>
              <Trash2 aria-hidden="true" size={18} /> Remove photo
            </button>
          </div>
        </div>
      ) : (
        <div className="photo-selector__choices">
          <input
            className="visually-hidden"
            id="camera-photo"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleChange}
            disabled={isPreparing}
          />
          <label className="photo-choice" htmlFor="camera-photo">
            <Camera aria-hidden="true" size={24} />
            <strong>Take a photo</strong>
            <span>Use your device camera</span>
          </label>

          <input
            className="visually-hidden"
            id="device-photo"
            type="file"
            accept={PUBLIC_SUBMISSION_ACCEPT}
            onChange={handleChange}
            disabled={isPreparing}
          />
          <label className="photo-choice" htmlFor="device-photo">
            <ImagePlus aria-hidden="true" size={24} />
            <strong>Choose from device</strong>
            <span>JPEG, PNG, WebP, HEIC or HEIF</span>
          </label>
        </div>
      )}

      {isPreparing ? (
        <div className="photo-preparing" role="status" aria-live="polite">
          <span>Preparing photograph… {Math.round(preparationProgress)}%</span>
          <progress max="100" value={preparationProgress}>Preparing photograph</progress>
        </div>
      ) : null}
      {error ? <p className="field-error" id="photo-error">{error}</p> : null}
    </fieldset>
  );
}
