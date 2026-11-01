import JSZip from 'jszip';
import { CustomBgConfig } from '../types';

/**
 * Đọc file ảnh người dùng tải lên và chuyển thành Base64 Data URL
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Lấy kích thước ảnh (width, height)
 */
export function getImageDimensions(
  urlOrDataUrl: string
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = (err) => reject(err);
    img.src = urlOrDataUrl;
  });
}

/**
 * Tải file về máy tính
 */
export function downloadFile(url: string, filename: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Tải ảnh dạng JPG với nền trắng
 */
export async function downloadAsJpg(imageUrl: string, filename: string, bgColor: string = '#ffffff'): Promise<void> {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = imageUrl;
  });
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    const jpgUrl = canvas.toDataURL('image/jpeg', 0.95);
    downloadFile(jpgUrl, filename);
  }
}

/**
 * Tải ảnh dạng PNG giữ nguyên kênh trong suốt
 */
export function downloadAsPng(imageUrl: string, filename: string): void {
  downloadFile(imageUrl, filename);
}

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Cắt ảnh theo tọa độ pixel gốc trên HTML5 Canvas (giữ nguyên 100% độ nét và kênh Alpha trong suốt)
 */
export async function cropImageToDataUrl(
  imageUrl: string,
  crop: CropRect
): Promise<string> {
  const img = await loadImage(imageUrl);
  const sx = Math.max(0, Math.round(crop.x));
  const sy = Math.max(0, Math.round(crop.y));
  const sw = Math.max(1, Math.min(img.naturalWidth - sx, Math.round(crop.width)));
  const sh = Math.max(1, Math.min(img.naturalHeight - sy, Math.round(crop.height)));

  const canvas = document.createElement('canvas');
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Không thể khởi tạo Canvas 2D để cắt ảnh.');
  }

  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
  return canvas.toDataURL('image/png');
}

/**
 * Tự động tìm khung bao sát chủ thể không trong suốt (tương tự Photoshop Image -> Trim)
 */
export async function getNonTransparentBounds(
  imageUrl: string,
  paddingRatio = 0.02
): Promise<CropRect | null> {
  const img = await loadImage(imageUrl);
  const natW = img.naturalWidth;
  const natH = img.naturalHeight;
  if (!natW || !natH) return null;

  // Thu nhỏ tạm thời nếu ảnh rất lớn để quét pixel cực nhanh (< 5ms)
  const maxScanDim = 1024;
  const scale = Math.min(1, maxScanDim / Math.max(natW, natH));
  const scanW = Math.max(1, Math.round(natW * scale));
  const scanH = Math.max(1, Math.round(natH * scale));

  const canvas = document.createElement('canvas');
  canvas.width = scanW;
  canvas.height = scanH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.drawImage(img, 0, 0, scanW, scanH);
  const { data } = ctx.getImageData(0, 0, scanW, scanH);

  let minX = scanW;
  let minY = scanH;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < scanH; y++) {
    for (let x = 0; x < scanW; x++) {
      const alpha = data[(y * scanW + x) * 4 + 3];
      if (alpha > 12) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < minX || maxY < minY) {
    return null;
  }

  const rawX = minX / scale;
  const rawY = minY / scale;
  const rawW = (maxX - minX + 1) / scale;
  const rawH = (maxY - minY + 1) / scale;

  const padX = Math.round(natW * paddingRatio);
  const padY = Math.round(natH * paddingRatio);

  const x = Math.max(0, Math.floor(rawX - padX));
  const y = Math.max(0, Math.floor(rawY - padY));
  const right = Math.min(natW, Math.ceil(rawX + rawW + padX));
  const bottom = Math.min(natH, Math.ceil(rawY + rawH + padY));

  return {
    x,
    y,
    width: Math.max(1, right - x),
    height: Math.max(1, bottom - y),
  };
}

/**
 * Sao chép ảnh vào Clipboard (PNG)
 */
export async function copyImageToClipboard(imageUrl: string): Promise<void> {
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  await navigator.clipboard.write([
    new ClipboardItem({
      [blob.type]: blob,
    }),
  ]);
}

/**
 * Xuất ảnh với nền tùy chỉnh (trong suốt, màu, gradient, ảnh nền mới, hoặc blur nền gốc)
 * Giữ nguyên độ phân giải gốc của ảnh ban đầu!
 */
