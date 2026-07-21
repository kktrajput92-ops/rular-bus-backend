import { SafeAreaView, StyleSheet } from "react-native";
import { COLORS } from "@/constants/colors";
import Header from "@/components/home/Header";
import SearchCard from "@/components/home/SearchCard";
import OfferBanner from "@/components/home/OfferBanner";
import PopularRoutes from "@/components/home/PopularRoutes";
import StatsCards from "@/components/home/StatsCards";
import QuickActions from "@/components/home/QuickActions";
export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <StatsCards />
<SearchCard />
<OfferBanner />
<QuickActions />
<PopularRoutes />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
    padding: 20,
  },
});
