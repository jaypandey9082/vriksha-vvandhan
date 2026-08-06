/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";

import { saveReviewFieldsAction } from "@/app/admin/actions";

export function FocalPointEditor({ submissionId, displayName, imageUrl, initialX, initialY }: { submissionId: string; displayName: string; imageUrl: string; initialX: number; initialY: number }) {
  const [point, setPoint] = useState({ x: initialX, y: initialY });
  function move(dx: number, dy: number) { setPoint(({ x, y }) => ({ x: Math.min(1, Math.max(0, x + dx)), y: Math.min(1, Math.max(0, y + dy)) })); }
  return (
    <form className="focal-editor" action={saveReviewFieldsAction}>
      <input type="hidden" name="submissionId" value={submissionId} />
      <input type="hidden" name="focalX" value={point.x} />
      <input type="hidden" name="focalY" value={point.y} />
      <label>Public display name<input name="displayName" defaultValue={displayName} required maxLength={100} /></label>
      <fieldset><legend>Public card focal point</legend>
        <button className="focal-editor__image" type="button" aria-label="Choose image focal point" onClick={(event) => {
          const bounds = event.currentTarget.getBoundingClientRect();
          setPoint({ x: (event.clientX - bounds.left) / bounds.width, y: (event.clientY - bounds.top) / bounds.height });
        }}>
          {/* Short-lived private signed review URL. */}
          <img src={imageUrl} alt="Private submitted photograph" />
          <span style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }} aria-hidden="true" />
        </button>
        <div className="focal-editor__controls" aria-label="Fine tune focal point">
          <button type="button" onClick={() => move(0, -0.05)}>Up</button>
          <button type="button" onClick={() => move(-0.05, 0)}>Left</button>
          <button type="button" onClick={() => setPoint({ x: .5, y: .5 })}><RotateCcw size={15} aria-hidden="true" /> Reset</button>
          <button type="button" onClick={() => move(.05, 0)}>Right</button>
          <button type="button" onClick={() => move(0, .05)}>Down</button>
        </div>
      </fieldset>
      <button className="button button--light" type="submit">Save review fields</button>
    </form>
  );
}
