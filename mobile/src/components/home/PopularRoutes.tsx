import { View, Text, StyleSheet } from "react-native";

export default function PopularRoutes() {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>🔥 Popular Routes</Text>

      <View style={styles.card}>
        <Text style={styles.route}>Delhi → Lucknow</Text>
        <Text style={styles.price}>From ₹599</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.route}>Agra → Jaipur</Text>
        <Text style={styles.price}>From ₹499</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },

  heading: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },

  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
  },

  route: {
    fontSize: 17,
    fontWeight: "700",
  },

  price: {
    color: "#E53935",
    marginTop: 6,
    fontWeight: "600",
  },
});

