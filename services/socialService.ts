import { supabase, SUPABASE_URL } from '@/app/integrations/supabase/client';

export interface Post {
  id: string;
  userId: string;
  imageUrl: string;
  caption?: string;
  latitude: number;
  longitude: number;
  locationVerified: boolean;
  likesCount: number;
  commentsCount: number;
  isFeatured: boolean;
  isHidden: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    profileImage?: string;
  };
  isLikedByCurrentUser?: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  parentCommentId?: string;
  commentText: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    profileImage?: string;
  };
  replies?: Comment[];
}

export interface Referral {
  id: string;
  referrerUserId: string;
  referredUserId?: string;
  referralCode: string;
  referredEmail?: string;
  status: 'pending' | 'signed_up' | 'completed_first_order';
  signupBonusAwarded: boolean;
  firstOrderBonusAwarded: boolean;
  signupBonusPoints: number;
  firstOrderBonusPoints: number;
  createdAt: string;
  signedUpAt?: string;
  firstOrderAt?: string;
}

export const socialService = {
  // ============================================
  // POST SERVICES
  // ============================================

  /**
   * Create a new post with location verification
   */
  async createPost(
    imageUrl: string,
    latitude: number,
    longitude: number,
    caption?: string
  ) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: session.user.id,
          image_url: imageUrl,
          caption: caption || null,
          latitude,
          longitude,
          location_verified: true,
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Create post error:', error);
      return { data: null, error };
    }
  },

  /**
   * Get discovery feed (all posts, ranked by engagement)
   */
  async getDiscoveryFeed(limit = 20, offset = 0) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id;

      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          user:user_profiles!posts_user_id_fkey (id, name, profile_image)
        `)
        .eq('is_hidden', false)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // Check if current user has liked each post
      if (currentUserId && data) {
        const postIds = data.map((p: any) => p.id);
        const { data: likes } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', currentUserId)
          .in('post_id', postIds);

        const likedPostIds = new Set(likes?.map((l: any) => l.post_id) || []);

        return {
          data: data.map((post: any) => ({
            id: post.id,
            userId: post.user_id,
            imageUrl: post.image_url,
            caption: post.caption,
            latitude: post.latitude,
            longitude: post.longitude,
            locationVerified: post.location_verified,
            likesCount: post.likes_count,
            commentsCount: post.comments_count,
            isFeatured: post.is_featured,
            isHidden: post.is_hidden,
            createdAt: post.created_at,
            updatedAt: post.updated_at,
            user: post.user ? {
              id: post.user.id,
              name: post.user.name,
              profileImage: post.user.profile_image,
            } : undefined,
            isLikedByCurrentUser: likedPostIds.has(post.id),
          })),
          error: null,
        };
      }

      return {
        data: data?.map((post: any) => ({
          id: post.id,
          userId: post.user_id,
          imageUrl: post.image_url,
          caption: post.caption,
          latitude: post.latitude,
          longitude: post.longitude,
          locationVerified: post.location_verified,
          likesCount: post.likes_count,
          commentsCount: post.comments_count,
          isFeatured: post.is_featured,
          isHidden: post.is_hidden,
          createdAt: post.created_at,
          updatedAt: post.updated_at,
          user: post.user ? {
            id: post.user.id,
            name: post.user.name,
            profileImage: post.user.profile_image,
          } : undefined,
          isLikedByCurrentUser: false,
        })),
        error: null,
      };
    } catch (error) {
      console.error('Get discovery feed error:', error);
      return { data: null, error };
    }
  },

  /**
   * Get user's posts
   */
  async getUserPosts(userId: string) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          user:user_profiles!posts_user_id_fkey (id, name, profile_image)
        `)
        .eq('user_id', userId)
        .eq('is_hidden', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Get user posts error:', error);
      return { data: null, error };
    }
  },

  /**
   * Like a post
   */
  async likePost(postId: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('post_likes')
        .insert({
          post_id: postId,
          user_id: session.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Like post error:', error);
      return { data: null, error };
    }
  },

  /**
   * Unlike a post
   */
  async unlikePost(postId: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', session.user.id);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Unlike post error:', error);
      return { error };
    }
  },

  /**
   * Get comments for a post
   */
  async getPostComments(postId: string) {
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .select(`
          *,
          user:user_profiles!post_comments_user_id_fkey (id, name, profile_image)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Organize comments into threaded structure
      const commentsMap = new Map<string, Comment>();
      const rootComments: Comment[] = [];

      data?.forEach((comment: any) => {
        const commentObj: Comment = {
          id: comment.id,
          postId: comment.post_id,
          userId: comment.user_id,
          parentCommentId: comment.parent_comment_id,
          commentText: comment.comment_text,
          createdAt: comment.created_at,
          updatedAt: comment.updated_at,
          user: comment.user ? {
            id: comment.user.id,
            name: comment.user.name,
            profileImage: comment.user.profile_image,
          } : undefined,
          replies: [],
        };

        commentsMap.set(commentObj.id, commentObj);

        if (commentObj.parentCommentId) {
          const parent = commentsMap.get(commentObj.parentCommentId);
          if (parent) {
            parent.replies = parent.replies || [];
            parent.replies.push(commentObj);
          }
        } else {
          rootComments.push(commentObj);
        }
      });

      return { data: rootComments, error: null };
    } catch (error) {
      console.error('Get post comments error:', error);
      return { data: null, error };
    }
  },

  /**
   * Add a comment to a post
   */
  async addComment(postId: string, commentText: string, parentCommentId?: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: session.user.id,
          comment_text: commentText,
          parent_comment_id: parentCommentId || null,
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Add comment error:', error);
      return { data: null, error };
    }
  },

  /**
   * Report a post
   */
  async reportPost(postId: string, reason: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('post_reports')
        .insert({
          post_id: postId,
          reporter_user_id: session.user.id,
          reason,
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Report post error:', error);
      return { data: null, error };
    }
  },

  /**
   * Delete a post
   */
  async deletePost(postId: string) {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Delete post error:', error);
      return { error };
    }
  },

  // ============================================
  // REFERRAL SERVICES
  // ============================================

  /**
   * Generate a referral code for the current user
   */
  async generateReferralCode() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Call the database function to generate a unique code
      const { data: codeData, error: codeError } = await supabase
        .rpc('generate_referral_code');

      if (codeError) throw codeError;

      const referralCode = codeData as string;

      const { data, error } = await supabase
        .from('referrals')
        .insert({
          referrer_user_id: session.user.id,
          referral_code: referralCode,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return { data: referralCode, error: null };
    } catch (error) {
      console.error('Generate referral code error:', error);
      return { data: null, error };
    }
  },

  /**
   * Get user's referral code
   */
  async getUserReferralCode() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('referrals')
        .select('referral_code')
        .eq('referrer_user_id', session.user.id)
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (!data) {
        // Generate a new referral code if none exists
        return await this.generateReferralCode();
      }

      return { data: data.referral_code, error: null };
    } catch (error) {
      console.error('Get user referral code error:', error);
      return { data: null, error };
    }
  },

  /**
   * Get user's referrals
   */
  async getUserReferrals() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('referrals')
        .select(`
          *,
          referred_user:user_profiles!referrals_referred_user_id_fkey (id, name, email)
        `)
        .eq('referrer_user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Get user referrals error:', error);
      return { data: null, error };
    }
  },

  /**
   * Apply referral code during signup
   */
  async applyReferralCode(referralCode: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Find the referral
      const { data: referral, error: findError } = await supabase
        .from('referrals')
        .select('*')
        .eq('referral_code', referralCode)
        .single();

      if (findError) throw findError;
      if (!referral) throw new Error('Invalid referral code');

      // Update the referral with the new user
      const { error: updateError } = await supabase
        .from('referrals')
        .update({
          referred_user_id: session.user.id,
          status: 'signed_up',
          signed_up_at: new Date().toISOString(),
        })
        .eq('id', referral.id);

      if (updateError) throw updateError;

      return { data: referral, error: null };
    } catch (error) {
      console.error('Apply referral code error:', error);
      return { data: null, error };
    }
  },

  // ============================================
  // PUSH NOTIFICATION SERVICES
  // ============================================

  /**
   * Register push notification token
   */
  async registerPushToken(token: string, deviceType: 'ios' | 'android' | 'web') {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('push_notification_tokens')
        .upsert({
          user_id: session.user.id,
          token,
          device_type: deviceType,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,token' })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Register push token error:', error);
      return { data: null, error };
    }
  },

  /**
   * Get push notification preferences
   */
  async getPushPreferences() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('push_notification_preferences')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (error) throw error;

      // Create default preferences if none exist
      if (!data) {
        const { data: newPrefs, error: createError } = await supabase
          .from('push_notification_preferences')
          .insert({
            user_id: session.user.id,
            social_enabled: true,
            referral_enabled: true,
            reservation_enabled: true,
            order_enabled: true,
            events_enabled: true,
          })
          .select()
          .single();

        if (createError) throw createError;
        return { data: newPrefs, error: null };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Get push preferences error:', error);
      return { data: null, error };
    }
  },

  /**
   * Update push notification preferences
   */
  async updatePushPreferences(preferences: {
    socialEnabled?: boolean;
    referralEnabled?: boolean;
    reservationEnabled?: boolean;
    orderEnabled?: boolean;
    eventsEnabled?: boolean;
  }) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const updateData: any = { updated_at: new Date().toISOString() };
      if (preferences.socialEnabled !== undefined) updateData.social_enabled = preferences.socialEnabled;
      if (preferences.referralEnabled !== undefined) updateData.referral_enabled = preferences.referralEnabled;
      if (preferences.reservationEnabled !== undefined) updateData.reservation_enabled = preferences.reservationEnabled;
      if (preferences.orderEnabled !== undefined) updateData.order_enabled = preferences.orderEnabled;
      if (preferences.eventsEnabled !== undefined) updateData.events_enabled = preferences.eventsEnabled;

      const { data, error } = await supabase
        .from('push_notification_preferences')
        .update(updateData)
        .eq('user_id', session.user.id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Update push preferences error:', error);
      return { data: null, error };
    }
  },
};
