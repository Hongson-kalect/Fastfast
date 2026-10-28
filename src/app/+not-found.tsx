import { Link, Stack } from "expo-router";
import { useT } from "@/providers/Language";
import { StyleSheet, Text, View } from "react-native";

export default function NotFoundScreen() {
  const t = useT();
  return (
    <>
      <Stack.Screen options={{ title: t("notFound.title") }} />
      <View style={styles.container}>
        <Text>{t("notFound.body")}</Text>
        <Link href="/(tabs)" style={styles.link}>
          <Text>{t("notFound.home")}</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
