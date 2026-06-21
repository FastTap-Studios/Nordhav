import { useCallback, useEffect, useState } from "react";
import { HomepageSpotlight } from "../types";
import { homepageSpotlightService } from "../services/homepageSpotlights";
import { DEFAULT_HOMEPAGE_SPOTLIGHTS } from "../lib/homepageSpotlights";

export function useHomepageSpotlights() {
  const [spotlights, setSpotlights] = useState<HomepageSpotlight[]>(DEFAULT_HOMEPAGE_SPOTLIGHTS);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await homepageSpotlightService.getAll();
      setSpotlights(data);
    } catch (error) {
      console.error("[homepageSpotlights] load failed:", error);
      setSpotlights(DEFAULT_HOMEPAGE_SPOTLIGHTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const activeSpotlights = spotlights.filter((item) => item.isActive);

  return { spotlights: activeSpotlights, loading, refresh };
}
