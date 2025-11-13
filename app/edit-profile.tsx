import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Platform,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { IconSymbol } from '@/components/IconSymbol';
import * as Haptics from 'expo-haptics';
import Toast from '@/components/Toast';
import { imageService, userService } from '@/services/supabaseService';
import * as ImagePicker from 'expo-image-picker';

export default function EditProfileScreen() {
  const router = useRouter();
  const { userProfile, currentColors, loadUserProfile } = useApp();
  const { user } = useAuth();
  
  const [name, setName] = useState(userProfile?.name || '');
  const [email, setEmail] = useState(userProfile?.email || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [profileImage, setProfileImage] = useState<string | null>(userProfile?.profileImage || null);
  
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToastType(type);
    setToastMessage(message);
    setToastVisible(true);
  };

  const handleSave = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (!name || !email) {
      showToast('error', 'Please fill in required fields');
      return;
    }

    if (!user?.id) {
      showToast('error', 'User not authenticated');
      return;
    }

    setSaving(true);
    try {
      // Update profile in backend
      const { data, error } = await userService.updateUserProfile(user.id, {
        name,
        email,
        phone,
        profile_image,
      });

      if (error) {
        console.error('Update error:', error);
        showToast('error', 'Failed to update profile');
        return;
      }

      // Reload user profile to get fresh data
      await loadUserProfile();
      
      showToast('success', 'Profile updated successfully!');
      
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error: any) {
      console.error('Save error:', error);
      showToast('error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleImagePick = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      // Request permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        showToast('error', 'Permission to access camera roll is required');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0]);
      }
    } catch (error: any) {
      console.error('Image picker error:', error);
      showToast('error', 'Failed to pick image');
    }
  };

  const handleTakePhoto = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      // Request camera permissions
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        showToast('error', 'Permission to access camera is required');
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0]);
      }
    } catch (error: any) {
      console.error('Camera error:', error);
      showToast('error', 'Failed to take photo');
    }
  };

// Updated uploadImage function:
const uploadImage = async (asset: ImagePicker.ImagePickerAsset) => {
  if (!user?.id) {
    showToast('error', 'User not authenticated');
    return;
  }
  setUploadingImage(true);
  
  try {
    // Generate unique filename
    const fileExt = asset.uri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${user.id}_${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;
    console.log('Uploading image:', filePath);

    // For React Native, we need to use ArrayBuffer instead of Blob
    const response = await fetch(asset.uri);
    const arrayBuffer = await response.arrayBuffer();
    
    console.log('ArrayBuffer size:', arrayBuffer.byteLength);

    // Determine MIME type
    const mimeType = asset.mimeType || `image/${fileExt}`;
    
    // Upload to Supabase Storage using ArrayBuffer
    const { data, error } = await imageService.uploadImage(
      'profile', // bucket name
      filePath,
      arrayBuffer,
      {
        contentType: mimeType,
        upsert: true
      }
    );

    if (error) {
      console.error('Upload error:', error);
      throw error;
    }

    console.log('Upload successful:', data);

    // For private bucket, we'll store the path and generate signed URLs when needed
    // Store the full path (not a signed URL since those expire)
    const imageUrl = filePath; // Store path, not URL
    
    console.log('Image path stored:', imageUrl);

    // Update local state
    setProfileImage(imageUrl);
    showToast('success', 'Image uploaded successfully');
    
    // Note: The image URL will be saved to the database when user clicks Save
  } catch (error: any) {
    console.error('Upload error:', error);
    showToast('error', `Failed to upload image: ${error.message || 'Unknown error'}`);
  } finally {
    setUploadingImage(false);
  }
};

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentColors.background }]} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              router.back();
            }}
            style={styles.backButton}
          >
            <IconSymbol name="chevron.left" size={24} color={currentColors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: currentColors.text }]}>Edit Profile</Text>
          <Pressable 
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={currentColors.primary} />
            ) : (
              <Text style={[styles.saveButton, { color: currentColors.primary }]}>Save</Text>
            )}
          </Pressable>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Image Section */}
          <View style={styles.imageSection}>
            <View style={styles.imageContainer}>
              {uploadingImage ? (
                <View style={[styles.imagePlaceholder, { backgroundColor: currentColors.primary + '20' }]}>
                  <ActivityIndicator size="large" color={currentColors.primary} />
                </View>
              ) : profileImage ? (
                <Image 
                  source={{ uri: profileImage }} 
                  style={styles.profileImage}
                  onError={() => {
                    console.error('Failed to load image:', profileImage);
                    setProfileImage(null);
                    showToast('error', 'Failed to load image');
                  }}
                />
              ) : (
                <View style={[styles.imagePlaceholder, { backgroundColor: currentColors.primary }]}>
                  <IconSymbol name="person" size={48} color={currentColors.card} />
                </View>
              )}
            </View>
            
            <View style={styles.imageButtons}>
              <Pressable
                style={[
                  styles.imageButton, 
                  { backgroundColor: currentColors.primary },
                  uploadingImage && { opacity: 0.6 }
                ]}
                onPress={handleImagePick}
                disabled={uploadingImage}
              >
                <IconSymbol name="photo.fill" size={20} color={currentColors.card} />
                <Text style={[styles.imageButtonText, { color: currentColors.card }]}>Gallery</Text>
              </Pressable>
              
              <Pressable
                style={[
                  styles.imageButton, 
                  { backgroundColor: currentColors.primary },
                  uploadingImage && { opacity: 0.6 }
                ]}
                onPress={handleTakePhoto}
                disabled={uploadingImage}
              >
                <IconSymbol name="camera" size={20} color={currentColors.card} />
                <Text style={[styles.imageButtonText, { color: currentColors.card }]}>Camera</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: currentColors.text }]}>Full Name</Text>
            <TextInput
              style={[
                styles.input, 
                { 
                  backgroundColor: currentColors.card, 
                  color: currentColors.text, 
                  borderColor: currentColors.textSecondary + '30' 
                }
              ]}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor={currentColors.textSecondary}
              editable={!saving}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: currentColors.text }]}>Email</Text>
            <TextInput
              style={[
                styles.input, 
                { 
                  backgroundColor: currentColors.card, 
                  color: currentColors.text, 
                  borderColor: currentColors.textSecondary + '30' 
                }
              ]}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor={currentColors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!saving}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: currentColors.text }]}>Phone</Text>
            <TextInput
              style={[
                styles.input, 
                { 
                  backgroundColor: currentColors.card, 
                  color: currentColors.text, 
                  borderColor: currentColors.textSecondary + '30' 
                }
              ]}
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter your phone"
              placeholderTextColor={currentColors.textSecondary}
              keyboardType="phone-pad"
              editable={!saving}
            />
          </View>

          {/* Info note about saving */}
          <View style={[styles.infoBox, { backgroundColor: currentColors.highlight + '20' }]}>
            <IconSymbol name="info.circle.fill" size={20} color={currentColors.primary} />
            <Text style={[styles.infoText, { color: currentColors.text }]}>
              Changes will be saved to your profile when you tap Save
            </Text>
          </View>
        </ScrollView>
      </View>
      
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onHide={() => setToastVisible(false)}
        currentColors={currentColors}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 20,
  },
  imageContainer: {
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  imageButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});