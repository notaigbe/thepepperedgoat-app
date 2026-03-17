import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  TextInput,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { IconSymbol } from "@/components/IconSymbol";
import { colors } from "@/styles/commonStyles";
import { menuItems as staticMenuItems } from "@/data/menuData";
import { menuService } from "@/services/supabaseService";
import { MenuItem, MenuCategory } from "@/types";
import * as Haptics from "expo-haptics";
import ImagePicker from "@/components/ImagePicker";
import Dialog from "@/components/Dialog";
import Toast from "@/components/Toast";
import { useApp } from "@/contexts/AppContext";


export default function AdminMenuManagement() {
  const router = useRouter();
  const { userProfile } = useApp();
  const [items, setItems] = useState<MenuItem[]>(staticMenuItems);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | "All">("All");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category_id: "",
    image_url: "",
    spicy_level: "",
    tag: "",
  });

  // Dialog state
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({
    title: '',
    message: '',
    buttons: [] as Array<{ text: string; onPress: () => void; style?: 'default' | 'destructive' | 'cancel' }>
  });

  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
  const [uploadingImage, setUploadingImage] = useState(false);

  const showDialog = (title: string, message: string, buttons: Array<{ text: string; onPress: () => void; style?: 'default' | 'destructive' | 'cancel' }>) => {
    setDialogConfig({ title, message, buttons });
    setDialogVisible(true);
  };

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToastType(type);
    setToastMessage(message);
    setToastVisible(true);
  };

  const handleImageSelected = (imageUrl: string) => {
    setFormData({ ...formData, image_url: imageUrl });
    showToast('success', 'Image uploaded successfully');
  };

  // Check user role - only super_admin should see analytics/order totals
  const isSuperAdmin = userProfile?.userRole === 'super_admin';

  const categoryFilterOptions = [
    { id: "All", title: "All" },
    ...categories,
  ];

  const handleAddItem = () => {
    console.log("Adding new menu item");
    (async () => {
      if (!formData.name || !formData.price) {
        showToast('error', 'Please fill in all required fields');
        return;
      }

      const payload: Omit<MenuItem, "id"> = {
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        category_id: formData.category_id || null,
        image_url:
          formData.image_url ||
          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400",
        tag: formData.tag || null,
        spicy_level: formData.spicy_level ? parseInt(formData.spicy_level) : null,
        is_available: true,
        sort_order: null,
      };

      try {
        const res = await menuService.addMenuItem(payload);
        if (res.error || !res.data) throw res.error || new Error("Add failed");
        const added = res.data as MenuItem | null;
        if (added) setItems((s) => [added, ...s]);
        setIsAddingItem(false);
        resetForm();
        showToast('success', 'Menu item added successfully');
      } catch (err) {
        console.error("Add menu item failed", err);
        showToast('error', 'Unable to add menu item');
      }
    })();
  };

  const handleUpdateItem = (itemId: string) => {
    console.log("Updating menu item");
    (async () => {
      const updates: Partial<MenuItem> = {
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        category_id: formData.category_id || null,
        image_url: formData.image_url || null,
        tag: formData.tag || null,
        spicy_level: formData.spicy_level ? parseInt(formData.spicy_level) : null,
      };

      try {
        const res = await menuService.updateMenuItem(itemId, updates);
        if (res.error || !res.data)
          throw res.error || new Error("Update failed");
        setItems((prev) =>
          prev.map((it) =>
            it.id === itemId ? (res.data as MenuItem) : it
          )
        );
        setEditingItemId(null);
        resetForm();
        showToast('success', 'Menu item updated successfully');
      } catch (err) {
        console.error("Update menu item failed", err);
        showToast('error', 'Unable to update menu item');
      }
    })();
  };

  const handleToggleAvailability = (item: MenuItem) => {
    const newValue = !(item.is_available ?? true);
    (async () => {
      try {
        const res = await menuService.updateMenuItem(item.id, { is_available: newValue });
        if (res.error || !res.data) throw res.error || new Error("Update failed");
        setItems((prev) =>
          prev.map((it) => (it.id === item.id ? (res.data as MenuItem) : it))
        );
        showToast('success', newValue ? `${item.name} is now available` : `${item.name} marked unavailable`);
      } catch (err) {
        console.error("Toggle availability failed", err);
        showToast('error', 'Unable to update availability');
      }
    })();
  };

  const handleDeleteItem = (itemId: string) => {
    console.log("Deleting menu item:", itemId);
    showDialog(
      "Confirm Delete",
      "Are you sure you want to delete this item?",
      [
        { text: "Cancel", onPress: () => {}, style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await menuService.deleteMenuItem(itemId);
              if (res.error) throw res.error;
              setItems((prev) => prev.filter((item) => item.id !== itemId));
              showToast('success', 'Menu item deleted');
            } catch (err) {
              console.error("Delete failed", err);
              showToast('error', 'Unable to delete menu item');
            }
          },
        },
      ]
    );
  };

  const handleEditItem = (item: MenuItem) => {
    console.log("Editing menu item:", item.id);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setEditingItemId(item.id);
    setFormData({
      name: item.name,
      description: item.description ?? "",
      price: item.price.toString(),
      category_id: item.category_id ?? "",
      image_url: item.image_url ?? "",
      tag: item.tag ?? "",
      spicy_level: item.spicy_level != null ? item.spicy_level.toString() : "",
    });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      category_id: categories[0]?.id ?? "",
      image_url: "",
      tag: "",
      spicy_level: "",
    });
  };

  const getCategoryTitle = (categoryId: string | null) => {
    if (!categoryId) return "Uncategorized";
    return categories.find((c) => c.id === categoryId)?.title ?? categoryId;
  };

  const filteredItems =
    selectedCategoryId === "All"
      ? items
      : items.filter((item) => item.category_id === selectedCategoryId);

  React.useEffect(() => {
    (async () => {
      try {
        const [itemsRes, categoriesRes] = await Promise.all([
          menuService.getMenuItems(),
          menuService.getMenuCategories(),
        ]);
        if (itemsRes.error) throw itemsRes.error;
        if (categoriesRes.error) throw categoriesRes.error;
        const sortedCategories = (categoriesRes.data as MenuCategory[] || [])
          .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
        setItems(itemsRes.data || []);
        setCategories(sortedCategories);
        if (sortedCategories.length > 0) {
          setFormData((prev) => ({ ...prev, category_id: sortedCategories[0].id }));
        }
      } catch (err) {
        console.error("Failed to load menu data", err);
      }
    })();
  }, []);

  const renderEditForm = (itemId?: string) => (
    <View style={styles.formContainer}>
      <Text style={styles.formTitle}>
        {itemId ? "Edit Menu Item" : "Add New Menu Item"}
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Item Name *"
        placeholderTextColor={colors.textSecondary}
        value={formData.name}
        onChangeText={(text) => setFormData({ ...formData, name: text })}
      />

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Description"
        placeholderTextColor={colors.textSecondary}
        value={formData.description}
        onChangeText={(text) =>
          setFormData({ ...formData, description: text })
        }
        multiline
        numberOfLines={3}
      />

      <TextInput
        style={styles.input}
        placeholder="Price *"
        placeholderTextColor={colors.textSecondary}
        value={formData.price}
        onChangeText={(text) => setFormData({ ...formData, price: text })}
        keyboardType="decimal-pad"
      />

      <TextInput
        style={styles.input}
        placeholder="Tag (e.g. New, Popular)"
        placeholderTextColor={colors.textSecondary}
        value={formData.tag}
        onChangeText={(text) => setFormData({ ...formData, tag: text })}
      />

      <TextInput
        style={styles.input}
        placeholder="Spicy Level (0–5)"
        placeholderTextColor={colors.textSecondary}
        value={formData.spicy_level}
        onChangeText={(text) => setFormData({ ...formData, spicy_level: text })}
        keyboardType="number-pad"
      />

      <View style={styles.categorySelector}>
        <Text style={styles.inputLabel}>Category:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map((category) => (
            <Pressable
              key={category.id}
              style={[
                styles.categoryChip,
                formData.category_id === category.id &&
                  styles.categoryChipActive,
              ]}
              onPress={() => {
                if (Platform.OS !== "web") {
                  Haptics.impactAsync(
                    Haptics.ImpactFeedbackStyle.Light
                  );
                }
                setFormData({ ...formData, category_id: category.id });
              }}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  formData.category_id === category.id &&
                    styles.categoryChipTextActive,
                ]}
              >
                {category.title}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={styles.imageSection}>
        <Text style={styles.inputLabel}>Menu Image:</Text>
        
        {formData.image_url ? (
          <View style={styles.imagePreviewContainer}>
            <Image 
              source={{ uri: formData.image_url }} 
              style={styles.imagePreview}
              resizeMode="cover"
            />
            <Pressable
              style={styles.removeImageButton}
              onPress={() => {
                setFormData({ ...formData, image_url: "" });
                showToast('info', 'Image removed');
              }}
            >
              <IconSymbol name="xmark" size={16} color="#FFFFFF" />
            </Pressable>
          </View>
        ) : null}

        <ImagePicker
          currentImageUrl={formData.image_url}
          onImageSelected={handleImageSelected}
          bucket="menu"
          folder="items"
          label=""
        />
      </View>

      <View style={styles.formButtons}>
        <Pressable
          style={[styles.button, styles.cancelButton]}
          onPress={() => {
            if (Platform.OS !== "web") {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            if (itemId) {
              setEditingItemId(null);
            } else {
              setIsAddingItem(false);
            }
            resetForm();
          }}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </Pressable>
        <Pressable
          style={[styles.button, styles.saveButton]}
          onPress={() => itemId ? handleUpdateItem(itemId) : handleAddItem()}
        >
          <Text style={styles.saveButtonText}>
            {itemId ? "Update" : "Add Item"}
          </Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => {
            if (Platform.OS !== "web") {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            router.back();
          }}
        >
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Menu Management</Text>
        <Pressable
          style={styles.addButton}
          onPress={() => {
            if (Platform.OS !== "web") {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            setIsAddingItem(!isAddingItem);
            setEditingItemId(null);
            resetForm();
          }}
        >
          <IconSymbol
            name={isAddingItem ? "xmark" : "plus"}
            size={24}
            color={colors.primary}
          />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {isAddingItem && renderEditForm()}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryFilter}
          contentContainerStyle={styles.categoryFilterContent}
        >
          {categoryFilterOptions.map((category) => (
            <Pressable
              key={category.id}
              style={[
                styles.filterChip,
                selectedCategoryId === category.id && styles.filterChipActive,
              ]}
              onPress={() => {
                if (Platform.OS !== "web") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setSelectedCategoryId(category.id);
              }}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedCategoryId === category.id && styles.filterChipTextActive,
                ]}
              >
                {category.title}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.itemsContainer}>
          {filteredItems.map((item) => (
            <React.Fragment key={item.id}>
              <View style={styles.menuItem}>
                {item.image_url ? (
                  <Image source={{ uri: item.image_url }} style={styles.itemImage} />
                ) : (
                  <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
                    <IconSymbol name="photo" size={32} color={colors.textSecondary} />
                  </View>
                )}
                <View style={styles.itemContent}>
                  <View style={styles.itemNameRow}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    {item.tag ? (
                      <Text style={styles.itemTag}>{item.tag}</Text>
                    ) : null}
                  </View>
                  <Text style={styles.itemDescription} numberOfLines={2}>
                    {item.description}
                  </Text>
                  <View style={styles.itemFooter}>
                    <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
                    <Text style={styles.itemCategory}>
                      {getCategoryTitle(item.category_id)}
                    </Text>
                    {item.spicy_level != null && item.spicy_level > 0 ? (
                      <Text style={styles.itemSpicy}>
                        {"🌶️".repeat(item.spicy_level)}
                      </Text>
                    ) : null}
                    {item.is_available === false ? (
                      <Text style={styles.itemUnavailable}>Unavailable</Text>
                    ) : null}
                  </View>
                </View>
                <View style={styles.itemActions}>
                  <Pressable
                    style={[
                      styles.actionButton,
                      styles.availabilityButton,
                      (item.is_available ?? true) ? styles.availabilityButtonOn : styles.availabilityButtonOff,
                    ]}
                    onPress={() => handleToggleAvailability(item)}
                  >
                    <IconSymbol
                      name={(item.is_available ?? true) ? "eye.fill" : "eye.slash.fill"}
                      size={16}
                      color={(item.is_available ?? true) ? "#22C55E" : "#FF6B6B"}
                    />
                  </Pressable>
                  <Pressable
                    style={styles.actionButton}
                    onPress={() => handleEditItem(item)}
                  >
                    <IconSymbol name="pencil" size={20} color={colors.primary} />
                  </Pressable>
                  <Pressable
                    style={styles.actionButton}
                    onPress={() => handleDeleteItem(item.id)}
                  >
                    <IconSymbol name="trash.fill" size={20} color="#FF6B6B" />
                  </Pressable>
                </View>
              </View>
              
              {editingItemId === item.id && renderEditForm(item.id)}
            </React.Fragment>
          ))}
        </View>
      </ScrollView>
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onHide={() => setToastVisible(false)}
        currentColors={{ text: colors.text, background: colors.background, primary: colors.primary }}
      />
      <Dialog
        visible={dialogVisible}
        title={dialogConfig.title}
        message={dialogConfig.message}
        buttons={dialogConfig.buttons}
        onHide={() => setDialogVisible(false)}
        currentColors={{ text: colors.text, card: colors.card, primary: colors.primary, textSecondary: colors.textSecondary, background: colors.background }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
    flex: 1,
    textAlign: "center",
  },
  addButton: {
    padding: 8,
  },
  formContainer: {
    backgroundColor: colors.card,
    margin: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 0.2,
    borderColor: colors.border,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 16,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
    borderWidth: 0.2,
    borderColor: colors.border,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  categorySelector: {
    marginBottom: 12,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background,
    marginRight: 8,
    borderWidth: 0.2,
    borderColor: colors.border,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    fontSize: 14,
    color: colors.text,
  },
  categoryChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  imageSection: {
    marginBottom: 12,
  },
  imagePreviewContainer: {
    position: "relative",
    marginBottom: 12,
    borderRadius: 12,
    overflow: "hidden",
  },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    backgroundColor: colors.background,
  },
  removeImageButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  formButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: colors.background,
    borderWidth: 0.2,
    borderColor: colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  categoryFilter: {
    paddingHorizontal: 16,
    marginVertical: 16,
  },
  categoryFilterContent: {
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 0.2,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    color: colors.text,
  },
  filterChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  itemsContainer: {
    padding: 16,
    gap: 12,
  },
  menuItem: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 12,
    borderWidth: 0.2,
    borderColor: colors.border,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  itemImagePlaceholder: {
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  itemContent: {
    flex: 1,
    marginLeft: 12,
  },
  itemNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  itemTag: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.primary,
    backgroundColor: colors.primary + "20",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: "hidden",
  },
  itemDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  itemFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 8,
    flexWrap: "wrap",
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.primary,
  },
  itemCategory: {
    fontSize: 12,
    color: colors.textSecondary,
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  itemSpicy: {
    fontSize: 12,
  },
  itemUnavailable: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FF6B6B",
    backgroundColor: "#FF6B6B20",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: "hidden",
  },
  itemActions: {
    justifyContent: "center",
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  availabilityButton: {
    borderRadius: 8,
    borderWidth: 0.2,
  },
  availabilityButtonOn: {
    backgroundColor: "#22C55E18",
    borderColor: "#22C55E40",
  },
  availabilityButtonOff: {
    backgroundColor: "#FF6B6B18",
    borderColor: "#FF6B6B40",
  },
});