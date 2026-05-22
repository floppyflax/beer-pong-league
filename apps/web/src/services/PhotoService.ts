/**
 * PhotoService — web implementation.
 * The mobile app will have its own PhotoService using expo-image-picker.
 */

export interface PhotoResult {
  dataUrl: string;
  blob: Blob;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Opens the native image picker. On mobile, `capture` routes the OS straight to
 * the camera ("user" = front-facing, for a profile selfie).
 *
 * The input must be attached to the document before `.click()` — iOS Safari
 * silently ignores clicks on a detached input, so the camera never opens.
 */
function openImagePicker(capture?: "user" | "environment"): Promise<PhotoResult> {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    if (capture) input.setAttribute("capture", capture);

    input.style.position = "fixed";
    input.style.top = "0";
    input.style.left = "0";
    input.style.width = "1px";
    input.style.height = "1px";
    input.style.opacity = "0";
    document.body.appendChild(input);

    let settled = false;
    const finish = (run: () => void) => {
      if (settled) return;
      settled = true;
      input.remove();
      run();
    };

    input.addEventListener("change", () => {
      const file = input.files?.[0];
      if (!file) {
        finish(() => reject(new Error("No file selected")));
        return;
      }
      fileToDataUrl(file).then(
        (dataUrl) => finish(() => resolve({ dataUrl, blob: file })),
        (err) => finish(() => reject(err)),
      );
    });

    // Fired when the picker is dismissed without a choice (modern browsers).
    input.addEventListener("cancel", () => {
      finish(() => reject(new Error("No file selected")));
    });

    input.click();
  });
}

export const PhotoService = {
  takePhoto: () => openImagePicker("user"),
  pickFromGallery: () => openImagePicker(),
};
