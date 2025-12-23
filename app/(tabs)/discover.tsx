import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { socialService, Post } from '@/services/socialService';
import { IconSymbol } from '@/components/IconSymbol';
import BodyScrollView from '@/components/BodyScrollView';

export default function DiscoverScreen() {
  const router = useRouter();
  const { currentColors, showToast } = useApp();
  const { isAuthenticated } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const LIMIT = 20;

  const loadPosts = useCallback(async (refresh = false) => {
    try {
      const currentOffset = refresh ? 0 : offset;
      const { data, error } = await socialService.getDiscoveryFeed(LIMIT, currentOffset);

      if (error) {
        console.error('Error loading posts:', error);
        showToast('Failed to load posts', 'error');
        return;
      }

      if (data) {
        if (refresh) {
          setPosts(data);
          setOffset(LIMIT);
        } else {
          setPosts((prev) => [...prev, ...data]);
          setOffset((prev) => prev + LIMIT);
        }
      }
    } catch (error) {
      console.error('Error loading posts:', error);
      showToast('Failed to load posts', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [offset, showToast]);

  useEffect(() => {
    loadPosts(true);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadPosts(true);
  };

  const handleLoadMore = () => {
    if (!loadingMore && posts.length >= LIMIT) {
      setLoadingMore(true);
      loadPosts(false);
    }
  };

  const handleLike = async (postId: string, isLiked: boolean) => {
    if (!isAuthenticated) {
      showToast('Please sign in to like posts', 'info');
      return;
    }

    try {
      if (isLiked) {
        await socialService.unlikePost(postId);
      } else {
        await socialService.likePost(postId);
      }

      // Update local state
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                isLikedByCurrentUser: !isLiked,
                likesCount: isLiked ? post.likesCount - 1 : post.likesCount + 1,
              }
            : post
        )
      );
    } catch (error) {
      console.error('Error toggling like:', error);
      showToast('Failed to update like', 'error');
    }
  };

  const handleComment = (postId: string) => {
    router.push(`/post-detail?postId=${postId}`);
  };

  const handleCreatePost = () => {
    if (!isAuthenticated) {
      showToast('Please sign in to create posts', 'info');
      return;
    }
    router.push('/create-post');
  };

  const renderPost = ({ item }: { item: Post }) => (
    <View style={[styles.postCard, { backgroundColor: currentColors.card }]}>
      {/* User Info */}
      <View style={styles.postHeader}>
        <View style={styles.userInfo}>
          {item.user?.profileImage ? (
            <Image source={{ uri: item.user.profileImage }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: currentColors.secondary }]}>
              <IconSymbol
                ios_icon_name="person.fill"
                android_material_icon_name="person"
                size={20}
                color={currentColors.text}
              />
            </View>
          )}
          <View style={styles.userDetails}>
            <Text style={[styles.userName, { color: currentColors.text }]}>
              {item.user?.name || 'Unknown User'}
            </Text>
            {item.locationVerified && (
              <View style={styles.verifiedBadge}>
                <IconSymbol
                  ios_icon_name="checkmark.seal.fill"
                  android_material_icon_name="verified"
                  size={14}
                  color={currentColors.primary}
                />
                <Text style={[styles.verifiedText, { color: currentColors.primary }]}>
                  Taken at Jagabans L.A.
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Post Image */}
      <TouchableOpacity onPress={() => handleComment(item.id)}>
        <Image source={{ uri: item.imageUrl }} style={styles.postImage} />
      </TouchableOpacity>

      {/* Post Actions */}
      <View style={styles.postActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleLike(item.id, item.isLikedByCurrentUser || false)}
        >
          <IconSymbol
            ios_icon_name={item.isLikedByCurrentUser ? 'heart.fill' : 'heart'}
            android_material_icon_name={item.isLikedByCurrentUser ? 'favorite' : 'favorite_border'}
            size={24}
            color={item.isLikedByCurrentUser ? '#FF3B30' : currentColors.text}
          />
          <Text style={[styles.actionText, { color: currentColors.text }]}>
            {item.likesCount}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => handleComment(item.id)}>
          <IconSymbol
            ios_icon_name="bubble.left"
            android_material_icon_name="chat_bubble_outline"
            size={24}
            color={currentColors.text}
          />
          <Text style={[styles.actionText, { color: currentColors.text }]}>
            {item.commentsCount}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Caption */}
      {item.caption && (
        <View style={styles.captionContainer}>
          <Text style={[styles.caption, { color: currentColors.text }]}>
            <Text style={styles.captionUsername}>{item.user?.name || 'User'}</Text>{' '}
            {item.caption}
          </Text>
        </View>
      )}

      {/* Timestamp */}
      <Text style={[styles.timestamp, { color: currentColors.textSecondary }]}>
        {new Date(item.createdAt).toLocaleDateString()}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: currentColors.background }]}>
        <View style={[styles.header, { backgroundColor: currentColors.card }]}>
          <Text style={[styles.headerTitle, { color: currentColors.text }]}>Discover</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={currentColors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: currentColors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: currentColors.card, paddingTop: Platform.OS === 'android' ? 48 : 0 }]}>
        <Text style={[styles.headerTitle, { color: currentColors.text }]}>Discover</Text>
        <TouchableOpacity onPress={handleCreatePost} style={styles.createButton}>
          <IconSymbol
            ios_icon_name="camera.fill"
            android_material_icon_name="photo_camera"
            size={24}
            color={currentColors.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Posts Feed */}
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={currentColors.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={currentColors.primary} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <IconSymbol
              ios_icon_name="photo.on.rectangle"
              android_material_icon_name="photo_library"
              size={64}
              color={currentColors.textSecondary}
            />
            <Text style={[styles.emptyText, { color: currentColors.textSecondary }]}>
              No posts yet. Be the first to share!
            </Text>
            <TouchableOpacity
              style={[styles.emptyButton, { backgroundColor: currentColors.primary }]}
              onPress={handleCreatePost}
            >
              <Text style={styles.emptyButtonText}>Create Post</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  createButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedText: {
    fontSize: 12,
    marginLeft: 4,
  },
  postImage: {
    width: '100%',
    height: 400,
    resizeMode: 'cover',
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  actionText: {
    fontSize: 14,
    marginLeft: 4,
    fontWeight: '600',
  },
  captionContainer: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
  },
  captionUsername: {
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
