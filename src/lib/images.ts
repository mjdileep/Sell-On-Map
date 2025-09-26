export const AVIF_TARGET_WIDTHS = [1600, 1200, 800, 600, 400, 200, 100] as const;
export type AvifWidth = typeof AVIF_TARGET_WIDTHS[number];

export function pickTargetWidths(naturalWidth: number): AvifWidth[] {
	const usable = AVIF_TARGET_WIDTHS.filter((w) => w <= naturalWidth);
	return usable.length > 0 ? usable : [AVIF_TARGET_WIDTHS[AVIF_TARGET_WIDTHS.length - 1]];
}

export function buildSrcSet(urlsByWidth: Record<number, string>): string {
	return Object.entries(urlsByWidth)
		.sort((a, b) => Number(a[0]) - Number(b[0]))
		.map(([w, url]) => `${url} ${w}w`)
		.join(', ');
}

export function defaultSizesAttr(): string {
	return '100vw';
}


