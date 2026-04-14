import AsyncStorage from '@react-native-async-storage/async-storage';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { ValidationEventName } from '@/src/constants/validation';

type EventValue = string | number | boolean | null;

export type AnalyticsEventProperties = Record<string, EventValue | EventValue[]>;

export type AnalyticsEventInput = {
  name: ValidationEventName;
  properties?: AnalyticsEventProperties;
};

type AnalyticsProvider = {
  identifyUser: (userId: string, traits?: AnalyticsEventProperties) => Promise<void>;
  trackEvent: (event: AnalyticsEventInput & { userId?: string }) => Promise<void>;
  resetAnalytics: () => Promise<void>;
};

const USER_ANALYTICS_STATE_KEY = '@side_quest_life/analytics_state_v1';

type UserAnalyticsState = {
  firstOpenedAt: string;
  returnedDay2Tracked: boolean;
  returnedDay7Tracked: boolean;
};

type AnalyticsStateMap = Record<string, UserAnalyticsState>;

const consoleProvider: AnalyticsProvider = {
  async identifyUser(userId, traits) {
    console.log('[analytics.identify]', { userId, traits });
  },
  async trackEvent(event) {
    console.log('[analytics.event]', event);
  },
  async resetAnalytics() {
    console.log('[analytics.reset]');
  },
};

const supabaseProvider: AnalyticsProvider = {
  async identifyUser(userId, traits) {
    if (!isSupabaseConfigured()) return;
    if (!traits) return;
    const upsertPayload: Record<string, unknown> = {};
    if (typeof traits.intensityPreference === 'string') {
      upsertPayload.intensity_preference = traits.intensityPreference;
    }
    if (Array.isArray(traits.preferredCategories)) {
      upsertPayload.preferred_categories = traits.preferredCategories;
    }
    if (Object.keys(upsertPayload).length === 0) return;
    await supabase.from('profiles').update(upsertPayload).eq('id', userId);
  },
  async trackEvent(event) {
    if (!isSupabaseConfigured()) return;
    await supabase.from('analytics_events').insert({
      user_id: event.userId ?? null,
      event_name: event.name,
      properties: event.properties ?? {},
      occurred_at: new Date().toISOString(),
    });
  },
  async resetAnalytics() {
    // App-level reset stays local only for now.
  },
};

async function readAnalyticsState(): Promise<AnalyticsStateMap> {
  const raw = await AsyncStorage.getItem(USER_ANALYTICS_STATE_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as AnalyticsStateMap;
    return parsed ?? {};
  } catch {
    return {};
  }
}

async function writeAnalyticsState(state: AnalyticsStateMap): Promise<void> {
  await AsyncStorage.setItem(USER_ANALYTICS_STATE_KEY, JSON.stringify(state));
}

class AnalyticsService {
  private providers: AnalyticsProvider[] = [consoleProvider, supabaseProvider];
  private userId: string | null = null;
  private lastAppOpenedAtMs: number | null = null;

  async identifyUser(userId: string, traits?: AnalyticsEventProperties): Promise<void> {
    this.userId = userId;
    await Promise.allSettled(
      this.providers.map((provider) => provider.identifyUser(userId, traits))
    );
  }

  async resetAnalytics(): Promise<void> {
    this.userId = null;
    await Promise.allSettled(
      this.providers.map((provider) => provider.resetAnalytics())
    );
  }

  async trackEvent(name: ValidationEventName, properties?: AnalyticsEventProperties): Promise<void> {
    const payload: AnalyticsEventInput & { userId?: string } = {
      name,
      userId: this.userId ?? undefined,
      properties: {
        ...(properties ?? {}),
        timestamp: new Date().toISOString(),
      },
    };
    await Promise.allSettled(
      this.providers.map((provider) => provider.trackEvent(payload))
    );
  }

  async trackAppOpened(sourceScreen: string): Promise<void> {
    const nowMs = Date.now();
    if (this.lastAppOpenedAtMs && nowMs - this.lastAppOpenedAtMs < 5000) {
      return;
    }
    this.lastAppOpenedAtMs = nowMs;

    await this.trackEvent('app_opened', { sourceScreen });

    if (!this.userId) return;

    const state = await readAnalyticsState();
    const existing = state[this.userId];
    const now = new Date();
    if (!existing) {
      state[this.userId] = {
        firstOpenedAt: now.toISOString(),
        returnedDay2Tracked: false,
        returnedDay7Tracked: false,
      };
      await writeAnalyticsState(state);
      return;
    }

    const firstOpenedAt = new Date(existing.firstOpenedAt);
    const daysSinceFirstOpen = Math.floor(
      (now.getTime() - firstOpenedAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (!existing.returnedDay2Tracked && daysSinceFirstOpen >= 2) {
      await this.trackEvent('returned_day_2', { daysSinceFirstOpen, sourceScreen });
      existing.returnedDay2Tracked = true;
    }
    if (!existing.returnedDay7Tracked && daysSinceFirstOpen >= 7) {
      await this.trackEvent('returned_day_7', { daysSinceFirstOpen, sourceScreen });
      existing.returnedDay7Tracked = true;
    }

    state[this.userId] = existing;
    await writeAnalyticsState(state);
  }
}

const analytics = new AnalyticsService();

export async function identifyUser(
  userId: string,
  traits?: AnalyticsEventProperties
): Promise<void> {
  await analytics.identifyUser(userId, traits);
}

export async function trackEvent(
  name: ValidationEventName,
  properties?: AnalyticsEventProperties
): Promise<void> {
  await analytics.trackEvent(name, properties);
}

export async function trackAppOpened(sourceScreen = 'root_layout'): Promise<void> {
  await analytics.trackAppOpened(sourceScreen);
}

export async function resetAnalytics(): Promise<void> {
  await analytics.resetAnalytics();
}
