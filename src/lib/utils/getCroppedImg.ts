type Area = { x: number; y: number; width: number; height: number };

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (e) => reject(e));
    image.src = url;
  });
}

/**
 * Returns a Blob of the cropped image (JPEG, 0.9 quality).
 * Use with react-easy-crop's onCropComplete croppedAreaPixels.
 */
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  maxSize = 400
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2d context");

  const { width, height } = pixelCrop;
  const scale = maxSize / Math.max(width, height);
  const outputW = scale >= 1 ? width : Math.round(width * scale);
  const outputH = scale >= 1 ? height : Math.round(height * scale);

  canvas.width = outputW;
  canvas.height = outputH;
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputW,
    outputH
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Canvas toBlob failed"))),
      "image/jpeg",
      0.9
    );
  });
}
