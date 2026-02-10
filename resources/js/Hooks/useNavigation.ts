import { router } from '@inertiajs/react';

/**
 * Navigation utilities for proper back button handling
 */
export function useNavigation() {
  /**
   * Navigate back to the previous page in history, or fallback to a default URL
   * @param fallbackUrl - URL to navigate to if there's no history
   */
  const goBack = (fallbackUrl: string = '/') => {
    // Check if there's actual history to go back to
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // No history, navigate to fallback
      router.get(fallbackUrl);
    }
  };

  /**
   * Navigate back with Inertia, preserving scroll position
   * Useful for multi-step forms where you want to maintain state
   */
  const goBackPreservingState = (fallbackUrl: string = '/') => {
    if (window.history.length > 1) {
      router.visit(window.location.pathname, {
        only: [],
        preserveScroll: true,
        onBefore: () => {
          window.history.back();
        },
      });
    } else {
      router.get(fallbackUrl, {
        preserveScroll: true,
      });
    }
  };

  return {
    goBack,
    goBackPreservingState,
  };
}
