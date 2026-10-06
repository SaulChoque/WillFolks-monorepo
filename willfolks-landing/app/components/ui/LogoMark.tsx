import { LOGO_GROUP_TRANSFORM, LOGO_SHAPES, LOGO_VIEWBOX } from "@/lib/logo";

interface LogoMarkProps {
  className?: string;
  title?: string;
}

/** Flat, single-colour WillFolks mark. Inherits `currentColor`. */
export function LogoMark({ className, title }: LogoMarkProps) {
  return (
    <svg
      className={className}
      viewBox={LOGO_VIEWBOX}
      fill="currentColor"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <g transform={LOGO_GROUP_TRANSFORM}>
        {LOGO_SHAPES.map((shape) => (
          <path key={shape.id} transform={shape.transform} d={shape.d} />
        ))}
      </g>
    </svg>
  );
}
