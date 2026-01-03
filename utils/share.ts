
import Share from 'react-native-share';
import { Platform } from 'react-native';

const APP_STORE_ID = 'YOUR_APP_STORE_ID';
const PLAY_STORE_ID = 'YOUR_PLAY_STORE_ID';
const APP_SCHEME = 'jagabansla';

const generatePostDeepLink = (postId: string) => `${APP_SCHEME}://post-detail?postId=${postId}`;

const generateUniversalPostLink = () => {
  if (Platform.OS === 'ios') {
    return `https://apps.apple.com/app/id${APP_STORE_ID}`;
  }
  return `https://play.google.com/store/apps/details?id=${PLAY_STORE_ID}`;
};

export const formatPostShareOptions = (
  userName: string,
  caption: string,
  postId: string,
  imageUrl?: string
) => {
  const deepLink = generatePostDeepLink(postId);
  const downloadLink = generateUniversalPostLink();
  
  // Format the share message with post content and links
  const message = `Check out this post from ${userName}!\n\n${caption}\n\nOpen in app: ${deepLink}\nDownload: ${downloadLink}`;
  
  return {
    message,
    url: imageUrl, // Include image URL if provided
  };
};

export const sharePost = async (
  userName: string,
  caption: string,
  postId: string,
  imageUrl?: string
) => {
  try {
    const shareOptions = formatPostShareOptions(userName, caption, postId, imageUrl);
    await Share.open(shareOptions);
  } catch (error: any) {
    if (error.message !== 'User did not share' && error.message !== 'User did cancel') {
      console.error('Share error:', error);
      throw error;
    }
  }
};
