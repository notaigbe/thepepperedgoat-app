
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

/**
 * Generate a deep link URL for a post
 * @param postId - The ID of the post
 * @returns Deep link URL that opens the post in the app
 */
export function generatePostDeepLink(postId: string): string {
  // Create deep link using expo-linking
  // This will use the scheme defined in app.json (jagabansla://)
  const deepLink = Linking.createURL(`post-detail`, {
    queryParams: { postId },
  });
  
  return deepLink;
}

/**
 * Generate a universal link that works for both existing and new users
 * @param postId - The ID of the post
 * @returns Object with deep link and fallback URLs
 */
export function generateUniversalPostLink(postId: string) {
  const deepLink = generatePostDeepLink(postId);
  
  // Fallback URLs for users who don't have the app installed
  const iosAppStoreUrl = 'https://apps.apple.com/app/id123456789'; // TODO: Replace with actual App Store URL
  const androidPlayStoreUrl = 'https://play.google.com/store/apps/details?id=com.ooosumfoods.jagabansla';
  
  // For web, we can use the website URL
  const webUrl = `https://jagabansla.com/post/${postId}`;
  
  return {
    deepLink,
    iosAppStoreUrl,
    androidPlayStoreUrl,
    webUrl,
    // Smart link that tries to open app first, then falls back to store
    smartLink: Platform.select({
      ios: deepLink,
      android: deepLink,
      web: webUrl,
      default: deepLink,
    }),
  };
}

/**
 * Format share message with post content and links
 * @param userName - Name of the user who created the post
 * @param caption - Post caption/content
 * @param postId - ID of the post
 * @returns Formatted share message
 */
export function formatPostShareMessage(
  userName: string,
  caption: string | undefined,
  postId: string
): string {
  const links = generateUniversalPostLink(postId);
  
  // Build the share message
  let message = `Check out this post from ${userName} on Jagabans L.A.!\n\n`;
  
  if (caption) {
    message += `"${caption}"\n\n`;
  }
  
  message += `📱 Open in app: ${links.deepLink}\n\n`;
  
  // Add store links for users who don't have the app
  if (Platform.OS === 'ios') {
    message += `Don't have the app? Download it here:\n${links.iosAppStoreUrl}`;
  } else if (Platform.OS === 'android') {
    message += `Don't have the app? Download it here:\n${links.androidPlayStoreUrl}`;
  } else {
    message += `View on web: ${links.webUrl}\n\n`;
    message += `Download the app:\n`;
    message += `📱 iOS: ${links.iosAppStoreUrl}\n`;
    message += `🤖 Android: ${links.androidPlayStoreUrl}`;
  }
  
  return message;
}

/**
 * Format share options for react-native-share
 * @param userName - Name of the user who created the post
 * @param caption - Post caption/content
 * @param postId - ID of the post
 * @param imageUrl - URL of the post image
 * @returns Share options object
 */
export function formatPostShareOptions(
  userName: string,
  caption: string | undefined,
  postId: string,
  imageUrl: string
) {
  const message = formatPostShareMessage(userName, caption, postId);
  const links = generateUniversalPostLink(postId);
  
  return {
    title: `Post from ${userName} - Jagabans L.A.`,
    message: message,
    url: imageUrl, // Include the image
    subject: `Check out this post from ${userName}`, // For email sharing
    // Social media specific options
    social: {
      // These will be used if sharing to specific platforms
      facebook: {
        quote: caption || `Check out this post from ${userName}!`,
      },
      twitter: {
        text: caption ? `"${caption}" - ${userName}` : `Check out this post from ${userName}!`,
        hashtags: ['JagabansLA', 'FoodLovers'],
      },
    },
  };
}
