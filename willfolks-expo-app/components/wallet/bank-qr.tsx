import { useMemo } from "react";
import { Image, View } from "react-native";

import { Chamfer, T } from "@/components/pixel/ui";
import { PixelBitmap, PixelIcon, cellFor } from "@/components/pixel/pixel-icon";
import { Palettes } from "@/constants/theme";
import { usePixelTheme } from "@/hooks/use-app-store";

/** Light margin around the symbol that readers need, in modules. */
const QUIET = 3;
/** Side of the centre badge as a share of the symbol; level H recovers far more than it hides. */
const BADGE_SHARE = 0.2;

interface BankQrProps {
  /** One string per row, "1" = dark module. */
  modules: string[] | null;
  /** The PNG as issued, base64; drawn as is when the modules are missing. */
  image: string;
  /** Outer side of the plate. */
  size: number;
  /** Caption printed on the plate's top strip. */
  caption: string;
}

/**
 * The bank QR drawn in the app's own look: ink modules on the acid plate, chamfered like the
 * cards, with the coin badge in the centre. Always dark on light, whatever the theme, because
 * that is what every bank app reads.
 */
export function BankQr({ modules, image, size, caption }: BankQrProps) {
  const theme = usePixelTheme();
  const paper = Palettes.acid.bg;
  const ink = Palettes.acid.fg;

  const n = modules?.length ?? 0;
  const cell = n ? cellFor(size - theme.line * 4, n + QUIET * 2) : 0;
  const badge = n ? Math.max(5, Math.round((n * BADGE_SHARE) / 2) * 2 + 1) : 0;

  // The centre is cleared so the badge sits on the plate, not on half-covered modules.
  const rows = useMemo(() => {
    if (!modules) return null;
    const from = (n - badge) / 2;
    const to = from + badge;
    return modules.map((row, y) => (y < from || y >= to ? row : row.slice(0, from) + "0".repeat(badge) + row.slice(to)));
  }, [modules, n, badge]);

  const symbol = cell * n;
  const badgeSide = cell * badge;

  return (
    <Chamfer
      solid={theme.id === "void"}
      cut={theme.em(0.9)}
      style={{ alignSelf: "center" }}
      contentStyle={{ backgroundColor: paper, alignItems: "center" }}
    >
      <View style={{ alignSelf: "stretch", flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: ink, paddingVertical: theme.em(0.3), paddingHorizontal: theme.em(1.1) }}>
        <T v="label" color={paper}>
          {caption}
        </T>
        <PixelIcon name="coin" size={theme.em(0.8)} color={paper} />
      </View>
      {rows ? (
        <View testID="bank-qr" accessibilityRole="image" style={{ padding: cell * QUIET }}>
          <View style={{ width: symbol, height: symbol }}>
            <PixelBitmap rows={rows} tone="1" cell={cell} color={ink} />
            <View
              style={{
                position: "absolute",
                left: (symbol - badgeSide) / 2 + cell,
                top: (symbol - badgeSide) / 2 + cell,
                width: badgeSide - cell * 2,
                height: badgeSide - cell * 2,
                backgroundColor: ink,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <PixelIcon name="coin" size={badgeSide * 0.62} color={paper} />
            </View>
          </View>
        </View>
      ) : (
        <Image
          testID="bank-qr"
          source={{ uri: `data:image/png;base64,${image}` }}
          style={{ width: size - theme.line * 4, height: size - theme.line * 4 }}
          resizeMode="contain"
        />
      )}
    </Chamfer>
  );
}
