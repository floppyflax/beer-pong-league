import { useState, useEffect, useCallback } from 'react';
import { premiumService } from '../services/PremiumService';

/**
 * Hook to check if a user has premium access
 * Follows architecture pattern: Service layer abstraction via custom hooks
 */
export function usePremium(userId: string | null | undefined): {
  isPremium: boolean;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    const checkPremium = async () => {
      if (!userId) {
        setIsPremium(false);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const premium = await premiumService.isPremium(userId, null);
        setIsPremium(premium);
      } catch (err) {
        console.error('Error checking premium status:', err);
        setError(err as Error);
        setIsPremium(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkPremium();
  }, [userId, refetchTrigger]);

  const refetch = useCallback(() => {
    setRefetchTrigger((t) => t + 1);
  }, []);

  return { isPremium, isLoading, error, refetch };
}
