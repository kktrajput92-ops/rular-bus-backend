import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function QuickActions() {
  const actions = [
    { icon: "🚌", title: "Book" },
    { icon: "📍", title: "Track" },
    { icon: "🎫", title: "Tickets" },
    { icon: "💬", title: "Support" },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Quick Actions</Text>

      <View style={styles.row}>
        {actions.map((item) => (
          <TouchableOpacity key={item.title} style={styles.card}>
            <Text style={styles.icon}>{item.icon}</Text>
            <Text style={styles.title}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 18,
  },

  heading: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  card: {
    width: "23%",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },

  icon: {
    fontSize: 28,
    marginBottom: 8,
  },

  title: {
    fontSize: 13,
    fontWeight: "600",
  },
});
