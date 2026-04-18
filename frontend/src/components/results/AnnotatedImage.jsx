import { useEffect, useRef } from "react";
import { SEVERITY_CONFIG } from "../../constants/severity";

export function AnnotatedImage({ imageURL, results }) {
  const canvasRef = useRef();

  useEffect(() => {
    if (!results || !imageURL) return;

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Canvas má vždy rovnakú veľkosť ako obrázok (max 800px šírka)
      const maxW = Math.min(img.naturalWidth, 800);
      const scale = maxW / img.naturalWidth;
      const canvasW = maxW;
      const canvasH = img.naturalHeight * scale;

      canvas.width  = canvasW;
      canvas.height = canvasH;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvasW, canvasH);

      results.forEach((r) => {
        const cfg = SEVERITY_CONFIG[r.severity];

        // Súradnice sú percentuálne (0–1) voči veľkosti obrázka
        // → fungujú pre akýkoľvek obrázok
        const bx = r.x * canvasW;
        const by = r.y * canvasH;
        const bw = r.w * canvasW;
        const bh = r.h * canvasH;

        // Bounding box
        ctx.strokeStyle = cfg.color;
        ctx.lineWidth   = Math.max(2, canvasW / 300); // hrúbka čiary úmerná veľkosti
        ctx.shadowColor = cfg.color;
        ctx.shadowBlur  = 10;
        ctx.strokeRect(bx, by, bw, bh);
        ctx.shadowBlur  = 0;

        // Label — dynamická veľkosť fontu
        const fontSize  = Math.max(11, Math.round(canvasW / 55));
        const labelH    = fontSize + 10;
        const labelW    = fontSize * 7.5;
        const labelY    = by > labelH ? by - labelH : by + bh; // ak je box pri vrchu, label ide pod

        ctx.fillStyle = cfg.color + "dd";
        ctx.fillRect(bx, labelY, labelW, labelH);

        ctx.fillStyle = "#fff";
        ctx.font      = `bold ${fontSize}px 'DM Sans', sans-serif`;
        ctx.fillText(
          `Diera #${r.id}  ${Math.round(r.confidence * 100)}%`,
          bx + 5,
          labelY + labelH - 4,
        );
      });
    };
    img.src = imageURL;
  }, [results, imageURL]);

  return (
    <div style={{ background: "#0A0A0A", display: "flex", justifyContent: "center", padding: 20 }}>
      <canvas ref={canvasRef} style={{ maxWidth: "100%", borderRadius: 8 }} />
    </div>
  );
}
