import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { View } from "react-native";

import { Avatar } from "@/components/pixel/avatar";
import { Screen } from "@/components/pixel/screen";
import { Btn, Card, Field, Main, Notice, SectionTitle, T } from "@/components/pixel/ui";
import { usePixelTheme } from "@/hooks/use-app-store";
import { useApi } from "@/hooks/use-api";
import { t } from "@/i18n";
import { PublicUser, UserSearchResult, api, mediaUrl } from "@/lib/api";
import { errorMessage } from "@/lib/errors";

const SEARCH_DELAY_MS = 350;

function Person({ user, children }: { user: PublicUser; children?: React.ReactNode }) {
  const theme = usePixelTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: theme.em(0.55) }}>
      <Avatar name={user.displayName} uri={user.avatarUrl} size={1.9} />
      <Main title={user.displayName} note={[user.username ? `@${user.username}` : null, user.locationLabel].filter(Boolean).join(" · ")} />
      {children}
    </View>
  );
}

export default function FriendsScreen() {
  const theme = usePixelTheme();
  const friends = useApi(api.friends);
  const reviews = useApi(api.proofReviews);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const search = (term: string) =>
    api.searchUsers(term).then(setResults, (failure) => setError(errorMessage(failure)));

  // Search as the user types, once they pause.
  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setResults(null);
      return;
    }
    const timer = setTimeout(() => void search(term), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [query]);

  /** Runs a change and reloads whatever it may have touched. */
  const act = async (change: () => Promise<unknown>) => {
    setError(null);
    try {
      await change();
      await Promise.all([friends.reload(), reviews.reload(), query.trim().length >= 2 ? search(query.trim()) : null]);
    } catch (failure) {
      setError(errorMessage(failure));
    }
  };

  const { incoming = [], outgoing = [], friends: accepted = [] } = friends.data ?? {};

  return (
    <Screen onRefresh={() => Promise.all([friends.reload(), reviews.reload()])}>
      <Card>
        <Field
          testID="friends-search"
          label={t("friendsScreen.search")}
          hint={t("friendsScreen.searchHint")}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {results?.map((user) => (
          <Person key={user.id} user={user}>
            {user.friendship?.status === "accepted" ? (
              <T v="label">{`▲ ${t("friendsScreen.already")}`}</T>
            ) : user.friendship?.status === "pending" && !user.friendship.incoming ? (
              <T v="label">{`● ${t("friendsScreen.sent")}`}</T>
            ) : (
              <Btn testID={`friend-add-${user.username}`} label={t("friendsScreen.add")} icon="plus" size="sm" onPress={() => act(() => api.requestFriend(user.id))} />
            )}
          </Person>
        ))}
        {results && !results.length ? <T v="note">{t("friendsScreen.noResults")}</T> : null}
      </Card>

      {error ?? friends.error ? <Notice>{error ?? friends.error}</Notice> : null}

      {reviews.data?.length ? (
        <>
          <SectionTitle>{t("friendsScreen.reviews")}</SectionTitle>
          {reviews.data.map((review) => (
            <Card key={review.id}>
              <Main title={review.goalTitle} note={t("friendsScreen.reviewBy", { name: review.user.displayName })} />
              {review.prompt ? <T v="say">{`> ${review.prompt}`}</T> : null}
              <Image
                source={{ uri: mediaUrl(review.mediaUrl) ?? undefined }}
                style={{ height: theme.em(9), borderWidth: theme.line, borderColor: theme.fg }}
                contentFit="cover"
              />
              {review.note ? <T v="note">{review.note}</T> : null}
              <View style={{ flexDirection: "row", gap: theme.em(0.45) }}>
                <Btn testID="review-approve" label={t("friendsScreen.approve")} icon="check" style={{ flex: 1 }} onPress={() => act(() => api.reviewProof(review.id, true))} />
                <Btn testID="review-reject" label={t("friendsScreen.reject")} icon="close" variant="line" style={{ flex: 1 }} onPress={() => act(() => api.reviewProof(review.id, false))} />
              </View>
            </Card>
          ))}
        </>
      ) : null}

      {incoming.length ? (
        <>
          <SectionTitle>{t("friendsScreen.incoming")}</SectionTitle>
          {incoming.map((link) => (
            <Card key={link.id}>
              <Person user={link.user} />
              <View style={{ flexDirection: "row", gap: theme.em(0.45) }}>
                <Btn testID={`friend-accept-${link.user.username}`} label={t("friendsScreen.accept")} icon="check" size="sm" style={{ flex: 1 }} onPress={() => act(() => api.respondFriend(link.id, "accepted"))} />
                <Btn label={t("friendsScreen.decline")} size="sm" variant="line" style={{ flex: 1 }} onPress={() => act(() => api.respondFriend(link.id, "declined"))} />
              </View>
            </Card>
          ))}
        </>
      ) : null}

      <SectionTitle>{t("friendsScreen.friends", { count: accepted.length })}</SectionTitle>
      {accepted.length ? (
        <Card contentStyle={{ gap: theme.em(0.7) }}>
          {accepted.map((link) => (
            <Person key={link.id} user={link.user}>
              <Btn testID={`friend-remove-${link.user.username}`} label={t("friendsScreen.remove")} size="sm" variant="line" onPress={() => act(() => api.removeFriend(link.id))} />
            </Person>
          ))}
        </Card>
      ) : (
        <T v="note">{friends.loading ? t("common.loading") : t("friendsScreen.empty")}</T>
      )}

      {outgoing.length ? (
        <>
          <SectionTitle>{t("friendsScreen.outgoing")}</SectionTitle>
          <Card contentStyle={{ gap: theme.em(0.7) }}>
            {outgoing.map((link) => (
              <Person key={link.id} user={link.user}>
                <Btn label={t("common.cancel")} size="sm" variant="line" onPress={() => act(() => api.removeFriend(link.id))} />
              </Person>
            ))}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}
