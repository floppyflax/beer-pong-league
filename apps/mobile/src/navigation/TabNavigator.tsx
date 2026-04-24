/**
 * TabNavigator — Everything ELO 5-tab bar (Phase C.5)
 * Tabs: Accueil | Classement | Rejoindre | Historique | Profil
 */

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '../theme/tokens';

import { HomeScreen }        from '../screens/HomeScreen';
import { LeaderboardScreen } from '../screens/LeaderboardScreen';
import { JoinScreen }        from '../screens/JoinScreen';
import { HistoryScreen }     from '../screens/HistoryScreen';
import { ProfileScreen }     from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

type IoniconsName = keyof typeof Ionicons.glyphMap;

const TAB_ICONS: Record<string, IoniconsName> = {
  Home:        'home',
  Leaderboard: 'podium',
  Join:        'qr-code',
  History:     'time',
  Profile:     'person',
};

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => (
          <Ionicons
            name={TAB_ICONS[route.name] ?? 'ellipse'}
            size={size}
            color={color}
          />
        ),
        tabBarActiveTintColor: palette.electricBlue,
        tabBarInactiveTintColor: palette.coolGray,
        tabBarStyle: {
          backgroundColor: palette.navySoft,
          borderTopColor: palette.cardBorder,
          borderTopWidth: 1,
          paddingBottom: 4,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 0.3,
          textTransform: 'uppercase',
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: 'Accueil' }}
      />
      <Tab.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{ tabBarLabel: 'Classement' }}
      />
      <Tab.Screen
        name="Join"
        component={JoinScreen}
        options={{
          tabBarLabel: 'Rejoindre',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="qr-code" size={size + 2} color={palette.electricBlue} />
          ),
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{ tabBarLabel: 'Historique' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profil' }}
      />
    </Tab.Navigator>
  );
}
