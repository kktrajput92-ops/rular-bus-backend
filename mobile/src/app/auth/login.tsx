import { SafeAreaView, View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { COLORS } from "@/constants/colors";

export default function LoginScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>

        <Text style={styles.title}>Welcome to Rular Bus</Text>

        <Text style={styles.subtitle}>
          Login with your mobile number
        </Text>

        <TextInput
          placeholder="Enter Mobile Number"
          keyboardType="phone-pad"
          placeholderTextColor="#999"
          style={styles.input}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace("/home")}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },

  content: {
    flex: 1,
    justifyContent: "center",
    padding: 25,
  },

  title: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 10,
  },

  subtitle: {
    color: "#ddd",
    marginBottom: 35,
    fontSize: 16,
  },

  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    marginBottom: 20,
  },

  button: {
    backgroundColor: COLORS.secondary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
});

