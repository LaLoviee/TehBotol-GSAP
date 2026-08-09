"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type TextBlockRefs = {
  heading: string;
  sub: string;
};

const TEXT_1: TextBlockRefs = {
  heading: "Karya Asli Indonesia",
  sub: "Warisan rasa yang dijaga turun-temurun.",
};

const TEXT_2: TextBlockRefs = {
  heading: "Daun Teh Pilihan",
  sub: "Diambil dari pucuk teh terbaik dataran tinggi.",
};

const TEXT_3: TextBlockRefs = {
  heading: "Tanpa Pengawet",
  sub: "Kesegaran murni di setiap tegukan.",
};

const TOTAL_FRAMES = 192;
const FRAME_PATH = (i: number) =>
  `/frames/frame-${String(i + 1).padStart(4, "0")}.jpg`;

export default function TehbotolVideoStory() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const currentFrameRef = useRef(0);

  const text1Ref = useRef<HTMLDivElement>(null);
  const text2Ref = useRef<HTMLDivElement>(null);
  const text3Ref = useRef<HTMLDivElement>(null);
  const text4Ref = useRef<HTMLDivElement>(null);

  const gaugeFillRef = useRef<HTMLDivElement>(null);
  const gaugeLabelRef = useRef<HTMLSpanElement>(null);

  const [loadedCount, setLoadedCount] = useState(0);
  const [isFullyLoaded, setIsFullyLoaded] = useState(false);
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let loaded = 0;
    const images: HTMLImageElement[] = new Array(TOTAL_FRAMES);

    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      img.decoding = "async";
      img.src = FRAME_PATH(i);
      img.onload = () => {
        if (cancelled) return;
        loaded += 1;
        setLoadedCount(loaded);
        if (loaded === TOTAL_FRAMES) setIsFullyLoaded(true);
      };
      img.onerror = () => {
        console.error(`Gagal memuat frame: ${FRAME_PATH(i)}`);
      };
      images[i] = img;
    }
    imagesRef.current = images;

    return () => {
      cancelled = true;
    };
  }, []);

  const drawFrame = useCallback((index: number) => {
    const canvas = canvasRef.current;
    const img = imagesRef.current[index];
    if (!canvas || !img || !img.complete || img.naturalWidth === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    const targetW = Math.round(cw * dpr);
    const targetH = Math.round(ch * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const canvasRatio = cw / ch;
    const imgRatio = img.naturalWidth / img.naturalHeight;
    let drawW: number;
    let drawH: number;
    let offsetX = 0;
    let offsetY = 0;

    if (imgRatio > canvasRatio) {
      drawH = ch;
      drawW = ch * imgRatio;
      offsetX = (cw - drawW) / 2;
    } else {
      drawW = cw;
      drawH = cw / imgRatio;
      offsetY = (ch - drawH) / 2;
    }

    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
  }, []);

  useGSAP(
    () => {
      if (!isFullyLoaded) return;

      drawFrame(0);

      const frameProxy = { index: 0 };

      const revealText = (
        target: HTMLDivElement | null,
        inStart: number,
        inEnd: number,
        outStart: number | null,
        outEnd: number | null
      ) => {
        if (!target) return;

        master.fromTo(
          target,
          { opacity: 0, y: 36 },
          { opacity: 1, y: 0, duration: inEnd - inStart, ease: "power2.out" },
          inStart
        );

        if (outStart !== null && outEnd !== null) {
          master.to(
            target,
            { opacity: 0, y: -36, duration: outEnd - outStart, ease: "power2.in" },
            outStart
          );
        }
      };

      const master = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
          pin: pinRef.current,
          anticipatePin: 1,
          onUpdate: (self) => {
            if (gaugeFillRef.current) {
              gaugeFillRef.current.style.height = `${self.progress * 100}%`;
            }
            if (gaugeLabelRef.current) {
              gaugeLabelRef.current.textContent = `${Math.round(self.progress * 100)}%`;
            }
            if (!hasStartedPlaying && self.progress > 0) {
              setHasStartedPlaying(true);
            }
          },
        },
        defaults: { ease: "none" },
      });

      master.to(
        frameProxy,
        {
          index: TOTAL_FRAMES - 1,
          duration: 1,
          ease: "none",
          onUpdate: () => {
            const idx = Math.round(frameProxy.index);
            if (idx !== currentFrameRef.current) {
              currentFrameRef.current = idx;
              drawFrame(idx);
            }
          },
        },
        0
      );

      revealText(text1Ref.current, 0.02, 0.09, 0.16, 0.22);
      revealText(text2Ref.current, 0.28, 0.35, 0.43, 0.49);
      revealText(text3Ref.current, 0.54, 0.61, 0.69, 0.75);
      revealText(text4Ref.current, 0.82, 0.92, null, null);

      ScrollTrigger.refresh();

      const handleResize = () => drawFrame(currentFrameRef.current);
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    },
    { scope: containerRef, dependencies: [isFullyLoaded] }
  );

  const isFullyReady = isFullyLoaded && hasStartedPlaying;
  const loadPercent = Math.round((loadedCount / TOTAL_FRAMES) * 100);

  return (
    <div ref={containerRef} className="relative h-[500vh] w-full bg-[#0B0806]">
      <div
        ref={pinRef}
        className="relative h-screen w-full overflow-hidden bg-[#0B0806]"
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
        />

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/50" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />

        <div
          className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-700 ${
            isFullyReady ? "opacity-0" : "opacity-100"
          }`}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4A537]/30 border-t-[#D4A537]" />
            <span className="text-[10px] font-medium uppercase tracking-[0.35em] text-[#F5EFE6]/60">
              {isFullyLoaded ? "Menyeduh cerita" : `Menyeduh cerita ${loadPercent}%`}
            </span>
          </div>
        </div>

        <div
          ref={text1Ref}
          className="pointer-events-none absolute left-6 top-8 max-w-[260px] opacity-0 md:left-14 md:top-14 md:max-w-sm"
        >
          <h2 className="mt-3 font-serif text-2xl font-bold leading-tight text-[#F5EFE6] md:text-4xl">
            {TEXT_1.heading}
          </h2>
          <p className="mt-2 text-sm text-[#F5EFE6]/70 md:text-base">{TEXT_1.sub}</p>
        </div>

        <div
          ref={text2Ref}
          className="pointer-events-none absolute bottom-10 right-6 max-w-[260px] text-right opacity-0 md:bottom-16 md:right-14 md:max-w-sm"
        >
          <h2 className="mt-3 font-serif text-2xl font-bold leading-tight text-[#F5EFE6] md:text-4xl">
            {TEXT_2.heading}
          </h2>
          <p className="mt-2 text-sm text-[#F5EFE6]/70 md:text-base">{TEXT_2.sub}</p>
        </div>

        <div
          ref={text3Ref}
          className="pointer-events-none absolute bottom-10 left-6 max-w-[260px] opacity-0 md:bottom-16 md:left-14 md:max-w-sm"
        >
          <h2 className="mt-3 font-serif text-2xl font-bold leading-tight text-[#F5EFE6] md:text-4xl">
            {TEXT_3.heading}
          </h2>
          <p className="mt-2 text-sm text-[#F5EFE6]/70 md:text-base">{TEXT_3.sub}</p>
        </div>

        <div
          ref={text4Ref}
          className="pointer-events-none absolute left-1/2 top-1/2 w-[90%] max-w-2xl -translate-x-1/2 -translate-y-1/2 text-center opacity-0"
        >
        </div>

        <div className="pointer-events-none absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 opacity-70 md:hidden">
          <span className="text-[9px] font-medium uppercase tracking-[0.3em] text-[#F5EFE6]/60">
            Scroll
          </span>
          <div className="h-6 w-[1px] bg-[#F5EFE6]/40" />
        </div>
      </div>
    </div>
  );
}