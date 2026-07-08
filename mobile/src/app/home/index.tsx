import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS } from "@/constants/colors";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Rular Bus</Text>

      <View style={styles.card}>
        <Text style={styles.label}>FROM</Text>
        <Text style={styles.city}>Delhi</Text>

        <View style={styles.divider} />

        <Text style={styles.label}>TO</Text>
        <Text style={styles.city}>Lucknow</Text>

        <View style={styles.divider} />

        <Text style={styles.label}>DATE</Text>
        <Text style={styles.city}>Select Journey Date</Text>

        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Search Bus</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
    padding: 20,
  },

  header: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 20,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 20,
  },

  label: {
    color: "#666",
    fontSize: 13,
    marginTop: 10,
  },

  city: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 5,
  },

  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 15,
  },

  button: {
    marginTop: 25,
    backgroundColor: COLORS.secondary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

