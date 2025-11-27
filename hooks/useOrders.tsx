
import { useEffect, useState, useCallback } from "react";
import { orderService } from "@/services/supabaseService";
import { Alert } from "react-native";
import { Order, CartItem } from "@/types";

export interface OrderWithItems extends Order {
  items: CartItem[];
}

const allowedTransitions: Record<string, string[]> = {
  pending: ["preparing"],
  preparing: ["ready"],
  ready: ["completed"],
  completed: [],
};

export function useOrders() {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);

  const transformOrder = (order: any): OrderWithItems => ({
    id: order.id,
    orderNumber: order.order_number || 0,
    items: (order.order_items || []).map((item: any) => ({
      id: item.id || item.item_id || "",
      name: item.item_name || item.name || "",
      description: item.description || "",
      price: item.price || 0,
      quantity: item.quantity || 1,
      category: item.category || "",
      image: item.image || "",
    })),
    total: order.total || 0,
    pointsEarned: order.points_earned || 0,
    date: order.created_at || new Date().toISOString(),
    status: order.status || "pending",
    deliveryAddress: order.delivery_address,
    pickupNotes: order.pickup_notes,
  });

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await orderService.getAllOrders();
      if (res.error) throw res.error;
      setOrders((res.data || []).map(transformOrder));
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStatus = async (orderId: string, newStatus: Order["status"]) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    // Enforce valid workflow transitions
    if (!allowedTransitions[order.status].includes(newStatus)) {
      Alert.alert(
        "Not Allowed",
        "You can't move this order to that status from its current state."
      );
      return;
    }

    // Optimistic update
    const previousOrders = [...orders];
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, status: newStatus } : o
      )
    );

    try {
      const res = await orderService.updateOrderStatus(orderId, newStatus);
      if (res.error || !res.data) throw res.error || new Error("Update failed");

      // Force refresh from backend for data integrity
      await fetchOrders();
    } catch (error) {
      console.error("Failed status update:", error);
      Alert.alert("Error", "Status update failed. Rolling back.");
      setOrders(previousOrders); // rollback
    }
  };

  // Poll every 15 seconds
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 15000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const filteredOrders =
    status === "all"
      ? orders
      : orders.filter((o) => o.status === status);

  return {
    orders: filteredOrders,
    setStatus,
    updateStatus,
    loading,
    refresh: fetchOrders,
  };
}
