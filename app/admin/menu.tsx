import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  TextInput,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { IconSymbol } from "@/components/IconSymbol";
import { colors } from "@/styles/commonStyles";
import { menuItems as staticMenuItems } from "@/data/menuData";
import { menuService, imageService } from "@/services/supabaseService";
import { MenuItem, MenuCategory } from "@/types";
import * as Haptics from "expo-haptics";
import ImagePicker from "@/components/ImagePicker";
import Dialog from "@/components/Dialog";
import Toast from "@/components/Toast";
import { useApp } from "@/contexts/AppContext";

// ─── Design tokens ────────────────────────────────────────────────────────────
const D = {
  gold: "#C9A84C",
  goldDim: "#C9A84C55",
  goldFaint: "#C9A84C18",
  surface: "#111613",
  surfaceRaised: "#181C19",
  divider: "#FFFFFF0D",
  textPrimary: "#F0EDE6",
  textSecondary: "#7A8A7E",
  textMuted: "#3D4D41",
  danger: "#C0392B",
  dangerFaint: "#C0392B18",
  success: "#2ECC71",
  successFaint: "#2ECC7118",
  radius: 4,
};

// ─── Spicy Level Picker ───────────────────────────────────────────────────────

function SpicyLevelPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <View style={spicyStyles.container}>
      <Text style={spicyStyles.label}>HEAT</Text>
      <View style={spicyStyles.row}>
        <Pressable
          style={[spicyStyles.noneChip, value === 0 && spicyStyles.noneChipActive]}
          onPress={() => {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onChange(0);
          }}
        >
          <Text style={[spicyStyles.noneChipText, value === 0 && spicyStyles.noneChipTextActive]}>
            NONE
          </Text>
        </Pressable>
        {[1, 2, 3, 4, 5].map((level) => (
          <Pressable
            key={level}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onChange(value === level ? 0 : level);
            }}
            style={spicyStyles.chiliButton}
          >
            <Text style={[spicyStyles.chili, level <= value && spicyStyles.chiliActive]}>
              🌶️
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const spicyStyles = StyleSheet.create({
  container: { marginBottom: 20 },
  label: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    color: D.textSecondary,
    marginBottom: 10,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  noneChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: D.radius,
    borderWidth: 1,
    borderColor: D.divider,
  },
  noneChipActive: { borderColor: D.gold, backgroundColor: D.goldFaint },
  noneChipText: { fontSize: 10, letterSpacing: 1.5, fontWeight: "700", color: D.textMuted },
  noneChipTextActive: { color: D.gold },
  chiliButton: { padding: 4 },
  chili: { fontSize: 20, opacity: 0.18 },
  chiliActive: { opacity: 1 },
});

// ─── Price Input ──────────────────────────────────────────────────────────────

function PriceInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <View style={priceStyles.wrapper}>
      <Text style={priceStyles.symbol}>$</Text>
      <TextInput
        style={priceStyles.input}
        placeholder="0.00"
        placeholderTextColor={D.textMuted}
        value={value}
        onChangeText={(text) => {
          const cleaned = text.replace(/[^0-9.]/g, "");
          const parts = cleaned.split(".");
          const safe = parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : cleaned;
          onChange(safe);
        }}
        keyboardType="decimal-pad"
        returnKeyType="done"
      />
    </View>
  );
}

const priceStyles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: D.surface,
    borderRadius: D.radius,
    borderWidth: 1,
    borderColor: D.divider,
    marginBottom: 4,
  },
  symbol: { fontSize: 16, fontWeight: "300", color: D.textSecondary, paddingLeft: 16, paddingRight: 4 },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingRight: 16,
    fontSize: 22,
    fontWeight: "300",
    letterSpacing: 0.5,
    color: D.textPrimary,
  },
});

// ─── Floating Add Button ──────────────────────────────────────────────────────

function FloatingAddButton({ active, onPress }: { active: boolean; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [fabStyles.btn, pressed && fabStyles.btnPressed]}
      onPress={onPress}
    >
      <IconSymbol name={active ? "xmark" : "plus"} size={20} color={D.surface} />
    </Pressable>
  );
}

