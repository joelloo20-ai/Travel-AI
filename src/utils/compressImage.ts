/** Downscales an image file client-side before it's ever sent anywhere, keeping receipt
 * photos cheap to transmit (vision tokens) and safe to store as a localStorage thumbnail. */
export function compressImage(file: File, maxWidth = 1000, quality = 0.75): Promise<{ dataUrl: string; mediaType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("Could not read file"));
    reader.onload = () => {
      img.onerror = () => reject(new Error("Could not decode image"));
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas not supported"));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve({ dataUrl: canvas.toDataURL("image/jpeg", quality), mediaType: "image/jpeg" });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function makeThumbnail(file: File): Promise<string> {
  return compressImage(file, 320, 0.6).then((r) => r.dataUrl);
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

/** Images are downscaled like a receipt photo; PDFs are read as-is since Claude reads them natively. */
export function readUploadedDocument(file: File): Promise<{ dataUrl: string; mediaType: string }> {
  if (file.type === "application/pdf") {
    return readFileAsDataUrl(file).then((dataUrl) => ({ dataUrl, mediaType: "application/pdf" }));
  }
  return compressImage(file);
}
