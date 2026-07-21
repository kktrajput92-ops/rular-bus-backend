import { View, Text, StyleSheet } from "react-native";

export default function OfferBanner() {
  return (
    <View style={styles.banner}>
      <Text style={styles.title}>🎉 Flat 20% OFF</Text>
      <Text style={styles.subtitle}>
        Use Code: RULAR20
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: "#FFB703",
    borderRadius: 16,
    padding: 18,
    marginTop: 18,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },

  subtitle: {
    marginTop: 6,
    fontSize: 15,
    color: "#374151",
  },
});
