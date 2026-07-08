import { StatusBar } from "expo-status-bar";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from "react-native";

import { COLORS } from "@/constants/colors";
import Logo from "../assets/images/logo.png";
import { useRouter } from "expo-router";
export default function HomeScreen() {
const router = useRouter();
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.content}>
        <Image
  source={Logo}
  resizeMode="contain"
  style={styles.logo}
/>

        <Text style={styles.title}>Rular Bus</Text>

        <Text style={styles.subtitle}>
          Safe Journey • Happy Journey
        </Text>

        <TouchableOpacity
  style={styles.button}
  onPress={() => router.push("/auth/login")}
>
  <Text style={styles.buttonText}>
    Get Started
  </Text>
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
    alignItems: "center",
    padding: 24,
  },

   logo: {
  width: 220,
  height: 220,
  marginBottom: 20,
},

 title: {
  color: COLORS.white,
  fontSize: 40,
  fontWeight: "800",
  letterSpacing: 1,
  marginBottom: 8,
},

  subtitle: {
  color: "#D6E4FF",
  fontSize: 16,
  marginBottom: 35,
},

  button: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 14,
  },

  buttonText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 18,
  },
});

