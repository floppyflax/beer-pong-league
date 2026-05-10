/**
 * App — Beer Pong ELO mobile
 */

import { useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import Toast from 'react-native-toast-message';
import { AuthProvider, IdentityProvider, SportProvider, getSupabase } from '@elofight/shared';
import { RootNavigator } from './src/navigation/RootNavigator';
import { palette } from './src/theme/tokens';
import { bootstrapShared } from './src/lib/bootstrap';

bootstrapShared();

const AppTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary:      palette.electricBlue,
    background:   palette.navy,
    card:         palette.navySoft,
    text:         palette.white,
    border:       palette.cardBorder,
    notification: palette.signalRed,
  },
};

const linking = {
  prefixes: [Linking.createURL('/'), 'elofight://'],
  config: {
    screens: {
      Tabs:         '',
      EventDetail:  'event/:id',
      LeagueDetail: 'league/:id',
      Auth:         'auth',
    },
  },
};

function DeepLinkHandler() {
  useEffect(() => {
    const handleUrl = async (url: string) => {
      if (!url) return;
      const parsed = Linking.parse(url);

      if (parsed.path?.startsWith('auth/callback')) {
        const supabase = getSupabase();
        if (!supabase) return;
        const fragment = url.split('#')[1] ?? '';
        const params = new URLSearchParams(fragment);
        const accessToken  = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        if (accessToken && refreshToken) {
          await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        }
      }
    };

    Linking.getInitialURL().then((url) => { if (url) void handleUrl(url); });
    const sub = Linking.addEventListener('url', (e) => void handleUrl(e.url));
    return () => sub.remove();
  }, []);

  return null;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <IdentityProvider>
          <SportProvider>
            <NavigationContainer theme={AppTheme} linking={linking}>
              <StatusBar style="light" backgroundColor={palette.navy} />
              <DeepLinkHandler />
              <RootNavigator />
            </NavigationContainer>
            <Toast />
          </SportProvider>
        </IdentityProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
