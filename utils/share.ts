
import * as FileSystem from 'expo-file-system/legacy';
import Share from 'react-native-share';
import { Post } from '@/services/socialService';

export const formatPostShareOptions = (userName: string, caption: string, postId: string, imageUrl?: string) => {
  const appScheme = 'jagabansla://';
  const deepLink = `${appScheme}post/${postId}`;
  const appStoreUrl = 'https://apps.apple.com/app/jagabansla';
  const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.ooosumfoods.jagabansla';
  
  const message = `Check out this post by ${userName}!\n\n${caption}\n\nOpen in app: ${deepLink}\n\nDownload: ${appStoreUrl}`;
  
  return { message, url: deepLink };
};

export const sharePost = async (post: Post) => {
  try {
    console.log('Starting share process for post:', post.id);
    console.log('Post imageUrl:', post.imageUrl);

    // Validate imageUrl exists and is a valid string
    if (!post.imageUrl || typeof post.imageUrl !== 'string' || post.imageUrl.trim() === '') {
      throw new Error('Post image URL is missing or invalid');
    }

    // Ensure cache directory exists
    const cacheDir = FileSystem.cacheDirectory + 'shared-images/';
    console.log('Cache directory:', cacheDir);
    
    const dirInfo = await FileSystem.getInfoAsync(cacheDir);
    if (!dirInfo.exists) {
      console.log('Creating cache directory...');
      await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
    }

    // Download image with unique filename
    const localUri = cacheDir + `post_${Date.now()}.jpg`;
    console.log('Downloading image to:', localUri);
    console.log('From URL:', post.imageUrl);
    
    // Use downloadAsync with proper parameters
    const downloadResult = await FileSystem.downloadAsync(
      post.imageUrl,
      localUri
    );
    
    console.log('Download result:', downloadResult);

    if (!downloadResult.uri) {
      throw new Error('Failed to download image');
    }

    const shareOptions = formatPostShareOptions(post.userName, post.caption, post.id, post.imageUrl);
    
    console.log('Sharing with options:', shareOptions);
    
    await Share.open({
      ...shareOptions,
      url: downloadResult.uri,
      type: 'image/jpeg',
    });

    console.log('Share completed successfully');

  } catch (error: any) {
    console.error('Share error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      postId: post.id,
      imageUrl: post.imageUrl
    });
    throw error;
  }
};
