import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";

import { DESIGN } from "@/constants/design";

type Props = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
};

export default function AppButton({
  title,
  onPress,
  loading = false,
  disabled = false,
}: Props) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text style={styles.text}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: DESIGN.colors.primary,
    paddingVertical: 16,
    borderRadius: DESIGN.radius.lg,
    alignItems: "center",
  },

  disabled: {
    opacity: 0.6,
  },

  text: {
    color: "#FFFFFF",
    fontSize: DESIGN.font.body,
    fontWeight: "700",
  },
});
