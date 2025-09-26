import { encode } from '@jsquash/avif';
import { AVIF_TARGET_WIDTHS, pickTargetWidths } from './images';

export type AvifVariant = {
	width: number;
	blob: Blob;
};

export async function compressToAvifVariants(file: File): Promise<AvifVariant[]> {
	const dataUrl = await fileToDataUrl(file);
	const img = await loadImg(dataUrl);
	const widths = pickTargetWidths(img.naturalWidth);
	const variants: AvifVariant[] = [];
	for (const w of widths) {
		const { imageData } = drawToCanvas(img, w);
		const avifBuffer = await encode(imageData, {
			speed: 6,
			quality: 52,
			// subsample 1 = 4:2:0
			subsample: 1,
			sharpness: 0,
			enableSharpYUV: true,
		});
		variants.push({ width: w, blob: new Blob([avifBuffer], { type: 'image/avif' }) });
	}
	return variants;
}

function fileToDataUrl(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onerror = () => reject(reader.error);
		reader.onload = () => resolve(String(reader.result));
		reader.readAsDataURL(file);
	});
}

function loadImg(src: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = (e) => reject(e);
		img.src = src;
	});
}

function drawToCanvas(img: HTMLImageElement, targetWidth: number): { canvas: HTMLCanvasElement; imageData: ImageData } {
	const ratio = img.naturalWidth / img.naturalHeight || 1;
	const width = Math.min(targetWidth, img.naturalWidth);
	const height = Math.round(width / ratio);
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('Canvas 2D not supported');
	ctx.drawImage(img, 0, 0, width, height);
	const imageData = ctx.getImageData(0, 0, width, height);
	return { canvas, imageData };
}


