/**
 * App — Beer Pong ELO mobile (Phase C)
 */

import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { RootNavigator } from './src/navigation/RootNavigator';
import { palette, colors } from './src/theme/tokens';

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

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer theme={AppTheme}>
        <StatusBar style="light" backgroundColor={palette.navy} />
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
