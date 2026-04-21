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

async function captureFromWebcam(): Promise<PhotoResult> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) { reject(new Error('No file selected')); return; }
      const dataUrl = await fileToDataUrl(file);
      resolve({ dataUrl, blob: file });
    };
    input.click();
  });
}

async function pickFromGallery(): Promise<PhotoResult> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) { reject(new Error('No file selected')); return; }
      const dataUrl = await fileToDataUrl(file);
      resolve({ dataUrl, blob: file });
    };
    input.click();
  });
}

export const PhotoService = {
  takePhoto: captureFromWebcam,
  pickFromGallery,
};
