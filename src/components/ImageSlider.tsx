"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react';
import ResponsiveImg from '@/components/ResponsiveImg';

export default function ImageSlider({ images, alt }: { images: string[]; alt: string }) {
	const [idx, setIdx] = useState(0);
	const [isImageLoaded, setIsImageLoaded] = useState(false);
	const [isAnimating, setIsAnimating] = useState(false);
	const [isFullScreen, setIsFullScreen] = useState(false);

	// Refs for load detection & swipe
	const mainImgRef = useRef<HTMLImageElement | null>(null);
	const containerRef = useRef<HTMLDivElement | null>(null);
	const pointerActiveRef = useRef(false);
	const startXRef = useRef(0);
	const currentXRef = useRef(0);
	const lastDeltaXRef = useRef(0);
	const hasMovedRef = useRef(false);
	const frameRequestedRef = useRef<number | null>(null);

	// Helper to clamp index circularly
	const mod = useCallback((n: number, m: number) => ((n % m) + m) % m, []);

	if (!images || images.length === 0) return null;

	const prev = useCallback(() => {
		if (isAnimating) return;
		setIsAnimating(true);
		setIsImageLoaded(false);
		setIdx((i) => (i - 1 + images.length) % images.length);
		setTimeout(() => setIsAnimating(false), 150);
	}, [images.length, isAnimating]);

	const next = useCallback(() => {
		if (isAnimating) return;
		setIsAnimating(true);
		setIsImageLoaded(false);
		setIdx((i) => (i + 1) % images.length);
		setTimeout(() => setIsAnimating(false), 150);
	}, [images.length, isAnimating]);

	const openFullScreen = () => {
		setIsFullScreen(true);
		document.body.style.overflow = 'hidden';
	};

	const closeFullScreen = () => {
		setIsFullScreen(false);
		document.body.style.overflow = '';
	};

	// Keyboard controls
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'ArrowLeft') {
				e.preventDefault();
				prev();
			} else if (e.key === 'ArrowRight') {
				e.preventDefault();
				next();
			} else if (e.key === 'Escape' && isFullScreen) {
				e.preventDefault();
				closeFullScreen();
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [prev, next, isFullScreen]);

	// Reset image loaded state when image changes and check if already cached
	useEffect(() => {
		setIsImageLoaded(false);
		const imgEl = mainImgRef.current;
		if (imgEl && imgEl.complete && imgEl.naturalWidth > 0) {
			setIsImageLoaded(true);
		}
	}, [idx]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			document.body.style.overflow = '';
		};
	}, []);

	// Compute surrounding indices for swipe track
	const prevIdx = useMemo(() => mod(idx - 1, images.length), [idx, images.length, mod]);
	const nextIdx = useMemo(() => mod(idx + 1, images.length), [idx, images.length, mod]);

	// Pointer events for swipe
	useEffect(() => {
		const el = containerRef.current;
		if (!el) return;

		const handlePointerDown = (e: PointerEvent) => {
			if (e.pointerType === 'mouse' && e.buttons !== 1) return;
			pointerActiveRef.current = true;
			startXRef.current = e.clientX;
			currentXRef.current = e.clientX;
			lastDeltaXRef.current = 0;
			hasMovedRef.current = false;
			try { el.setPointerCapture(e.pointerId); } catch {}
		};

		const updateFrame = () => {
			frameRequestedRef.current = null;
			const deltaX = currentXRef.current - startXRef.current;
			lastDeltaXRef.current = deltaX;
			// Apply transform directly for smooth feedback
			el.style.transition = 'none';
			el.style.transform = `translate3d(${deltaX}px, 0, 0)`;
		};

		const handlePointerMove = (e: PointerEvent) => {
			if (!pointerActiveRef.current) return;
			hasMovedRef.current = true;
			currentXRef.current = e.clientX;
			if (frameRequestedRef.current == null) {
				frameRequestedRef.current = requestAnimationFrame(updateFrame);
			}
		};

		const handlePointerUp = () => {
			if (!pointerActiveRef.current) return;
			pointerActiveRef.current = false;
			const deltaX = lastDeltaXRef.current;
			const threshold = 40; // px threshold to trigger swipe
			el.style.transition = 'transform 200ms ease-out';
			// Decide action
			if (hasMovedRef.current && Math.abs(deltaX) > threshold) {
				if (deltaX > 0) {
					// swiped right -> prev
					el.style.transform = 'translate3d(100%, 0, 0)';
					setTimeout(() => {
						el.style.transition = '';
						el.style.transform = '';
						prev();
					}, 180);
				} else {
					// swiped left -> next
					el.style.transform = 'translate3d(-100%, 0, 0)';
					setTimeout(() => {
						el.style.transition = '';
						el.style.transform = '';
						next();
					}, 180);
				}
			} else {
				// snap back
				el.style.transform = 'translate3d(0, 0, 0)';
				setTimeout(() => {
					el.style.transition = '';
					el.style.transform = '';
				}, 180);
			}
		};

		el.addEventListener('pointerdown', handlePointerDown, { passive: true });
		el.addEventListener('pointermove', handlePointerMove);
		el.addEventListener('pointerup', handlePointerUp);
		el.addEventListener('pointercancel', handlePointerUp);

		return () => {
			el.removeEventListener('pointerdown', handlePointerDown as any);
			el.removeEventListener('pointermove', handlePointerMove as any);
			el.removeEventListener('pointerup', handlePointerUp as any);
			el.removeEventListener('pointercancel', handlePointerUp as any);
		};
	}, [prev, next]);

	const sliderContent = (
		<div className={`relative w-full group ${isFullScreen ? 'h-full' : ''}`}>
			<div ref={containerRef} className={`w-full ${isFullScreen ? 'h-full' : 'h-48 sm:h-56 md:h-64'} overflow-hidden ${isFullScreen ? '' : 'rounded-lg'} relative bg-gray-100`} style={{ touchAction: 'pan-y', willChange: 'transform' }}>
				{/* Blurred background image */}
				<ResponsiveImg 
					src={images[idx]} 
					alt={alt} 
					className="absolute inset-0 w-full h-full object-cover blur-xl scale-110"
					sizesAttr="(max-width: 768px) 90vw, 640px"
				/>
				
				{/* Main image with preserved aspect ratio */}
				<div className="absolute inset-0 flex items-center justify-center">
					<ResponsiveImg 
						ref={mainImgRef}
						src={images[idx]} 
						alt={alt} 
						className={`max-w-full max-h-full object-contain transition-opacity duration-300 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
						loading={isFullScreen ? 'eager' : 'lazy'}
						onLoad={() => setIsImageLoaded(true)}
					/>
				</div>
				
				{!isImageLoaded && (
					<div className="absolute inset-0 flex items-center justify-center bg-black/20">
						<div className="w-6 h-6 sm:w-8 sm:h-8 border-4 border-gray-300 border-t-indigo-600 rounded-full animate-spin"></div>
					</div>
				)}
				
				{/* Image counter */}
				{images.length > 1 && (
					<div className="absolute top-2 sm:top-3 right-2 sm:right-3 bg-black/60 text-white text-xs sm:text-sm px-2 py-1 rounded-full backdrop-blur-sm">
						{idx + 1} / {images.length}
					</div>
				)}

				{/* Close full screen button */}
				{isFullScreen && (
					<button 
						type="button" 
						onClick={closeFullScreen}
						className="absolute top-4 top-12 right-2 sm:right-3 p-2 rounded-full bg-black/40 hover:bg-black/60 active:bg-black/70 text-white transition-all duration-200 backdrop-blur-sm z-10"
						aria-label="Close full screen"
					>
						<X size={20} className="sm:w-6 sm:h-6" />
					</button>
				)}
			</div>
			
			{images.length > 1 && (
				<>
				{/* Navigation Arrows */}
					<button 
						type="button" 
						onClick={prev}
						disabled={isAnimating}
						className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 rounded-full bg-black/40 hover:bg-black/60 active:bg-black/70 text-white transition-all duration-200 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
						aria-label="Previous image"
					>
						<ChevronLeft size={18} className="sm:w-5 sm:h-5" />
					</button>
					<button 
						type="button" 
						onClick={next}
						disabled={isAnimating}
						className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 rounded-full bg-black/40 hover:bg-black/60 active:bg-black/70 text-white transition-all duration-200 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
						aria-label="Next image"
					>
						<ChevronRight size={18} className="sm:w-5 sm:h-5" />
					</button>
					
					{/* Dot Indicators */}
					<div className="absolute bottom-2 sm:bottom-3 left-0 right-0 flex justify-center gap-1.5 sm:gap-2">
						{images.map((_, i) => (
							<button 
								aria-label={`Go to image ${i+1}`} 
								key={i} 
								onClick={() => {
									if (!isAnimating && i !== idx) {
										setIsAnimating(true);
										setIsImageLoaded(false);
										setIdx(i);
										setTimeout(() => setIsAnimating(false), 150);
									}
								}}
								disabled={isAnimating}
								className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 backdrop-blur-sm touch-manipulation ${
									i === idx 
										? 'w-6 sm:w-8 bg-white shadow-lg' 
										: 'w-1.5 sm:w-2 bg-white/60 hover:bg-white/80 active:bg-white/90'
								} disabled:cursor-not-allowed`} 
							/>
						))}
					</div>
				</>
			)}
		</div>
	);

	if (isFullScreen) {
		return (
			<div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
				{sliderContent}
			</div>
		);
	}

	return sliderContent;
}
