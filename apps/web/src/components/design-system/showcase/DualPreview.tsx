/**
 * DualPreview — side-by-side comparison between the live web component
 * (rendered at 375px) and a screenshot of the React Native mobile screen.
 *
 * Drop RN screenshots in `apps/web/public/design-system/mobile-screens/`.
 * Missing screenshots render a neutral placeholder so the showcase never
 * crashes.
 */

import type { ReactNode } from "react";
import { PhoneFrame } from "./PhoneFrame";

export interface DualPreviewProps {
  webPreview: ReactNode;
  /** Public URL of the RN screenshot (`/design-system/mobile-screens/foo.png`). */
  mobileScreenshotSrc?: string;
  /** Optional captions under each frame. */
  webCaption?: string;
  mobileCaption?: string;
}

const MissingScreenshot = ({ src }: { src?: string }) => (
  <div className="w-full h-full flex flex-col items-center justify-center text-center px-6 gap-2 bg-navy-soft">
    <span className="text-3xl" aria-hidden>
      📱
    </span>
    <p className="text-xs font-mono uppercase tracking-widest text-cool-gray">
      Screenshot RN manquant
    </p>
    <p className="text-[10px] text-cool-gray/60 break-all px-2">
      {src ?? "(aucun chemin)"}
    </p>
    <p className="text-[10px] text-cool-gray/60 mt-2">
      Dépose le PNG dans
      <br />
      <code className="text-[9px]">public/design-system/mobile-screens/</code>
    </p>
  </div>
);

export function DualPreview({
  webPreview,
  mobileScreenshotSrc,
  webCaption = "Web @ 375px",
  mobileCaption = "Mobile RN",
}: DualPreviewProps) {
  return (
    <div className="flex flex-wrap items-start gap-6 justify-center">
      <PhoneFrame caption={webCaption}>
        <div className="w-full h-full overflow-y-auto">{webPreview}</div>
      </PhoneFrame>
      <PhoneFrame caption={mobileCaption}>
        {mobileScreenshotSrc ? (
          <img
            src={mobileScreenshotSrc}
            alt="Capture mobile RN"
            className="w-full h-full object-cover object-top"
            onError={(e) => {
              // Replace src with placeholder div if image fails — quick and dirty.
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <MissingScreenshot src={mobileScreenshotSrc} />
        )}
      </PhoneFrame>
    </div>
  );
}
