
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { menuItems } from '@/data/menuData';
import { useApp } from '@/contexts/AppContext';
import { IconSymbol } from '@/components/IconSymbol';
import * as Haptics from 'expo-haptics';

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { addToCart } = useApp();
  const [quantity, setQuantity] = useState(1);

  const item = menuItems.find((i) => i.id === id);

  if (!item) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => {
              console.log('Back button pressed');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
          >
            <IconSymbol name="chevron.left" size={24} color={colors.text} />
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Item not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleQuantityChange = (change: number) => {
    console.log('Quantity change:', change);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newQuantity = quantity + change;
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = () => {
    console.log('Adding to cart:', item.name, quantity);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addToCart({ ...item, quantity });
    Alert.alert('Added to Cart', `${quantity}x ${item.name} added to your cart!`, [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  const handleBackPress = () => {
    console.log('Back button pressed');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={handleBackPress}
        >
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Image source={{ uri: item.image }} style={styles.image} />
        
        <View style={styles.content}>
          <View style={styles.headerInfo}>
            <View style={styles.headerLeft}>
              <Text style={styles.name}>{item.name}</Text>
              {item.popular && (
                <View style={styles.popularBadge}>
                  <IconSymbol name="star.fill" size={14} color={colors.card} />
                  <Text style={styles.popularText}>Popular</Text>
                </View>
              )}
            </View>
            <Text style={styles.price}>${item.price.toFixed(2)}</Text>
          </View>

          <View style={styles.categoryContainer}>
            <IconSymbol name="tag.fill" size={16} color={colors.textSecondary} />
            <Text style={styles.category}>{item.category}</Text>
          </View>

          <Text style={styles.description}>{item.description}</Text>

          <View style={styles.infoCard}>
            <IconSymbol name="star.fill" size={20} color={colors.highlight} />
            <Text style={styles.infoText}>
              Earn {Math.floor(item.price * quantity)} points with this order!
            </Text>
          </View>

          <View style={styles.quantitySection}>
            <Text style={styles.quantityLabel}>Quantity</Text>
            <View style={styles.quantityControls}>
              <Pressable
                style={styles.quantityButton}
                onPress={() => handleQuantityChange(-1)}
              >
                <IconSymbol name="minus" size={20} color={colors.primary} />
              </Pressable>
              <Text style={styles.quantityValue}>{quantity}</Text>
              <Pressable
                style={styles.quantityButton}
                onPress={() => handleQuantityChange(1)}
              >
                <IconSymbol name="plus" size={20} color={colors.primary} />
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${(item.price * quantity).toFixed(2)}</Text>
        </View>
        <Pressable style={styles.addButton} onPress={handleAddToCart}>
          <IconSymbol name="cart.fill" size={20} color={colors.card} />
          <Text style={styles.addButtonText}>Add to Cart</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.accent,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginLeft: -8,
  },
  backButtonText: {
    fontSize: 17,
    color: colors.text,
    fontWeight: '600',
  },
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  image: {
    width: '100%',
    height: 300,
    backgroundColor: colors.accent,
  },
  content: {
    padding: 20,
  },
  headerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
    marginRight: 16,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  popularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  popularText: {
    color: colors.card,
    fontSize: 12,
    fontWeight: '600',
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  category: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  description: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    marginBottom: 20,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 24,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  quantitySection: {
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 12,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  quantityButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    minWidth: 40,
    textAlign: 'center',
  },
  footer: {
    backgroundColor: colors.card,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.background,
    gap: 12,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  addButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.card,
  },
});
