export function NoiseOverlay() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[200]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='256' height='256' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
        opacity: 0.038,
        mixBlendMode: "overlay",
      }}
    />
  );
}
