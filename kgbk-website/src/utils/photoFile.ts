const DIRECT = /^image\/(jpeg|png|webp)$/i;

export const isHeic = (file: File) => /^image\/hei[cf]$/i.test(file.type) || /\.hei[cf]$/i.test(file.name);

/** Photos the importer can use: JPEG/PNG/WebP directly, iPhone HEIC after conversion. */
export const isSupportedPhoto = (file: File) => DIRECT.test(file.type) || isHeic(file);

/** Converts iPhone HEIC photos to JPEG in the browser (the converter is only downloaded when needed). */
export async function toBrowserImage(file: File): Promise<File> {
  if (!isHeic(file)) return file;
  const { default: heic2any } = await import("heic2any");
  const out = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.92 });
  const blob = Array.isArray(out) ? out[0] : out;
  return new File([blob], file.name.replace(/\.hei[cf]$/i, ".jpg"), { type: "image/jpeg", lastModified: file.lastModified });
}

/**
 * Reads the camera capture time from a JPEG's EXIF data ("YYYY-MM-DDTHH:MM:SS"), or "" if absent.
 * Unlike the file name or modified date, this survives renaming and copying between devices.
 */
export async function readTakenAt(file: File): Promise<string> {
  if (!/jpe?g$/i.test(file.type) && !/\.jpe?g$/i.test(file.name)) return "";
  try {
    const view = new DataView(await file.slice(0, 256 * 1024).arrayBuffer());
    if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return "";
    let offset = 2;
    while (offset + 10 <= view.byteLength) {
      const marker = view.getUint16(offset);
      if ((marker & 0xff00) !== 0xff00 || marker === 0xffda) return "";
      if (marker === 0xffe1 && view.getUint32(offset + 4) === 0x45786966 /* "Exif" */) return parseExif(view, offset + 10);
      offset += 2 + view.getUint16(offset + 2);
    }
  } catch {
    // Malformed metadata: fall back to file-name order.
  }
  return "";
}

function parseExif(view: DataView, tiff: number): string {
  const little = view.getUint16(tiff) === 0x4949;
  const u16 = (o: number) => view.getUint16(o, little);
  const u32 = (o: number) => view.getUint32(o, little);

  const findTag = (ifd: number, tag: number): number | null => {
    const count = u16(ifd);
    for (let i = 0; i < count; i++) {
      const entry = ifd + 2 + i * 12;
      if (u16(entry) === tag) return entry;
    }
    return null;
  };
  const readDate = (entry: number | null) => {
    if (entry === null) return "";
    const start = tiff + u32(entry + 8);
    let text = "";
    for (let i = 0; i < 19; i++) text += String.fromCharCode(view.getUint8(start + i));
    const m = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(text);
    return m && m[1] !== "0000" ? `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}` : "";
  };

  const ifd0 = tiff + u32(tiff + 4);
  const exifPointer = findTag(ifd0, 0x8769);
  const original = exifPointer !== null ? readDate(findTag(tiff + u32(exifPointer + 8), 0x9003)) : "";
  return original || readDate(findTag(ifd0, 0x0132));
}
