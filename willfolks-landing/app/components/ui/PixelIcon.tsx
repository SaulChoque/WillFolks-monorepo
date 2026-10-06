import { PIXEL_ICONS, bitmapToPath, type PixelIconName } from "@/lib/pixel-icons";

interface PixelIconProps {
  name: PixelIconName;
  size?: number;
  className?: string;
}

const PATH_CACHE = new Map<PixelIconName, string>();

function pathFor(name: PixelIconName): string {
  let d = PATH_CACHE.get(name);
  if (!d) {
    d = bitmapToPath(PIXEL_ICONS[name]);
    PATH_CACHE.set(name, d);
  }
  return d;
}

export function PixelIcon({ name, size = 24, className }: PixelIconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 12 12"
      shapeRendering="crispEdges"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d={pathFor(name)} />
    </svg>
  );
}
