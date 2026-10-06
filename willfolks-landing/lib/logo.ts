/**
 * The WillFolks mark as three flat shapes, lifted from the brand SVG with
 * its original transforms. Shared by <LogoMark /> and the 3D hero object so
 * both stay in sync with the source artwork.
 */
export const LOGO_VIEWBOX = "80.8 167.5 338.9 170.5";

export const LOGO_GROUP_TRANSFORM =
  "matrix(0.76294426,0,0,0.76294426,58.8551,49.618531)";

export const LOGO_SHAPES = [
  {
    id: "leaf-outer",
    transform: "translate(-30.14637,-4.3760188)",
    d: "M 70.709731,158.88464 H 178.89683 c 2.1907,117.90003 52.41984,194.15217 146.08015,219.2147 8.96833,2.39983 8.85347,3.82725 -0.43172,3.92389 -67.63527,0.70393 -113.51448,1.77845 -165.14274,-21.62113 C 105.83591,336.124 64.112265,282.78932 58.934043,171.06656 c -0.311675,-6.72454 5.043756,-12.18192 11.775688,-12.18192 z",
  },
  {
    id: "comma",
    transform: "translate(-5.3785071,-3.9030308)",
    d: "m 397.44531,158.71875 c -33.37779,-3.8e-4 -60.43593,27.05776 -60.43554,60.43555 -4e-5,28.61475 20.06788,53.30753 48.07812,59.1582 -1.38055,1.11023 -2.73502,2.19112 -4.05664,3.24219 -11.38688,9.0559 -25.89846,5.90129 -39.68555,-0.92383 -23.86987,-11.81648 -30.57123,-26.2138 -20.10729,-2.30561 7.29051,16.65748 19.52494,60.14883 25.91176,101.2787 0.19486,1.25488 1.37054,2.15918 2.63059,2.00121 155.29869,-19.46922 168.19302,-222.8866 47.66455,-222.8866 z",
  },
  {
    id: "leaf-inner",
    transform:
      "matrix(1.1692938,0,0,1.0344639,-61.017909,-9.8517988) translate(1.4142136,-0.00519)",
    d: "M 336.89549,374.8568 C 311.83614,214.53213 261.38298,158.88983 185.92198,158.88983 c 1.60393,115.06981 47.32068,191.97364 150.97351,215.96697 z",
  },
] as const;

/** Standalone SVG document, used by three's SVGLoader. */
export function logoSvgString(): string {
  const paths = LOGO_SHAPES.map(
    (s) => `<path transform="${s.transform}" d="${s.d}"/>`,
  ).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><g transform="${LOGO_GROUP_TRANSFORM}">${paths}</g></svg>`;
}
