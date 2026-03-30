import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as ImagePickerExpo from 'expo-image-picker';
import { IconSymbol } from '@/components/IconSymbol';
import { blackGoldLight } from '@/styles/commonStyles';
import { imageService } from '@/services/supabaseService';
import * as Haptics from 'expo-haptics';
import { File } from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';

interface ImagePickerProps {
  currentImageUrl?: string;
  onImageSelected: (imageUrl: string) => void;
  bucket: string;
  folder: string;
  label?: string;
  disabled?: boolean;
}

export default function ImagePicker({
  currentImageUrl,
  onImageSelected,
  bucket,
  folder,
  label = 'Image',
  disabled = false,
}: ImagePickerProps) {
  const [uploading, setUploading] = useState(false);
  const [localImageUri, setLocalImageUri] = useState<string | undefined>(currentImageUrl);

  const pickImage = async () => {
    if (disabled) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const { status } = await ImagePickerExpo.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to upload images.');
        return;
      }

      const result = await ImagePickerExpo.launchImageLibraryAsync({
        mediaTypes: 'images' as any,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setLocalImageUri(asset.uri);
        await uploadImage(asset.uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      alert('Failed to pick image. Please try again.');
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      setUploading(true);

      const timestamp     = Date.now();
      const randomString  = Math.random().toString(36).substring(2, 15);
      const fileExtension = uri.split('.').pop() || 'jpg';
      const fileName      = `${folder}/${timestamp}-${randomString}.${fileExtension}`;

      const file        = new File(uri);
      const bytes       = await file.bytes();
      const arrayBuffer = bytes.buffer;

      const { data, error } = await imageService.uploadImage(
        bucket,
        fileName,
        arrayBuffer,
        { contentType: `image/${fileExtension}`, upsert: true }
      );

      if (error) throw error;

      const publicUrl = imageService.getPublicUrl(bucket, fileName);
      onImageSelected(publicUrl!);

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
      setLocalImageUri(currentImageUrl);
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Label with gold required-style dot */}
      <Text style={styles.label}>{label}</Text>

      <Pressable
        style={[styles.imageContainer, disabled && styles.disabled]}
        onPress={pickImage}
        disabled={disabled || uploading}
      >
        {localImageUri ? (
          <Image source={{ uri: localImageUri }} style={styles.image} />
        ) : (
          /* Empty state — gold-tinted placeholder */
          <View style={styles.placeholder}>
            <View style={styles.placeholderIconWrap}>
              <IconSymbol name="image" size={32} color={blackGoldLight.GOLD} />
            </View>
            <Text style={styles.placeholderText}>Tap to select image</Text>
            <Text style={styles.placeholderHint}>16 : 9 recommended</Text>
          </View>
        )}

        {/* Uploading overlay — dark near-black with gold spinner */}
        {uploading && (
          <View style={styles.uploadingOverlay}>
            <LinearGradient
              colors={["rgba(212,168,58,0.15)", "transparent"]}
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFillObject}
              pointerEvents="none"
            />
            <ActivityIndicator size="large" color={blackGoldLight.GOLD_BRIGHT} />
            <Text style={styles.uploadingText}>Uploading...</Text>
          </View>
        )}

        {/* Change overlay — shown on hover/press when image exists */}
        {!uploading && localImageUri && (
          <View style={styles.changeOverlay}>
            <View style={styles.changeIconWrap}>
              <IconSymbol name="edit" size={20} color={blackGoldLight.INK_WHITE} />
            </View>
            <Text style={styles.changeText}>Change Image</Text>
          </View>
        )}
      </Pressable>

      {localImageUri && !uploading && (
        <Text style={styles.hint}>Tap image to change</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },

  label: {
    fontSize: 13,
    fontFamily: 'LibertinusSans_400Regular',
    color: blackGoldLight.INK_MID,
    marginBottom: 8,
  },

  // Image container — white card with dashed gold border
  imageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: blackGoldLight.CARD_BG,
    borderWidth: 1.5,
    borderColor: blackGoldLight.BORDER_GOLD,
    borderStyle: 'dashed',
    shadowColor: blackGoldLight.GOLD,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  disabled: {
    opacity: 0.5,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  // Empty placeholder — centred icon + text
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: blackGoldLight.CARD_BG,
  },
  // Gold-dimmed circle behind the icon
  placeholderIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: blackGoldLight.GOLD_DIM,
    borderWidth: 1,
    borderColor: blackGoldLight.BORDER_GOLD,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  placeholderText: {
    fontSize: 14,
    fontFamily: 'LibertinusSans_400Regular',
    color: blackGoldLight.INK_MID,
  },
  placeholderHint: {
    fontSize: 11,
    fontFamily: 'LibertinusSans_400Regular',
    color: blackGoldLight.INK_SOFT,
    letterSpacing: 0.5,
  },

  // Uploading overlay — dark near-black with subtle gold bloom
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,8,0.82)',  // HEADER_TOP at 82% — warm near-black
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  uploadingText: {
    fontSize: 15,
    fontFamily: 'LibertinusSans_700Bold',
    color: blackGoldLight.INK_WHITE,
    letterSpacing: 0.3,
  },

  // Change overlay — same dark treatment, starts transparent
  changeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,8,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    opacity: 0,  // shown on press via Pressable opacity
  },
  // Gold-bordered pill around edit icon
  changeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: blackGoldLight.GOLD_DIM,
    borderWidth: 1,
    borderColor: blackGoldLight.BORDER_GOLD,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeText: {
    fontSize: 13,
    fontFamily: 'LibertinusSans_700Bold',
    color: blackGoldLight.INK_WHITE,
    letterSpacing: 0.3,
  },

  hint: {
    fontSize: 12,
    fontFamily: 'LibertinusSans_400Regular',
    color: blackGoldLight.INK_SOFT,
    marginTop: 6,
    textAlign: 'center',
  },
});