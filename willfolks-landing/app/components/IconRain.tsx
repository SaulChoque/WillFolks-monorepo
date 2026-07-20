"use client";

import { useMemo } from "react";
import {
  MdAccountBalance,
  MdSavings,
  MdTrendingUp,
  MdLock,
  MdAlarm,
  MdNotifications,
  MdMusicNote,
  MdVibration,
  MdTimer,
  MdApps,
  MdPhoneAndroid,
  MdBlock,
  MdLocationOn,
  MdMyLocation,
  MdMap,
  MdExplore,
  MdSmartToy,
  MdPsychology,
  MdChecklist,
  MdAutoAwesome,
  MdAccountBalanceWallet,
  MdCurrencyBitcoin,
  MdPayment,
  MdReceipt,
} from "react-icons/md";
import type { IconType } from "react-icons";

// Icon sets for each feature section
const ICON_SETS: IconType[][] = [
  [MdAccountBalance, MdSavings, MdTrendingUp, MdLock],
  [MdAlarm, MdNotifications, MdMusicNote, MdVibration],
  [MdTimer, MdApps, MdPhoneAndroid, MdBlock],
  [MdLocationOn, MdMyLocation, MdMap, MdExplore],
  [MdSmartToy, MdPsychology, MdChecklist, MdAutoAwesome],
  [MdAccountBalanceWallet, MdCurrencyBitcoin, MdPayment, MdReceipt],
];

const COLUMN_COUNT = 12;
const ICONS_PER_COLUMN = 8;

interface IconRainProps {
  activeIndex: number;
}

export function IconRain({ activeIndex }: IconRainProps) {
  // Generate deterministic column layout
  const columns = useMemo(() => {
    return Array.from({ length: COLUMN_COUNT }, (_, colIdx) => ({
      left: `${(colIdx / COLUMN_COUNT) * 120 - 10}%`,
      duration: 14 + (colIdx % 5) * 3,
      delay: (colIdx % 7) * -2.5,
      icons: Array.from({ length: ICONS_PER_COLUMN }, (_, iconIdx) => ({
        setIndex: (colIdx + iconIdx) % ICON_SETS.length,
        iconIndex: (colIdx + iconIdx) % 4,
      })),
    }));
  }, []);

  return (
    <div className="icon-rain" aria-hidden="true">
      {columns.map((col, colIdx) => (
        <div
          key={colIdx}
          className="icon-rain__column"
          style={{
            left: col.left,
            ["--rain-duration" as string]: `${col.duration}s`,
            ["--rain-delay" as string]: `${col.delay}s`,
          }}
        >
          {col.icons.map((iconCfg, iconIdx) => {
            const iconSet = ICON_SETS[activeIndex] || ICON_SETS[0];
            const Icon = iconSet[iconCfg.iconIndex % iconSet.length];
            return (
              <span key={`${activeIndex}-${iconIdx}`} className="icon-rain__icon">
                <Icon />
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}
