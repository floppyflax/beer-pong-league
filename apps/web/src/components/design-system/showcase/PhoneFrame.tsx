/**
 * PhoneFrame — cosmetic iPhone-style outer frame.
 *
 * Wraps showcase previews so atoms/molecules and page archetypes look
 * grounded at the natural mobile viewport (375 × 812). Notch is purely
 * decorative.
 */

import type { ReactNode } from "react";

export type PhoneFrameDevice = "ios" | "ios-mini" | "android";

export interface PhoneFrameProps {
  children: ReactNode;
  /** Device dimensions preset. Default `ios` = 375×812. */
  device?: PhoneFrameDevice;
  /** Optional caption shown under the frame. */
  caption?: string;
}

const DIMENSIONS: Record<PhoneFrameDevice, { w: number; h: number }> = {
  ios: { w: 375, h: 812 },
  "ios-mini": { w: 320, h: 568 },
  android: { w: 393, h: 851 },
};

export function PhoneFrame({
  children,
  device = "ios",
  caption,
}: PhoneFrameProps) {
  const { w, h } = DIMENSIONS[device];
  return (
    <div className="inline-flex flex-col items-center gap-2">
      <div
        className="relative bg-navy rounded-[44px] border-[8px] border-cool-gray/30 shadow-2xl overflow-hidden"
        style={{ width: w + 16, height: h + 16 }}
      >
        {/* Notch */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-cool-gray/30 rounded-b-2xl z-10"
          aria-hidden
        />
        {/* Inner viewport */}
        <div
          className="bg-navy overflow-hidden"
          style={{ width: w, height: h }}
        >
          {children}
        </div>
      </div>
      {caption && (
        <span className="text-[10px] font-mono uppercase tracking-widest text-cool-gray">
          {caption}
        </span>
      )}
    </div>
  );
}
