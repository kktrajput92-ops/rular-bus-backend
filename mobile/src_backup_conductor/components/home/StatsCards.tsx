import { View, Text, StyleSheet } from "react-native";

export default function StatsCards() {
  return (
    <View style={styles.container}>

      <View style={styles.card}>
        <Text style={styles.number}>24</Text>
        <Text style={styles.label}>Buses Today</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.number}>1280+</Text>
        <Text style={styles.label}>Travellers</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.number}>4.9★</Text>
        <Text style={styles.label}>Rating</Text>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 18,
  },

  card: {
    backgroundColor: "#ffffff",
    width: "31%",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    elevation: 4,
  },

  number: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0B4EA2",
  },

  label: {
    fontSize: 12,
    color: "#666",
    marginTop: 6,
    textAlign: "center",
  },
});
