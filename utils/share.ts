
import * as FileSystem from 'expo-file-system/legacy';
import Share from 'react-native-share';
import { Platform } from 'react-native';

export const formatPostShareOptions = async (post: any) => {
  try {
    const cacheDir = `${FileSystem.cacheDirectory}shared-images/`;
    
    // Ensure cache directory exists
    const dirInfo = await FileSystem.getInfoAsync(cacheDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
    }
    
    // Use a unique filename with timestamp and random number to avoid collisions
    const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const fileUri = `${cacheDir}post_${uniqueId}.jpg`;
    
    // Check if file exists and delete it before downloading
    try {
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (fileInfo.exists) {
        console.log('File exists, deleting:', fileUri);
        await FileSystem.deleteAsync(fileUri, { idempotent: true });
        console.log('File deleted successfully');
      }
    } catch (deleteError) {
      console.log('Error checking/deleting file:', deleteError);
      // Continue anyway - we'll try to download
    }
    
    // Download the image
    console.log('Downloading image to:', fileUri);
    const downloadResult = await FileSystem.downloadAsync(post.imageUrl, fileUri);
    console.log('Image downloaded successfully to:', downloadResult.uri);
    
    const shareMessage = `${post.content}\n\n- ${post.userName}\n\nView in app: jagabansla://post/${post.id}\nDownload: https://jagabansla.com/download`;
    
    return {
      url: Platform.OS === 'ios' ? downloadResult.uri : `file://${downloadResult.uri}`,
      message: shareMessage,
    };
  } catch (error) {
    console.error('Error preparing share:', error);
    throw error;
  }
};
