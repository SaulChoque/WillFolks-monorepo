import { useState } from "react";

import { Screen } from "@/components/pixel/screen";
import { Btn, Card, Main, Notice, SectionTitle, T } from "@/components/pixel/ui";
import { PermissionsList } from "@/components/system/permissions-list";
import { t } from "@/i18n";
import { requestPinWidget } from "@/lib/native/widget";
import { WillfolksNative } from "@/modules/willfolks-native";

export default function PermissionsScreen() {
  const [pinned, setPinned] = useState<boolean | null>(null);

  return (
    <Screen>
      <SectionTitle>{t("perms.title")}</SectionTitle>
      <T v="note">{t("perms.lead")}</T>
      <PermissionsList />

      {WillfolksNative ? (
        <>
          <SectionTitle>{t("perms.widget.title")}</SectionTitle>
          <Card>
            <Main title={t("perms.widget.title")} note={t("perms.widget.body")} />
            <Btn testID="widget-pin" label={t("perms.widget.add")} icon="plus" onPress={() => requestPinWidget().then(setPinned, () => setPinned(false))} />
          </Card>
          {pinned === false ? <Notice tone="info">{t("perms.widget.unsupported")}</Notice> : null}
        </>
      ) : null}
    </Screen>
  );
}
