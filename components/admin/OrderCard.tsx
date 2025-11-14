import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { colors } from "@/styles/commonStyles";
import { OrderWithItems } from "@/hooks/useOrders";

const statusColors: Record<string, string> = {
  pending: "#FFA500",
  preparing: "#4ECDC4",
  ready: "#95E1D3",
  completed: "#4CAF50",
};

export function OrderCard({
  order,
  onStatusChange,
}: {
  order: OrderWithItems;
  onStatusChange: (status: string) => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.orderId}>Order #{order.id}</Text>
          <Text style={styles.date}>
            {new Date(order.date).toLocaleString()}
          </Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            { backgroundColor: statusColors[order.status] + "20" },
          ]}
        >
          <Text style={[styles.statusText, { color: statusColors[order.status] }]}>
            {order.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.items}>
        {order.items.map((item, idx) => (
          <View key={idx} style={styles.itemRow}>
            <Text style={styles.qty}>{item.quantity}x</Text>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.amount}>
              ${(item.price * item.quantity).toFixed(2)}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total:</Text>
        <Text style={styles.totalAmount}>${order.total.toFixed(2)}</Text>
      </View>

      <View style={styles.actions}>
        <Text style={styles.actionLabel}>Update Status</Text>

        <View style={styles.buttons}>
          {(["pending", "preparing", "ready", "completed"] as const).map(
            (status) => (
              <Pressable
                key={status}
                style={[
                  styles.button,
                  order.status === status && {
                    backgroundColor: statusColors[status] + "20",
                    borderColor: statusColors[status],
                  },
                ]}
                onPress={() => onStatusChange(status)}
              >
                <Text
                  style={[
                    styles.buttonText,
                    order.status === status && {
                      color: statusColors[status],
                    },
                  ]}
                >
                  {status}
                </Text>
              </Pressable>
            )
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  orderId: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  date: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  items: { marginTop: 10, gap: 8 },
  itemRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  qty: { width: 30, fontWeight: "600", color: colors.text },
  name: { flex: 1, color: colors.text },
  amount: { fontWeight: "600", color: colors.text },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 12,
    paddingTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  totalLabel: { fontWeight: "600", color: colors.text },
  totalAmount: { fontSize: 18, fontWeight: "700", color: colors.primary },
  actions: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  actionLabel: { fontWeight: "600", color: colors.text, marginBottom: 8 },
  buttons: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 20,
    borderColor: colors.border,
  },
  buttonText: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: "capitalize",
  },
});
