import { useRef, useEffect, useCallback, useState } from "react";

// ── Color conversion helpers ──────────────────────────────────────────────────

function hexToHsv(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + 6) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return [h, max === 0 ? 0 : d / max, max];
}

function hsvToHex(h: number, s: number, v: number): string {
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    const val = v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
    return Math.round(Math.max(0, Math.min(1, val)) * 255).toString(16).padStart(2, "0");
  };
  return `#${f(5)}${f(3)}${f(1)}`;
}

// ── Saturation/Value canvas ───────────────────────────────────────────────────

function SvCanvas({ hue, s, v, onChange }: {
  hue: number; s: number; v: number;
  onChange: (s: number, v: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragging = useRef(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const { width, height } = canvas;
    // White → hue gradient (left→right)
    const hGrad = ctx.createLinearGradient(0, 0, width, 0);
    hGrad.addColorStop(0, "#fff");
    hGrad.addColorStop(1, `hsl(${hue},100%,50%)`);
    ctx.fillStyle = hGrad;
    ctx.fillRect(0, 0, width, height);
    // Transparent → black gradient (top→bottom)
    const vGrad = ctx.createLinearGradient(0, 0, 0, height);
    vGrad.addColorStop(0, "rgba(0,0,0,0)");
    vGrad.addColorStop(1, "#000");
    ctx.fillStyle = vGrad;
    ctx.fillRect(0, 0, width, height);
  }, [hue]);

  useEffect(() => { draw(); }, [draw]);

  const pick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const nx = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const ny = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    onChange(nx, 1 - ny);
  }, [onChange]);

  return (
    <div className="relative rounded-xl overflow-hidden" style={{ height: 160 }}>
      <canvas
        ref={canvasRef}
        width={240}
        height={160}
        className="w-full h-full cursor-crosshair"
        onMouseDown={(e) => { dragging.current = true; pick(e); }}
        onMouseMove={(e) => { if (dragging.current) pick(e); }}
        onMouseUp={() => { dragging.current = false; }}
        onMouseLeave={() => { dragging.current = false; }}
        onTouchStart={(e) => { dragging.current = true; pick(e); }}
        onTouchMove={(e) => { if (dragging.current) pick(e); }}
        onTouchEnd={() => { dragging.current = false; }}
      />
      {/* Cursor dot */}
      <div
        className="absolute w-4 h-4 rounded-full border-2 border-white shadow-md pointer-events-none -translate-x-1/2 -translate-y-1/2"
        style={{ left: `${s * 100}%`, top: `${(1 - v) * 100}%`, backgroundColor: hsvToHex(hue, s, v) }}
      />
    </div>
  );
}

// ── Hue slider ────────────────────────────────────────────────────────────────

function HueSlider({ hue, onChange }: { hue: number; onChange: (h: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const pick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const nx = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    onChange(nx * 360);
  }, [onChange]);

  return (
    <div
      ref={ref}
      className="relative h-4 rounded-full cursor-pointer"
      style={{ background: "linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)" }}
      onMouseDown={(e) => { dragging.current = true; pick(e); }}
      onMouseMove={(e) => { if (dragging.current) pick(e); }}
      onMouseUp={() => { dragging.current = false; }}
      onMouseLeave={() => { dragging.current = false; }}
      onTouchStart={(e) => { dragging.current = true; pick(e); }}
      onTouchMove={(e) => { if (dragging.current) pick(e); }}
      onTouchEnd={() => { dragging.current = false; }}
    >
      <div
        className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-white shadow-md pointer-events-none -translate-x-1/2"
        style={{ left: `${(hue / 360) * 100}%`, backgroundColor: `hsl(${hue},100%,50%)` }}
      />
    </div>
  );
}

// ── Main ColorPicker ──────────────────────────────────────────────────────────

const SWATCHES = [
  "#ff9a9e", "#f48fb1", "#ce93d8", "#9fa8da",
  "#81d4fa", "#80cbc4", "#a5d6a7", "#fff176",
  "#ffcc80", "#ef9a9a", "#6750a4", "#006874",
  "#386a20", "#c76b00", "#1565c0", "#37474f",
];

interface ColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [h, s, v] = hexToHsv(value.startsWith("#") && value.length === 7 ? value : "#ff9a9e");
  const [hue, setHue] = useState(h);
  const [hexInput, setHexInput] = useState(value);

  // Sync hex input when value changes externally
  useEffect(() => { setHexInput(value); }, [value]);
  // Sync hue when value changes externally (only if not dragging)
  useEffect(() => { setHue(hexToHsv(value)[0]); }, [value]);

  const handleSvChange = useCallback((ns: number, nv: number) => {
    const hex = hsvToHex(hue, ns, nv);
    onChange(hex);
  }, [hue, onChange]);

  const handleHueChange = useCallback((newHue: number) => {
    setHue(newHue);
    const [, cs, cv] = hexToHsv(value);
    onChange(hsvToHex(newHue, cs, cv));
  }, [value, onChange]);

  const handleHexInput = (raw: string) => {
    setHexInput(raw);
    if (/^#[0-9a-fA-F]{6}$/.test(raw)) {
      onChange(raw);
      setHue(hexToHsv(raw)[0]);
    }
  };

  return (
    <div className="flex flex-col gap-3 select-none">
      {/* SV canvas */}
      <SvCanvas hue={hue} s={s} v={v} onChange={handleSvChange} />

      {/* Hue slider */}
      <HueSlider hue={hue} onChange={handleHueChange} />

      {/* Preview + hex input */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg border border-slate-200 shrink-0 shadow-sm" style={{ backgroundColor: value }} />
        <input
          type="text"
          value={hexInput}
          onChange={e => handleHexInput(e.target.value)}
          className="flex-1 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-slate-400 uppercase"
          maxLength={7}
          spellCheck={false}
        />
      </div>

      {/* Swatches */}
      <div className="grid grid-cols-8 gap-1.5">
        {SWATCHES.map(c => (
          <button
            key={c}
            onClick={() => { onChange(c); setHue(hexToHsv(c)[0]); }}
            className="w-6 h-6 rounded-md transition-transform hover:scale-110 border-2"
            style={{
              backgroundColor: c,
              borderColor: value === c ? "white" : "transparent",
              outline: value === c ? `2px solid ${c}` : "none",
              outlineOffset: 1,
            }}
          />
        ))}
      </div>
    </div>
  );
}