const fabStyles = StyleSheet.create({
  btn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: D.gold,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: D.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  btnPressed: { opacity: 0.75 },
});

// ─── Field Label ──────────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: string }) {
  return <Text style={fieldLabelStyle}>{children}</Text>;
}
const fieldLabelStyle: import("react-native").TextStyle = {
  fontSize: 10,
  fontWeight: "700",
  letterSpacing: 2,
  color: D.textSecondary,
  marginBottom: 8,
  marginTop: 4,
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AdminMenuManagement() {
  const router = useRouter();
  const { userProfile } = useApp();
  const [items, setItems] = useState<MenuItem[]>(staticMenuItems);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | "All">("All");

  const scrollViewRef = useRef<ScrollView>(null);
  const scrollViewContainerRef = useRef<View>(null);
  const itemRowRefs = useRef<Record<string, View | null>>({});
  const currentScrollY = useRef(0);

  const [formData, setFormData] = useState({
    name: "", description: "", price: "", category_id: "",
    image_url: "", spicy_level: 0, tag: "",
  });

  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({
    title: "", message: "",
    buttons: [] as Array<{ text: string; onPress: () => void; style?: "default" | "destructive" | "cancel" }>,
  });
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "info">("success");

  const showDialog = (title: string, message: string, buttons: typeof dialogConfig.buttons) => {
    setDialogConfig({ title, message, buttons });
    setDialogVisible(true);
  };
  const showToast = (type: typeof toastType, message: string) => {
    setToastType(type); setToastMessage(message); setToastVisible(true);
  };
  const handleImageSelected = (path: string) => {
    const publicUrl = imageService.getPublicUrl("menu", path) || path;
    setFormData((p) => ({ ...p, image_url: publicUrl }));
    showToast("success", "Image updated");
  };

  const categoryFilterOptions = [{ id: "All", title: "All" }, ...categories];
  const resetForm = () =>
    setFormData({ name: "", description: "", price: "", category_id: categories[0]?.id ?? "", image_url: "", spicy_level: 0, tag: "" });

  const handleAddItem = () => {
    (async () => {
      if (!formData.name || !formData.price) { showToast("error", "Name and price are required"); return; }
      const payload: Omit<MenuItem, "id"> = {
        name: formData.name, description: formData.description || null,
        price: parseFloat(formData.price), category_id: formData.category_id || null,
        image_url: formData.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400",
        tag: formData.tag || null, spicy_level: formData.spicy_level > 0 ? formData.spicy_level : null,
        is_available: true, sort_order: null,
      };
      try {
        const res = await menuService.addMenuItem(payload);
        if (res.error || !res.data) throw res.error || new Error();
        const added = res.data as MenuItem | null;
        if (added) setItems((s) => [added, ...s]);
        setIsAddingItem(false); resetForm();
        showToast("success", "Item added");
      } catch { showToast("error", "Unable to add item"); }
    })();
  };

  const handleUpdateItem = (itemId: string) => {
    (async () => {
      const updates: Partial<MenuItem> = {
        name: formData.name, description: formData.description || null,
        price: parseFloat(formData.price), category_id: formData.category_id || null,
        image_url: formData.image_url || null, tag: formData.tag || null,
        spicy_level: formData.spicy_level > 0 ? formData.spicy_level : null,
      };
      try {
        const res = await menuService.updateMenuItem(itemId, updates);
        if (res.error || !res.data) throw res.error || new Error();
        setItems((prev) => prev.map((it) => (it.id === itemId ? (res.data as MenuItem) : it)));
        setEditingItemId(null); resetForm();
        showToast("success", "Item updated");
      } catch { showToast("error", "Unable to update item"); }
    })();
  };

  const handleToggleAvailability = (item: MenuItem) => {
    const newValue = !(item.is_available ?? true);
    (async () => {
      try {
        const res = await menuService.updateMenuItem(item.id, { is_available: newValue });
        if (res.error || !res.data) throw res.error || new Error();
        setItems((prev) => prev.map((it) => (it.id === item.id ? (res.data as MenuItem) : it)));
        showToast("success", newValue ? "Now available" : "Marked unavailable");
      } catch { showToast("error", "Unable to update availability"); }
    })();
  };

  const handleDeleteItem = (itemId: string) => {
    showDialog("Delete item", "This cannot be undone.", [
      { text: "Cancel", onPress: () => {}, style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try {
            const res = await menuService.deleteMenuItem(itemId);
            if (res.error) throw res.error;
            setItems((prev) => prev.filter((item) => item.id !== itemId));
            showToast("success", "Item deleted");
          } catch { showToast("error", "Unable to delete item"); }
        },
      },
    ]);
  };

  const handleEditItem = (item: MenuItem) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (editingItemId === item.id) { setEditingItemId(null); resetForm(); return; }

    setEditingItemId(item.id);
    setFormData({
      name: item.name, description: item.description ?? "",
      price: item.price.toString(), category_id: item.category_id ?? "",
      image_url: item.image_url ?? "", tag: item.tag ?? "",
      spicy_level: item.spicy_level ?? 0,
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const rowRef = itemRowRefs.current[item.id];
        if (!rowRef || !scrollViewContainerRef.current) return;
        scrollViewContainerRef.current.measure((_sx, _sy, _sw, _sh, _spx, scrollViewScreenY) => {
          rowRef.measure((_x, _y, _w, _h, _px, itemScreenY) => {
            const targetScrollY = currentScrollY.current + (itemScreenY - scrollViewScreenY);
            scrollViewRef.current?.scrollTo({ y: targetScrollY, animated: true });
          });
        });
      });
    });
  };

  const getCategoryTitle = (categoryId: string | null) =>
    !categoryId ? "—" : categories.find((c) => c.id === categoryId)?.title ?? categoryId;

  const filteredItems = (selectedCategoryId === "All" ? items : items.filter((i) => i.category_id === selectedCategoryId))
    .slice()
    .sort((a, b) => Number(b.is_available ?? true) - Number(a.is_available ?? true));

  React.useEffect(() => {
    (async () => {
      try {
        const [itemsRes, categoriesRes] = await Promise.all([menuService.getMenuItems(), menuService.getMenuCategories()]);
        if (itemsRes.error) throw itemsRes.error;
        if (categoriesRes.error) throw categoriesRes.error;
        const sorted = ((categoriesRes.data as MenuCategory[]) || []).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
        setItems(itemsRes.data || []);
        setCategories(sorted);
        if (sorted.length > 0) setFormData((p) => ({ ...p, category_id: sorted[0].id }));
      } catch (err) { console.error("Failed to load menu data", err); }
    })();
  }, []);

  // ── Form ──────────────────────────────────────────────────────────────────

  const renderEditForm = (itemId?: string) => (
    <View style={styles.formContainer}>
      <View style={styles.formAccentLine} />

      <Text style={styles.formTitle}>{itemId ? "EDIT ITEM" : "NEW ITEM"}</Text>

      <View style={styles.formSection}>
        <FieldLabel>ITEM NAME</FieldLabel>
        <TextInput
          style={styles.input}
          placeholder="e.g. Jollof Rice"
          placeholderTextColor={D.textMuted}
          value={formData.name}
          onChangeText={(t) => setFormData((p) => ({ ...p, name: t }))}
        />

        <FieldLabel>DESCRIPTION</FieldLabel>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Brief description of the dish…"
          placeholderTextColor={D.textMuted}
          value={formData.description}
          onChangeText={(t) => setFormData((p) => ({ ...p, description: t }))}
          multiline
          numberOfLines={3}
        />

        <FieldLabel>TAG</FieldLabel>
        <TextInput
          style={styles.input}
          placeholder="e.g. Chef's Special, New"
          placeholderTextColor={D.textMuted}
          value={formData.tag}
          onChangeText={(t) => setFormData((p) => ({ ...p, tag: t }))}
        />
      </View>

      <View style={styles.formDivider} />

      <View style={styles.formSection}>
        <FieldLabel>PRICE</FieldLabel>
        <PriceInput value={formData.price} onChange={(v) => setFormData((p) => ({ ...p, price: v }))} />
      </View>

      <View style={styles.formDivider} />

      <View style={styles.formSection}>
        <SpicyLevelPicker
          value={formData.spicy_level}
          onChange={(level) => setFormData((p) => ({ ...p, spicy_level: level }))}
        />
      </View>

      <View style={styles.formDivider} />

      <View style={styles.formSection}>
        <FieldLabel>CATEGORY</FieldLabel>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
          {categories.map((cat) => (
            <Pressable
              key={cat.id}
              style={[styles.categoryChip, formData.category_id === cat.id && styles.categoryChipActive]}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFormData((p) => ({ ...p, category_id: cat.id }));
              }}
            >
              <Text style={[styles.categoryChipText, formData.category_id === cat.id && styles.categoryChipTextActive]}>
                {cat.title.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={styles.formDivider} />

      <View style={styles.formSection}>
        <FieldLabel>PHOTO</FieldLabel>
        {formData.image_url ? (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: formData.image_url }} style={styles.imagePreview} resizeMode="cover" />
            <Pressable
              style={styles.removeImageButton}
              onPress={() => { setFormData((p) => ({ ...p, image_url: "" })); showToast("info", "Image removed"); }}
            >
              <IconSymbol name="xmark" size={14} color="#FFFFFF" />
            </Pressable>
          </View>
        ) : null}
        <ImagePicker currentImageUrl={formData.image_url} onImageSelected={handleImageSelected} bucket="menu" folder="items" label="" />
      </View>

      <View style={styles.formButtons}>
        <Pressable
          style={styles.cancelButton}
          onPress={() => {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (itemId) { setEditingItemId(null); } else { setIsAddingItem(false); }
            resetForm();
          }}
        >
          <Text style={styles.cancelButtonText}>CANCEL</Text>
        </Pressable>
        <Pressable
          style={styles.saveButton}
          onPress={() => (itemId ? handleUpdateItem(itemId) : handleAddItem())}
        >
          <Text style={styles.saveButtonText}>{itemId ? "SAVE CHANGES" : "ADD ITEM"}</Text>
        </Pressable>
      </View>
    </View>
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => {
          if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.back();
        }}>
          <IconSymbol name="chevron.left" size={20} color={D.textSecondary} />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.headerEyebrow}>THE PEPPERED GOAT</Text>
          <Text style={styles.headerTitle}>Menu</Text>
        </View>

        <FloatingAddButton active={isAddingItem} onPress={() => {
          if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setIsAddingItem(!isAddingItem);
          setEditingItemId(null);
          resetForm();
        }} />
      </View>

      <View ref={scrollViewContainerRef} style={styles.scrollView}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={(e) => { currentScrollY.current = e.nativeEvent.contentOffset.y; }}
        >
          {isAddingItem && renderEditForm()}

          {/* ── Category filter ── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryFilter}
            contentContainerStyle={styles.categoryFilterContent}
          >
            {categoryFilterOptions.map((cat) => (
              <Pressable
                key={cat.id}
                style={[styles.filterChip, selectedCategoryId === cat.id && styles.filterChipActive]}
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedCategoryId(cat.id);
                }}
              >
                <Text style={[styles.filterChipText, selectedCategoryId === cat.id && styles.filterChipTextActive]}>
                  {cat.title.toUpperCase()}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={styles.itemCount}>{filteredItems.length} ITEMS</Text>

          {/* ── Items ── */}
          <View style={styles.itemsContainer}>
            {filteredItems.map((item) => {
              const isEditing = editingItemId === item.id;
              const isAvailable = item.is_available ?? true;
              return (
                <React.Fragment key={item.id}>
                  <View
                    ref={(node) => { itemRowRefs.current[item.id] = node; }}
                    style={styles.menuItemWrapper}
                  >
                    <View style={[styles.menuItem, isEditing && styles.menuItemEditing]}>
                      {isEditing && <View style={styles.editingAccentLine} />}

                      {item.image_url ? (
                        <Image
                          source={{ uri: item.image_url }}
                          style={[styles.itemImage, !isAvailable && styles.itemImageDimmed]}
                        />
                      ) : (
                        <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
                          <IconSymbol name="photo" size={22} color={D.textMuted} />
                        </View>
                      )}

                      <View style={styles.itemContent}>
                        <View style={styles.itemNameRow}>
                          <Text style={[styles.itemName, !isAvailable && styles.itemNameDimmed]} numberOfLines={1}>
                            {item.name}
                          </Text>
                          {item.tag ? (
                            <View style={styles.tagBadge}>
                              <Text style={styles.tagBadgeText}>{item.tag.toUpperCase()}</Text>
                            </View>
                          ) : null}
                        </View>

                        {item.description ? (
                          <Text style={styles.itemDescription} numberOfLines={1}>{item.description}</Text>
                        ) : null}

                        <View style={styles.itemMeta}>
                          <Text style={styles.itemPrice}>
                            ${item.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </Text>
                          {item.spicy_level != null && item.spicy_level > 0 ? (
                            <Text style={styles.itemSpicy}>{"🌶️".repeat(item.spicy_level)}</Text>
                          ) : null}
                          <Text style={styles.itemCategory}>{getCategoryTitle(item.category_id)}</Text>
                        </View>
                      </View>

                      <View style={styles.itemActions}>
                        <Pressable
                          style={[styles.actionBtn, isAvailable ? styles.actionBtnAvailOn : styles.actionBtnAvailOff]}
                          onPress={() => handleToggleAvailability(item)}
                        >
                          <IconSymbol
                            name={isAvailable ? "eye.fill" : "eye.slash.fill"}
                            size={13}
                            color={isAvailable ? D.success : D.textMuted}
                          />
                        </Pressable>

                        <Pressable
                          style={[styles.actionBtn, isEditing && styles.actionBtnEditActive]}
                          onPress={() => handleEditItem(item)}
                        >
                          <IconSymbol
                            name={isEditing ? "xmark" : "pencil"}
                            size={13}
                            color={isEditing ? D.gold : D.textSecondary}
                          />
                        </Pressable>

                        <Pressable style={styles.actionBtn} onPress={() => handleDeleteItem(item.id)}>
                          <IconSymbol name="trash.fill" size={13} color={D.danger} />
                        </Pressable>
                      </View>
                    </View>

                    {isEditing && renderEditForm(item.id)}
                  </View>
                </React.Fragment>
              );
            })}
          </View>

          <View style={{ height: 48 }} />
        </ScrollView>
      </View>

      <Toast
        visible={toastVisible} message={toastMessage} type={toastType}
        onHide={() => setToastVisible(false)}
        currentColors={{ text: colors.text, background: colors.background, primary: colors.primary }}
      />
      <Dialog
        visible={dialogVisible} title={dialogConfig.title} message={dialogConfig.message}
        buttons={dialogConfig.buttons} onHide={() => setDialogVisible(false)}
        currentColors={{ text: colors.text, card: colors.card, primary: colors.primary, textSecondary: colors.textSecondary, background: colors.background }}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: D.surface },
  scrollView: { flex: 1 },

  // Header
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
  headerEyebrow: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 3,
    color: D.gold,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "300",
    letterSpacing: 0.5,
    color: D.textPrimary,
  },

  // Category filter
  categoryFilter: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 4 },
  categoryFilterContent: { gap: 8 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: D.radius,
    borderWidth: 1,
    borderColor: D.divider,
  },
  filterChipActive: { borderColor: D.gold, backgroundColor: D.goldFaint },
  filterChipText: { fontSize: 10, fontWeight: "700", letterSpacing: 1.5, color: D.textSecondary },
  filterChipTextActive: { color: D.gold },

  // Count
  itemCount: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    color: D.textMuted,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },

  // Items
  itemsContainer: { paddingHorizontal: 20, gap: 1 },
  menuItemWrapper: {},

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: D.surfaceRaised,
    paddingVertical: 14,
    paddingRight: 10,
    borderBottomWidth: 1,
    borderBottomColor: D.divider,
    overflow: "hidden",
  },
  menuItemEditing: {
    backgroundColor: "#1A1F1B",
    borderBottomColor: "transparent",
  },
  editingAccentLine: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: D.gold,
  },

  itemImage: {
    width: 52,
    height: 52,
    borderRadius: D.radius,
    marginLeft: 12,
    marginRight: 14,
  },
  itemImageDimmed: { opacity: 0.3 },
  itemImagePlaceholder: {
    backgroundColor: D.surface,
    justifyContent: "center",
    alignItems: "center",
  },

  itemContent: { flex: 1, gap: 4 },
  itemNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  itemName: {
    fontSize: 15,
    fontWeight: "500",
    letterSpacing: 0.2,
    color: D.textPrimary,
    flex: 1,
  },
  itemNameDimmed: { color: D.textMuted },

  tagBadge: {
    borderWidth: 1,
    borderColor: D.goldDim,
    borderRadius: 2,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  tagBadgeText: { fontSize: 8, fontWeight: "700", letterSpacing: 1.5, color: D.gold },

  itemDescription: { fontSize: 12, color: D.textSecondary, lineHeight: 16 },

  itemMeta: { flexDirection: "row", alignItems: "center", gap: 10 },
  itemPrice: { fontSize: 14, fontWeight: "600", letterSpacing: 0.3, color: D.textPrimary },
  itemSpicy: { fontSize: 11 },
  itemCategory: { fontSize: 10, letterSpacing: 1, color: D.textMuted, fontWeight: "600" },

  // Action buttons — compact column
  itemActions: { gap: 5, alignItems: "center", paddingLeft: 8 },
  actionBtn: {
    width: 30,
    height: 30,
    borderRadius: D.radius,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: D.divider,
  },
  actionBtnAvailOn: { borderColor: D.successFaint, backgroundColor: D.successFaint },
  actionBtnAvailOff: {},
  actionBtnEditActive: { borderColor: D.goldDim, backgroundColor: D.goldFaint },

  // Form
  formContainer: {
    backgroundColor: "#1A1F1B",
    borderBottomWidth: 1,
    borderBottomColor: D.divider,
    overflow: "hidden",
  },
  formAccentLine: { height: 1, backgroundColor: D.gold, marginBottom: 24 },
  formTitle: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 3,
    color: D.gold,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  formSection: { paddingHorizontal: 20, paddingBottom: 16 },
  formDivider: { height: 1, backgroundColor: D.divider, marginBottom: 20 },

  input: {
    backgroundColor: D.surface,
    borderRadius: D.radius,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    letterSpacing: 0.2,
    color: D.textPrimary,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: D.divider,
  },
  textArea: { height: 80, textAlignVertical: "top" },

  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: D.radius,
    borderWidth: 1,
    borderColor: D.divider,
    marginRight: 8,
  },
  categoryChipActive: { borderColor: D.gold, backgroundColor: D.goldFaint },
  categoryChipText: { fontSize: 10, fontWeight: "700", letterSpacing: 1.5, color: D.textSecondary },
  categoryChipTextActive: { color: D.gold },

  imagePreviewContainer: {
    position: "relative",
    marginBottom: 14,
    borderRadius: D.radius,
    overflow: "hidden",
  },
  imagePreview: { width: "100%", height: 180, backgroundColor: D.surface },
  removeImageButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 14,
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
  },

  formButtons: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 4,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: D.radius,
    alignItems: "center",
    borderWidth: 1,
    borderColor: D.divider,
  },
  cancelButtonText: { fontSize: 11, fontWeight: "700", letterSpacing: 2, color: D.textSecondary },
  saveButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: D.radius,
    alignItems: "center",
    backgroundColor: D.gold,
  },
  saveButtonText: { fontSize: 11, fontWeight: "700", letterSpacing: 2, color: D.surface },
});