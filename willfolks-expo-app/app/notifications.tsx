import { Href, useRouter } from "expo-router";
import { Pressable, View } from "react-native";

import { Screen } from "@/components/pixel/screen";
import { Btn, Chip, Main, Notice, Row, SectionTitle, T } from "@/components/pixel/ui";
import type { PixelIconName } from "@/constants/pixel-icons";
import { useAppStore, usePixelTheme } from "@/hooks/use-app-store";
import { useApi } from "@/hooks/use-api";
import { t } from "@/i18n";
import { AppNotification, api } from "@/lib/api";
import { formatMoment } from "@/lib/wallet";

const ICONS: Record<string, PixelIconName> = {
  system: "spark",
  goal_created: "lock",
  goal_invite: "group",
  goal_result: "check",
  friend_request: "user",
  friend_accepted: "heart",
  proof_review: "eye",
  wallet: "coin",
};

/** Where tapping a notification leads. */
function destination({ type, data }: AppNotification): Href | null {
  if (data.transactionId) return `/wallet/${data.transactionId}`;
  if (type === "proof_review" || type === "friend_request" || type === "friend_accepted") return "/friends";
  if (data.goalId) return `/activity/${data.goalId}`;
  return null;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const theme = usePixelTheme();
  const { dispatch } = useAppStore();
  const inbox = useApi(async () => {
    const result = await api.notifications();
    dispatch({ type: "unread", count: result.unread });
    return result;
  });

  const open = async (notification: AppNotification) => {
    if (!notification.readAt) {
      await api.readNotification(notification.id).catch(() => {});
      void inbox.reload();
    }
    const target = destination(notification);
    if (target) router.push(target);
  };

  const readAll = async () => {
    await api.readAllNotifications().catch(() => {});
    await inbox.reload();
  };

  const unread = inbox.data?.unread ?? 0;

  return (
    <Screen onRefresh={inbox.reload}>
      <Row>
        <View style={{ flex: 1 }}>
          <SectionTitle>{t("inbox.unread", { count: unread })}</SectionTitle>
        </View>
        {unread > 0 ? <Btn testID="inbox-read-all" label={t("inbox.readAll")} size="sm" variant="line" onPress={readAll} /> : null}
      </Row>
      {inbox.error ? <Notice>{inbox.error}</Notice> : null}
      {inbox.data?.items.length ? (
        <View style={{ gap: theme.em(0.35) }}>
          {inbox.data.items.map((notification) => (
            <Pressable
              key={notification.id}
              accessibilityRole="button"
              onPress={() => open(notification)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: theme.em(0.55),
                paddingVertical: theme.em(0.45),
                paddingHorizontal: theme.em(0.5),
                borderWidth: theme.line,
                borderColor: theme.fg,
                opacity: notification.readAt ? 0.6 : 1,
              }}
            >
              <Chip icon={ICONS[notification.type] ?? "bell"} solid={!notification.readAt} />
              <Main title={notification.title} note={`${notification.body}\n${formatMoment(notification.createdAt)}`} />
            </Pressable>
          ))}
        </View>
      ) : (
        <T v="note">{inbox.loading ? t("common.loading") : t("inbox.empty")}</T>
      )}
    </Screen>
  );
}
