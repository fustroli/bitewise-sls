import { Area } from 'react-easy-crop';

export const loadImage = (file: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = file;
    image.onload = () => resolve(image);
    image.onerror = (error) => reject(error);
  });
};

export const createCanvas = (
  width: number,
  height: number,
): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
};

export const cropImageToCanvas = (
  image: HTMLImageElement,
  croppedAreaPixels: Area,
): HTMLCanvasElement => {
  const canvas = createCanvas(
    croppedAreaPixels.width,
    croppedAreaPixels.height,
  );
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('Failed to get canvas context');

  ctx.drawImage(
    image,
    croppedAreaPixels.x,
    croppedAreaPixels.y,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
    0,
    0,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
  );

  return canvas;
};

export const canvasToFile = (
  canvas: HTMLCanvasElement,
  fileName: string,
  mimeType: string = 'image/jpeg',
): Promise<File> => {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(new File([blob], fileName, { type: mimeType }));
      } else {
        reject(new Error('Failed to convert canvas to Blob'));
      }
    }, mimeType);
  });
};
