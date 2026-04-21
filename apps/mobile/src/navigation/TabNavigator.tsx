import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/tokens';

import { HomeScreen } from '../screens/HomeScreen';
import { TournamentsScreen } from '../screens/TournamentsScreen';
import { JoinScreen } from '../screens/JoinScreen';
import { LeaguesScreen } from '../screens/LeaguesScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Home: 'home',
  Tournaments: 'trophy',
  Join: 'qr-code',
  Leagues: 'shield',
  Profile: 'person',
};

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={TAB_ICONS[route.name] ?? 'ellipse'} size={size} color={color} />
        ),
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text.muted,
        tabBarStyle: {
          backgroundColor: colors.bg.secondary,
          borderTopColor: colors.border.card,
          borderTopWidth: 1,
          paddingBottom: 4,
          height: 56,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Accueil' }} />
      <Tab.Screen name="Tournaments" component={TournamentsScreen} options={{ tabBarLabel: 'Tournois' }} />
      <Tab.Screen name="Join" component={JoinScreen} options={{ tabBarLabel: 'Rejoindre' }} />
      <Tab.Screen name="Leagues" component={LeaguesScreen} options={{ tabBarLabel: 'Ligues' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Profil' }} />
    </Tab.Navigator>
  );
}
