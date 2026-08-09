import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface BookmarkedArticle {
  id: string;
  title: string;
  description?: string;
  url: string;
  imageUrl?: string;
  source?: string;
  category?: string;
  publishedAt: string;
}

interface BookmarkState {
  bookmarks: Record<string, BookmarkedArticle>;
  toggleBookmark: (article: BookmarkedArticle) => void;
  isBookmarked: (id: string) => boolean;
}

export const useBookmarkStore = create<BookmarkState>()(
  persist(
    (set, get) => ({
      bookmarks: {},
      toggleBookmark: (article) => {
        set((state) => {
          const exists = !!state.bookmarks[article.id];
          const newBookmarks = { ...state.bookmarks };
          if (exists) {
            delete newBookmarks[article.id];
          } else {
            newBookmarks[article.id] = article;
          }
          return { bookmarks: newBookmarks };
        });
      },
      isBookmarked: (id) => !!get().bookmarks[id],
    }),
    {
      name: 'devforge-bookmarks',
    }
  )
);
