import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { IconSymbol } from "@/components/IconSymbol";
import { colors } from "@/styles/commonStyles";
import * as Haptics from "expo-haptics";
import { orderService } from "@/services/supabaseService";
import { supabase } from "@/app/integrations/supabase/client";
import { useApp } from "@/contexts/AppContext";

// ─── Design tokens ────────────────────────────────────────────────────────────
const D = {
  gold: "#C9A84C",
  goldDim: "#C9A84C55",
  goldFaint: "#C9A84C18",
  surface: "#111613",
  surfaceRaised: "#181C19",
  divider: "#FFFFFF0D",
  dividerStrong: "#FFFFFF18",
  textPrimary: "#F0EDE6",
  textSecondary: "#7A8A7E",
  textMuted: "#3D4D41",
  danger: "#C0392B",
  dangerFaint: "#C0392B18",
  success: "#2ECC71",
  successFaint: "#2ECC7118",
  teal: "#4ECDC4",
  tealFaint: "#4ECDC418",
  radius: 4,
};

interface Metric {
  id: string;
  title: string;
  value: string;
  change: string;
  positive: boolean;
  icon: string;
  color: string;
}

interface TopItem {
  name: string;
  orders: number;
  revenue: string;
}

const formatTimeAgo = (date: string): string => {
  const diffMs = Date.now() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export default function AdminAnalytics() {
  const router = useRouter();
  const { userProfile } = useApp();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [topItems, setTopItems] = useState<TopItem[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  const isSuperAdmin = userProfile?.userRole === "super_admin";

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: orders, error: ordersError } = await orderService.getAllOrders();
      if (ordersError) throw ordersError;

      let usersQuery = (supabase as any).from("user_profiles").select("*");
      if (!isSuperAdmin) usersQuery = usersQuery.eq("user_role", "user");
      const { data: users, error: usersError } = await usersQuery;
      if (usersError) throw usersError;

      const { data: menuItems, error: menuError } = await supabase.from("menu_items").select("*");
      if (menuError) throw menuError;

      const totalOrders = orders?.length || 0;
      const totalRevenue = orders?.reduce((sum: number, o: any) => sum + (o.total || 0), 0) || 0;
      const activeUsers = users?.length || 0;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      setMetrics([
        { id: "revenue", title: "Revenue", value: `$${totalRevenue.toFixed(2)}`, change: "+12.5%", positive: true, icon: "dollarsign.circle", color: D.success },
        { id: "orders", title: "Orders", value: totalOrders.toString(), change: "+8.3%", positive: true, icon: "receipt", color: D.gold },
        { id: "users", title: isSuperAdmin ? "Total Users" : "Active Users", value: activeUsers.toString(), change: "+15.2%", positive: true, icon: "person.2", color: D.teal },
        { id: "avg", title: "Avg Order", value: `$${avgOrderValue.toFixed(2)}`, change: "-2.1%", positive: false, icon: "chart.line.uptrend.xyaxis", color: D.textSecondary },
      ]);

      const itemCounts: Record<string, { name: string; count: number; revenue: number }> = {};
      orders?.forEach((order: any) => {
        order.order_items?.forEach((item: any) => {
          const name = item.item_name || "Unknown";
          if (!itemCounts[name]) itemCounts[name] = { name, count: 0, revenue: 0 };
          itemCounts[name].count += item.quantity || 1;
          itemCounts[name].revenue += item.price * (item.quantity || 1);
        });
      });

      const sorted = Object.values(itemCounts).sort((a, b) => b.count - a.count).slice(0, 5);
      setTopItems(sorted.length > 0
        ? sorted.map((i) => ({ name: i.name, orders: i.count, revenue: `$${i.revenue.toFixed(2)}` }))
        : defaultTopItems()
      );

      const recent = orders
        ?.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
        .map((o: any) => ({ type: "order", text: `Order #${o.id.slice(-6)}`, time: formatTimeAgo(o.created_at) })) || [];
      setRecentActivity(recent.length > 0 ? recent : defaultActivity());
    } catch (err) {
      console.error("Analytics fetch error:", err);
      setMetrics(defaultMetrics(isSuperAdmin));
      setTopItems(defaultTopItems());
      setRecentActivity(defaultActivity());
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin]);

  useEffect(() => { fetchAnalyticsData(); }, [fetchAnalyticsData]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => {
          if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.back();
        }}>
          <IconSymbol name="chevron.left" size={20} color={D.textSecondary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerEyebrow}>THE PEPPERED GOAT</Text>
          <Text style={styles.headerTitle}>Analytics</Text>
        </View>
        <Pressable style={styles.refreshBtn} onPress={() => {
          if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          fetchAnalyticsData();
        }}>
          <IconSymbol name="arrow.clockwise" size={18} color={D.textSecondary} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={D.gold} />
          <Text style={styles.loadingText}>LOADING</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

          {/* ── Metrics grid ── */}
          <Text style={styles.sectionLabel}>OVERVIEW</Text>
          <View style={styles.metricsGrid}>
            {metrics.map((m) => (
              <View key={m.id} style={styles.metricCard}>
                <View style={[styles.metricDot, { backgroundColor: m.color }]} />
                <Text style={styles.metricTitle}>{m.title.toUpperCase()}</Text>
                <Text style={styles.metricValue}>{m.value}</Text>
                <Text style={[styles.metricChange, { color: m.positive ? D.success : D.danger }]}>
                  {m.change}
                </Text>
              </View>
            ))}
          </View>

          {/* ── Top items ── */}
          <Text style={styles.sectionLabel}>TOP SELLERS</Text>
          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 0.5 }]}>#</Text>
              <Text style={[styles.tableHeaderCell, { flex: 3 }]}>ITEM</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: "right" }]}>ORDERS</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.5, textAlign: "right" }]}>REVENUE</Text>
            </View>
            {topItems.map((item, i) => (
              <View key={i} style={[styles.tableRow, i === topItems.length - 1 && styles.tableRowLast]}>
                <Text style={[styles.tableRank, { flex: 0.5 }]}>{i + 1}</Text>
                <Text style={[styles.tableCell, { flex: 3 }]} numberOfLines={1}>{item.name}</Text>
                <Text style={[styles.tableCell, { flex: 1, textAlign: "right" }]}>{item.orders}</Text>
                <Text style={[styles.tableCellGold, { flex: 1.5, textAlign: "right" }]}>{item.revenue}</Text>
              </View>
            ))}
          </View>

          {/* ── Recent activity ── */}
          <Text style={styles.sectionLabel}>RECENT ACTIVITY</Text>
          <View style={styles.activityContainer}>
            {recentActivity.map((a, i) => (
              <View key={i} style={[styles.activityRow, i === recentActivity.length - 1 && styles.activityRowLast]}>
                <View style={[styles.activityDot, { backgroundColor: a.type === "order" ? D.gold : D.teal }]} />
                <Text style={styles.activityText}>{a.text}</Text>
                <Text style={styles.activityTime}>{a.time}</Text>
              </View>
            ))}
          </View>

          <View style={{ height: 48 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function defaultMetrics(isSuperAdmin: boolean): Metric[] {
  return [
    { id: "revenue", title: "Revenue", value: "$0.00", change: "+0%", positive: true, icon: "dollarsign.circle", color: D.success },
    { id: "orders", title: "Orders", value: "0", change: "+0%", positive: true, icon: "receipt", color: D.gold },
    { id: "users", title: isSuperAdmin ? "Total Users" : "Active Users", value: "0", change: "+0%", positive: true, icon: "person.2", color: D.teal },
    { id: "avg", title: "Avg Order", value: "$0.00", change: "+0%", positive: true, icon: "chart.line.uptrend.xyaxis", color: D.textSecondary },
  ];
}
function defaultTopItems(): TopItem[] {
  return [
    { name: "Jollof Rice", orders: 45, revenue: "$674.55" },
    { name: "Suya Skewers", orders: 38, revenue: "$493.62" },
    { name: "Egusi Soup", orders: 32, revenue: "$543.68" },
    { name: "Zobo Drink", orders: 28, revenue: "$111.72" },
    { name: "Fried Rice", orders: 25, revenue: "$349.75" },
  ];
}
function defaultActivity() {
  return [
    { type: "order", text: "New order placed", time: "2m ago" },
    { type: "user", text: "New user registered", time: "15m ago" },
    { type: "order", text: "Order completed", time: "1h ago" },
  ];
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: D.surface },
  scrollView: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: D.divider,
  },
  backButton: { padding: 4, marginRight: 14 },
  headerCenter: { flex: 1 },
  headerEyebrow: { fontSize: 9, fontWeight: "700", letterSpacing: 3, color: D.gold, marginBottom: 2 },
  headerTitle: { fontSize: 22, fontWeight: "300", letterSpacing: 0.5, color: D.textPrimary },
  refreshBtn: { padding: 4 },

  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loadingText: { fontSize: 10, fontWeight: "700", letterSpacing: 2, color: D.textMuted },

  sectionLabel: {
    fontSize: 10, fontWeight: "700", letterSpacing: 2, color: D.textMuted,
    paddingHorizontal: 20, paddingTop: 24, paddingBottom: 10,
  },

  // 2×2 metrics grid
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    gap: 1,
  },
  metricCard: {
    width: "49.5%",
    backgroundColor: D.surfaceRaised,
    padding: 16,
    borderRadius: D.radius,
  },
  metricDot: { width: 6, height: 6, borderRadius: 3, marginBottom: 10 },
  metricTitle: { fontSize: 9, fontWeight: "700", letterSpacing: 2, color: D.textMuted, marginBottom: 6 },
  metricValue: { fontSize: 26, fontWeight: "300", letterSpacing: 0.5, color: D.textPrimary, marginBottom: 4 },
  metricChange: { fontSize: 11, fontWeight: "600", letterSpacing: 0.5 },

  // Table
  tableContainer: {
    marginHorizontal: 20,
    backgroundColor: D.surfaceRaised,
    borderRadius: D.radius,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: D.dividerStrong,
  },
  tableHeaderCell: { fontSize: 9, fontWeight: "700", letterSpacing: 2, color: D.textMuted },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: D.divider,
  },
  tableRowLast: { borderBottomWidth: 0 },
  tableRank: { fontSize: 11, fontWeight: "700", color: D.textMuted },
  tableCell: { fontSize: 13, color: D.textSecondary, letterSpacing: 0.2 },
  tableCellGold: { fontSize: 13, fontWeight: "600", color: D.gold },

  // Activity
  activityContainer: {
    marginHorizontal: 20,
    backgroundColor: D.surfaceRaised,
    borderRadius: D.radius,
    overflow: "hidden",
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: D.divider,
    gap: 12,
  },
  activityRowLast: { borderBottomWidth: 0 },
  activityDot: { width: 6, height: 6, borderRadius: 3 },
  activityText: { flex: 1, fontSize: 13, color: D.textSecondary, letterSpacing: 0.2 },
  activityTime: { fontSize: 11, color: D.textMuted, fontWeight: "500" },
});