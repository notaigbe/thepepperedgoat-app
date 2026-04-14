import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '@/contexts/AppContext';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { blackGoldLight } from "@/styles/commonStyles";


export interface TabBarItem {
  name: string;
  route: string;
  icon: string;
  label: string;
}

interface FloatingTabBarProps {
  tabs: TabBarItem[];
  containerWidth?: number;
  borderRadius?: number;
  bottomMargin?: number;
}

export default function FloatingTabBar({ tabs }: FloatingTabBarProps) {
  const router   = useRouter();
  const pathname = usePathname();
  const { cart } = useApp();

  const handleTabPress = (route: string) => {
    router.navigate(route as any);
  };

  const isActive = (route: string) => {
    if (route === '/(tabs)/(home)/') {
      return pathname === '/' || pathname.startsWith('/(tabs)/(home)');
    }
    return pathname.includes(route.split('/').pop() || '');
  };

  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      {/* Light frosted glass layer */}
      <BlurView intensity={55} tint="light" style={styles.blur}>

        {/* Fading gold top border — matches the header divider treatment */}
        <LinearGradient
          colors={['transparent', blackGoldLight.BORDER_GOLD, blackGoldLight.BORDER_GOLD, 'transparent']}
          locations={[0, 0.15, 0.85, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.topRule}
        />

        <View style={styles.tabBar}>
          {tabs.map((tab) => {
            const active    = isActive(tab.route);
            const isCartTab = tab.name === 'cart';

            return (
              <TouchableOpacity
                key={tab.name}
                style={styles.tab}
                onPress={() => handleTabPress(tab.route)}
                activeOpacity={0.7}
              >
                {/*
                  Two-layer pill for the active state:
                  - activePill (outer): owns the shadow. No overflow:hidden here,
                    because on iOS mixing shadow + overflow:hidden on the same view
                    causes the rounded clip to drop on press.
                  - gradientClip (inner): owns overflow:hidden + borderRadius to
                    clip the LinearGradient cleanly without touching the shadow layer.
                */}
                {active ? (
                  <View style={styles.activePill}>
                    <View style={styles.gradientClip}>
                      <LinearGradient
                        colors={[blackGoldLight.GOLD, blackGoldLight.INK]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFillObject}
                      />
                      <IconSymbol
                        name={tab.icon as any}
                        size={21}
                        color="#FFFFFF"
                      />
                      {isCartTab && cartItemCount > 0 && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>
                            {cartItemCount > 99 ? '99+' : cartItemCount}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                ) : (
                  <View style={styles.inactivePill}>
                    <IconSymbol
                      name={tab.icon as any}
                      size={21}
                      color={blackGoldLight.INK_MID}
                    />
                    {isCartTab && cartItemCount > 0 && (
                      <View style={[styles.badge, styles.badgeDark]}>
                        <Text style={styles.badgeText}>
                          {cartItemCount > 99 ? '99+' : cartItemCount}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Label */}
                <Text style={[styles.label, active && styles.labelActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </BlurView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(248,246,241,1)',
  },

  // Frosted warm-parchment glass
  blur: {
    overflow: 'hidden',
    backgroundColor: 'rgba(248,246,241,0.9)',
    shadowColor: blackGoldLight.INK,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    // elevation: 10,
  },

  // Fading gold rule
  topRule: {
    height: 1,
  },

  tabBar: {
    flexDirection: 'row',
    paddingTop: 10,
    paddingBottom: 4,
    paddingHorizontal: 12,
    justifyContent: 'space-around',
    alignItems: 'center',
  },

  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 4,
    borderRadius: 12,
  },

  // Outer shadow container — deliberately NO overflow:hidden.
  // Mixing overflow:hidden + shadow on the same view causes iOS to drop
  // the rounded clip during the TouchableOpacity press animation.
  activePill: {
    width: 52,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: blackGoldLight.GOLD,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  // Inner clip container — owns overflow:hidden + borderRadius to clip
  // the LinearGradient. Kept separate from the shadow layer above.
  gradientClip: {
    width: 52,
    height: 40,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  // Transparent pill for inactive tab — just icon, no bg
  inactivePill: {
    width: 52,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: 'transparent',
  },

  // Cart count badge
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: blackGoldLight.INK,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  badgeDark: {
    backgroundColor: blackGoldLight.GOLD,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Labels
  label: {
    fontSize: 9,
    fontFamily: 'LibertinusSans_400Regular',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: blackGoldLight.INK_SOFT,
  },
  labelActive: {
    fontFamily: 'LibertinusSans_700Bold',
    color: blackGoldLight.GOLD,
  },
});