import React, { useEffect, useState } from "react";
import { router } from "expo-router";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

import { useLocalSearchParams } from "expo-router";

import { searchBus } from "@/services/search.service";

type Bus = {
  schedule_id: number;
  bus_name: string;
  bus_number: string;
  departure_time: string;
  arrival_time: string;
  available_seats: number;
  total_seats: number;
};

export default function SearchScreen() {
  const { source, destination, journey_date } =
    useLocalSearchParams<{
      source: string;
      destination: string;
      journey_date: string;
    }>();

  const [loading, setLoading] = useState(true);
  const [buses, setBuses] = useState<Bus[]>([]);

  useEffect(() => {
    loadBuses();
  }, []);

  async function loadBuses() {
    try {
      setLoading(true);

      const result = await searchBus({
        source: String(source),
        destination: String(destination),
        journey_date: String(journey_date),
      });
      console.log("FIRST BUS =", result.buses?.[0]);
      setBuses(result.buses || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  }
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loading}>Loading buses...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={buses}
      keyExtractor={(item) => item.schedule_id.toString()}
      contentContainerStyle={styles.container}
      ListEmptyComponent={
        <Text style={styles.empty}>
          No buses found.
        </Text>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.busName}>
            {item.bus_name}
          </Text>

          <Text style={styles.busNo}>
            {item.bus_number}
          </Text>

          <Text>
            Departure : {item.departure_time}
          </Text>

          <Text>
            Arrival : {item.arrival_time}
          </Text>

          <Text>
            Available Seats : {item.available_seats}
          </Text>
         
          <TouchableOpacity
  style={styles.button}
  onPress={() =>
  router.push({
    pathname: "/booking",
    params: {
      schedule_id: item.schedule_id.toString(),
    },
  })
}
>
  <Text style={styles.buttonText}>
    Book Now
  </Text>
</TouchableOpacity>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loading: {
    marginTop: 10,
    fontSize: 16,
  },

  empty: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 18,
  },

  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 3,
  },

  busName: {
    fontSize: 20,
    fontWeight: "700",
  },

  busNo: {
    color: "#666",
    marginBottom: 10,
  },

  button: {
    marginTop: 15,
    backgroundColor: "#2563EB",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});

