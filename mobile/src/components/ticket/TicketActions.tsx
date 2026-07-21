import React from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
} from "react-native";

type Props = {
  onDownload?: () => void;
  onShare?: () => void;
  onHome?: () => void;
};

export default function TicketActions({
  onDownload,
  onShare,
  onHome,
}: Props) {
  return (
    <View style={styles.container}>

      <TouchableOpacity
        style={[styles.button, styles.download]}
        onPress={onDownload}
      >
        <Text style={styles.text}>
          📄 Download PDF
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.share]}
        onPress={onShare}
      >
        <Text style={styles.text}>
          📤 Share Ticket
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.home]}
        onPress={onHome}
      >
        <Text style={styles.text}>
          🏠 Go to Home
        </Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    gap: 12,
    marginBottom: 20,
  },

  button: {
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
  },

  download: {
    backgroundColor: "#0B3D91",
  },

  share: {
    backgroundColor: "#198754",
  },

  home: {
    backgroundColor: "#6C757D",
  },

  text: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
});