export async function renderImageWithBackground(
  foregroundUrl: string,
  originalUrl: string,
  config: CustomBgConfig,
  format: 'image/png' | 'image/jpeg' = 'image/png'
): Promise<string> {
  const fgImg = await loadImage(foregroundUrl);
  const width = fgImg.naturalWidth;
  const height = fgImg.naturalHeight;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Không thể khởi tạo Canvas 2D context');

  // Vẽ nền dựa trên cấu hình
  if (config.type === 'color') {
    ctx.fillStyle = config.color;
    ctx.fillRect(0, 0, width, height);
  } else if (config.type === 'gradient') {
    const gradient = createGradient(ctx, width, height, config.gradient);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  } else if (config.type === 'image' && config.customImageUrl) {
    try {
      const bgImg = await loadImage(config.customImageUrl);
      ctx.drawImage(bgImg, 0, 0, width, height);
    } catch {
      // Nếu lỗi ảnh nền, fallback sang trắng
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
    }
  } else if (config.type === 'blur_original' && originalUrl) {
    try {
      const origImg = await loadImage(originalUrl);
      ctx.save();
      ctx.filter = `blur(${config.blurAmount || 15}px)`;
      // Mở rộng viền khi blur để tránh viền trắng
      ctx.drawImage(origImg, -20, -20, width + 40, height + 40);
      ctx.restore();
    } catch {
      // Fallback
    }
  }

  // Vẽ bóng đổ (Drop Shadow) nếu được bật
  if (config.hasShadow) {
    ctx.save();
    ctx.shadowColor = `rgba(0, 0, 0, ${config.shadowOpacity || 0.4})`;
    ctx.shadowBlur = config.shadowBlur || 25;
    ctx.shadowOffsetY = config.shadowOffsetY || 15;
    ctx.shadowOffsetX = 0;
    ctx.drawImage(fgImg, 0, 0, width, height);
    ctx.restore();
  }

  // Vẽ ảnh tiền cảnh (đã tách nền)
  ctx.drawImage(fgImg, 0, 0, width, height);

  return canvas.toDataURL(format, 0.95);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

function createGradient(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  gradientType: string
): CanvasGradient {
  const grad = ctx.createLinearGradient(0, 0, width, height);
  switch (gradientType) {
    case 'sunset':
      grad.addColorStop(0, '#ff7e5f');
      grad.addColorStop(1, '#feb47b');
      break;
    case 'ocean':
      grad.addColorStop(0, '#2b5876');
      grad.addColorStop(1, '#4e4376');
      break;
    case 'neon':
      grad.addColorStop(0, '#f857a6');
      grad.addColorStop(1, '#ff5858');
      break;
    case 'studio':
      grad.addColorStop(0, '#e0eafc');
      grad.addColorStop(1, '#cfdef3');
      break;
    case 'cyberpunk':
      grad.addColorStop(0, '#0f2027');
      grad.addColorStop(0.5, '#203a43');
      grad.addColorStop(1, '#2c5364');
      break;
    case 'emerald':
      grad.addColorStop(0, '#0ba360');
      grad.addColorStop(1, '#3cba92');
      break;
    case 'lavender':
      grad.addColorStop(0, '#a18cd1');
      grad.addColorStop(1, '#fbc2eb');
      break;
    default:
      grad.addColorStop(0, '#6366f1');
      grad.addColorStop(1, '#a855f7');
      break;
  }
  return grad;
}

/**
 * Tải toàn bộ danh sách ảnh đã tách nền thành file ZIP
 */
export async function downloadAllAsZip(
  items: Array<{ name: string; resultUrl?: string }>
): Promise<void> {
  const zip = new JSZip();
  let count = 0;

  for (const item of items) {
    if (!item.resultUrl) continue;
    const base64Data = item.resultUrl.split(',')[1];
    if (base64Data) {
      const fileNameWithoutExt = item.name.replace(/\.[^/.]+$/, '');
      zip.file(`${fileNameWithoutExt}-tach-nen.png`, base64Data, {
        base64: true,
      });
      count++;
    }
  }

  if (count === 0) {
    throw new Error('Chưa có ảnh nào được tách nền thành công để tải.');
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  downloadFile(url, `tach-nen-deepinfra-${Date.now()}.zip`);
  URL.revokeObjectURL(url);
}
