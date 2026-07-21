import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";

import DateTimePicker from "@react-native-community/datetimepicker";

import { COLORS } from "@/constants/colors";
import { searchBus } from "@/services/search.service";
import { router } from "expo-router";
export default function SearchCard() {
  const today = useMemo(() => new Date(), []);

  const [source, setSource] = useState("Gurugram");
  const [destination, setDestination] = useState("Kannauj");

  const [journeyDate, setJourneyDate] = useState(today);
  
  const [showPicker, setShowPicker] = useState(false);

  const [loading, setLoading] = useState(false);

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const handleSearch = async () => {
    if (!source.trim()) {
      alert("Please enter source");
      return;
    }

    if (!destination.trim()) {
      alert("Please enter destination");
      return;
    }

    try {
      setLoading(true);

      const result = await searchBus({
        source: source.trim(),
        destination: destination.trim(),
        journey_date: formatDate(journeyDate),
      });

      console.log("SEARCH RESULT", result);

      router.push({
  pathname: "/search",
  params: {
    source: source.trim(),
    destination: destination.trim(),
    journey_date: formatDate(journeyDate),
  },
});
    } catch (error) {
      console.error(error);
      alert("Unable to search buses");
    } finally {
      setLoading(false);
    }
  };
  return (
    <View style={styles.card}>
      <Text style={styles.label}>FROM</Text>

      <TextInput
        style={styles.input}
        value={source}
        onChangeText={setSource}
        placeholder="Enter Source"
      />

      <View style={styles.divider} />

      <Text style={styles.label}>TO</Text>

      <TextInput
        style={styles.input}
        value={destination}
        onChangeText={setDestination}
        placeholder="Enter Destination"
      />

      <View style={styles.divider} />

      <Text style={styles.label}>JOURNEY DATE</Text>

      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setShowPicker(true)}
      >
        <Text style={styles.dateText}>
          {formatDate(journeyDate)}
        </Text>
      </TouchableOpacity>

      {showPicker && (
  <DateTimePicker
    value={journeyDate}
    mode="date"
   display={Platform.OS === "ios" ? "spinner" : "calendar"}
    minimumDate={today}
    maximumDate={new Date("2035-12-31")}
    onChange={(event, selectedDate) => {
      setShowPicker(false);

      if (selectedDate) {
        setJourneyDate(selectedDate);
      }
    }}
  />
)}
      <TouchableOpacity
        style={styles.button}
        onPress={handleSearch}
        disabled={loading}
      >
        {loading ? (
  <ActivityIndicator color="#FFFFFF" />
) : (
  <Text style={styles.buttonText}>
    Search Bus
  </Text>
)}
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginTop: 16,
    elevation: 4,
  },

  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
    marginBottom: 8,
  },

  input: {
    height: 52,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: "#111827",
    backgroundColor: "#FFFFFF",
  },

  divider: {
    height: 16,
  },

  dateButton: {
    height: 52,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    justifyContent: "center",
    paddingHorizontal: 14,
    backgroundColor: "#FFFFFF",
  },

  dateText: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "600",
  },

  button: {
    marginTop: 24,
    backgroundColor: COLORS.secondary,
    borderRadius: 14,
    height: 54,
    justifyContent: "center",
    alignItems: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
});
