import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "@/constants/colors";

export default function Header() {
  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Good Morning 👋</Text>
      <Text style={styles.title}>Rular Bus</Text>
      <Text style={styles.subtitle}>
        Book your journey with comfort
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    marginBottom: 25,
  },

  greeting: {
    color: "#D6E4FF",
    fontSize: 16,
  },

  title: {
    color: COLORS.white,
    fontSize: 32,
    fontWeight: "800",
    marginTop: 5,
  },

  subtitle: {
    color: "#D6E4FF",
    marginTop: 4,
    fontSize: 15,
  },
});
