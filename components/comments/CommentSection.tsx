import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useAuth } from '@/hooks/useAuth';
import { useMutation, useQuery } from 'convex/react';
import { router, RelativePathString } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { APPLE_TEXT_STYLES } from '@/constants/fonts';
import { CommentForm } from './CommentForm';
import { CommentItem } from './CommentItem';
import { RegisterPrompt } from './RegisterPrompt';
import { useTheme, Theme } from '@/hooks/useTheme';

interface CommentSectionProps {
  productId: Id<'products'>;
  onInputFocus?: () => void;
}

export function CommentSection({ productId, onInputFocus }: CommentSectionProps) {
  const { user, isRegistered, isAnonymous } = useAuth();
  const { theme } = useTheme();
  const styles = useMemo(() => createThemedStyles(theme), [theme]);

  // Fetch comments
  const comments = useQuery(api.comments.getCommentsForProduct, { productId });
  const hasCommented = useQuery(
    api.comments.hasUserCommented,
    user?._id ? { productId, userId: user._id } : 'skip'
  );

  const addCommentMutation = useMutation(api.comments.addComment);

  const handleSubmitComment = async (text: string): Promise<{ error?: string }> => {
    if (!user?._id) {
      return { error: 'Необходимо авторизоваться' };
    }

    try {
      const result = await addCommentMutation({
        productId,
        userId: user._id,
        text,
      });

      if (result && 'error' in result) {
        return { error: result.error };
      }

      return {};
    } catch (e) {
      return { error: 'Не удалось отправить комментарий' };
    }
  };

  const handleRegisterPress = () => {
    router.push('/auth/register' as RelativePathString);
  };

  const commentsCount = comments?.length ?? 0;
  const canComment = isRegistered && !hasCommented?.hasCommented;
  const showBlurred = isAnonymous;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[APPLE_TEXT_STYLES.title2, styles.headerTitle]}>
          Комментарии
        </Text>
        <View style={styles.countBadge}>
          <Text style={[APPLE_TEXT_STYLES.caption1, styles.countText]}>
            {commentsCount}
          </Text>
        </View>
      </View>

      {/* Comment Form or Register Prompt */}
      {isAnonymous ? (
        <RegisterPrompt variant="comment" />
      ) : canComment ? (
        <CommentForm onSubmit={handleSubmitComment} onInputFocus={onInputFocus} />
      ) : hasCommented?.hasCommented ? (
        <View style={styles.alreadyCommented}>
          <Text style={[APPLE_TEXT_STYLES.subhead, styles.alreadyCommentedText]}>
            Вы уже оставили комментарий к этому продукту
          </Text>
        </View>
      ) : null}

      {/* Comments List */}
      <View style={styles.commentsList}>
        {comments === undefined ? (
          <View style={styles.loadingContainer}>
            <Text style={[APPLE_TEXT_STYLES.body, styles.loadingText]}>
              Загрузка комментариев...
            </Text>
          </View>
        ) : comments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[APPLE_TEXT_STYLES.body, styles.emptyText]}>
              Пока нет комментариев.
              {isRegistered && ' Будьте первым!'}
            </Text>
          </View>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment._id}
              displayName={comment.user.displayName}
              avatarUrl={comment.user.avatarUrl}
              text={comment.text}
              createdAt={comment.createdAt}
              updatedAt={comment.updatedAt}
              isBlurred={showBlurred}
              onRegisterPress={handleRegisterPress}
            />
          ))
        )}
      </View>
    </View>
  );
}

const createThemedStyles = (theme: Theme) => StyleSheet.create({
  container: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    color: theme.text,
  },
  countBadge: {
    backgroundColor: theme.backgroundSecondary,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 10,
  },
  countText: {
    color: theme.textSecondary,
    fontWeight: '600',
  },
  alreadyCommented: {
    backgroundColor: theme.backgroundSecondary,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  alreadyCommentedText: {
    color: theme.textSecondary,
    textAlign: 'center',
  },
  commentsList: {
    marginTop: 8,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: theme.textSecondary,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: theme.textSecondary,
    textAlign: 'center',
  },
});
