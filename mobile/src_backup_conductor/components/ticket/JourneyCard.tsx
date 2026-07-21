import React from "react";
import { View, Text, StyleSheet } from "react-native";

type Props = {
  booking: any;
};

export default function JourneyCard({ booking }: Props) {
  const formatDateTime = (date: string) => {
    if (!date) return "--";

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDuration = () => {
    if (!booking.departure_time || !booking.arrival_time) {
      return "--";
    }

    const start = new Date(booking.departure_time);
    const end = new Date(booking.arrival_time);

    const diff = end.getTime() - start.getTime();

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(
      (diff % (1000 * 60 * 60)) / (1000 * 60)
    );

    return `${hours}h ${minutes}m`;
  };

  return (
    <View style={styles.card}>

      <Text style={styles.heading}>
        🛣 Journey Timeline
      </Text>

      <View style={styles.row}>

        <View style={styles.timeline}>
          <View style={styles.greenDot} />
          <View style={styles.line} />
          <View style={styles.redDot} />
        </View>

        <View style={styles.content}>

          <Text style={styles.city}>
            {booking.source || "Source"}
          </Text>

          <Text style={styles.time}>
            Departure{"\n"}
            {formatDateTime(booking.departure_time)}
          </Text>

          <Text style={styles.duration}>
            ⏱ Duration : {getDuration()}
          </Text>

          <Text style={styles.city}>
            {booking.destination || "Destination"}
          </Text>

          <Text style={styles.time}>
            Arrival{"\n"}
            {formatDateTime(booking.arrival_time)}
          </Text>

          <View style={styles.busType}>
            <Text style={styles.busTypeText}>
              🚌 AC Sleeper
            </Text>
          </View>

        </View>

      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },

  heading: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0B3D91",
    marginBottom: 20,
  },

  row: {
    flexDirection: "row",
  },

  timeline: {
    width: 40,
    alignItems: "center",
  },

  greenDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#16A34A",
  },

  line: {
    width: 3,
    height: 80,
    backgroundColor: "#CBD5E1",
  },

  redDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#DC2626",
  },

  content: {
    flex: 1,
    marginLeft: 15,
  },

  city: {
    fontSize: 18,
    fontWeight: "700",
  },

  time: {
    color: "#6B7280",
    marginTop: 5,
    marginBottom: 18,
  },

  duration: {
    color: "#0B3D91",
    fontWeight: "700",
    marginBottom: 18,
  },

  busType: {
    marginTop: 10,
    backgroundColor: "#EAF2FF",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },

  busTypeText: {
    color: "#0B3D91",
    fontWeight: "700",
    fontSize: 13,
  },
});

