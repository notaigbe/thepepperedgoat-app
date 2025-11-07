
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import * as Haptics from 'expo-haptics';

export default function AdminDashboard() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    console.log('Admin login attempt');
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    // TODO: Implement proper authentication with Supabase
    if (username === 'admin' && password === 'admin123') {
      setIsAuthenticated(true);
    } else {
      alert('Invalid credentials. Use admin/admin123 for demo.');
    }
  };

  const adminSections = [
    {
      id: 'menu',
      title: 'Menu Management',
      description: 'Add, edit, and remove menu items',
      icon: 'restaurant-menu' as const,
      route: '/admin/menu',
      color: colors.primary,
    },
    {
      id: 'orders',
      title: 'Order Management',
      description: 'View and update order statuses',
      icon: 'receipt-long' as const,
      route: '/admin/orders',
      color: '#FF6B35',
    },
    {
      id: 'users',
      title: 'User Management',
      description: 'Manage user accounts and profiles',
      icon: 'people' as const,
      route: '/admin/users',
      color: '#4ECDC4',
    },
    {
      id: 'events',
      title: 'Event Management',
      description: 'Create and manage events',
      icon: 'event' as const,
      route: '/admin/events',
      color: '#95E1D3',
    },
    {
      id: 'merch',
      title: 'Merchandise',
      description: 'Manage merch inventory',
      icon: 'shopping-bag' as const,
      route: '/admin/merch',
      color: '#F38181',
    },
    {
      id: 'giftcards',
      title: 'Gift Cards',
      description: 'View and manage gift cards',
      icon: 'card-giftcard' as const,
      route: '/admin/giftcards',
      color: '#AA96DA',
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Send push notifications',
      icon: 'notifications' as const,
      route: '/admin/notifications',
      color: '#FCBAD3',
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'View sales and engagement metrics',
      icon: 'analytics' as const,
      route: '/admin/analytics',
      color: '#A8D8EA',
    },
  ];

  const handleSectionPress = (route: string) => {
    console.log('Navigating to:', route);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(route as any);
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loginContainer}>
          <View style={styles.loginHeader}>
            <IconSymbol name="admin-panel-settings" size={64} color={colors.primary} />
            <Text style={styles.loginTitle}>Admin Dashboard</Text>
            <Text style={styles.loginSubtitle}>Jagabans LA</Text>
          </View>

          <View style={styles.loginForm}>
            <View style={styles.inputContainer}>
              <IconSymbol name="person" size={20} color={colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor={colors.textSecondary}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <IconSymbol name="lock" size={20} color={colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.loginButton,
                pressed && styles.loginButtonPressed,
              ]}
              onPress={handleLogin}
            >
              <Text style={styles.loginButtonText}>Sign In</Text>
            </Pressable>

            <Text style={styles.demoText}>Demo: admin / admin123</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Admin Dashboard</Text>
            <Text style={styles.subtitle}>Jagabans LA Management</Text>
          </View>
          <Pressable
            style={styles.logoutButton}
            onPress={() => {
              console.log('Logging out');
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              setIsAuthenticated(false);
              setUsername('');
              setPassword('');
            }}
          >
            <IconSymbol name="logout" size={24} color={colors.primary} />
          </Pressable>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <IconSymbol name="shopping-cart" size={32} color={colors.primary} />
            <Text style={styles.statValue}>127</Text>
            <Text style={styles.statLabel}>Total Orders</Text>
          </View>
          <View style={styles.statCard}>
            <IconSymbol name="people" size={32} color="#4ECDC4" />
            <Text style={styles.statValue}>1,234</Text>
            <Text style={styles.statLabel}>Active Users</Text>
          </View>
          <View style={styles.statCard}>
            <IconSymbol name="attach-money" size={32} color="#95E1D3" />
            <Text style={styles.statValue}>$12.5K</Text>
            <Text style={styles.statLabel}>Revenue</Text>
          </View>
        </View>

        <View style={styles.sectionsContainer}>
          {adminSections.map((section) => (
            <Pressable
              key={section.id}
              style={({ pressed }) => [
                styles.sectionCard,
                pressed && styles.sectionCardPressed,
              ]}
              onPress={() => handleSectionPress(section.route)}
            >
              <View style={[styles.sectionIcon, { backgroundColor: section.color + '20' }]}>
                <IconSymbol name={section.icon} size={32} color={section.color} />
              </View>
              <View style={styles.sectionContent}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Text style={styles.sectionDescription}>{section.description}</Text>
              </View>
              <IconSymbol name="chevron-right" size={24} color={colors.textSecondary} />
            </Pressable>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            💡 Enable Supabase for real-time syncing across all platforms
          </Text>
        </View>
      </ScrollView>
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
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loginHeader: {
    alignItems: 'center',
    marginBottom: 48,
  },
  loginTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
  },
  loginSubtitle: {
    fontSize: 18,
    color: colors.textSecondary,
    marginTop: 8,
  },
  loginForm: {
    width: '100%',
    maxWidth: 400,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: colors.text,
  },
  loginButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonPressed: {
    opacity: 0.8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  demoText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 4,
  },
  logoutButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  sectionsContainer: {
    paddingHorizontal: 24,
    gap: 12,
  },
  sectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionCardPressed: {
    opacity: 0.7,
  },
  sectionIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  sectionContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
