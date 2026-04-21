import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../theme/tokens';
import { TabNavigator } from './TabNavigator';
import { TournamentDetailScreen } from '../screens/TournamentDetailScreen';
import { LeagueDetailScreen } from '../screens/LeagueDetailScreen';
import { CreateTournamentScreen } from '../screens/CreateTournamentScreen';
import { CreateLeagueScreen } from '../screens/CreateLeagueScreen';

export type RootStackParamList = {
  Tabs: undefined;
  TournamentDetail: { id: string };
  LeagueDetail: { id: string };
  CreateTournament: undefined;
  CreateLeague: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg.secondary },
        headerTintColor: colors.text.primary,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: colors.bg.primary },
      }}
    >
      <Stack.Screen name="Tabs" component={TabNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="TournamentDetail" component={TournamentDetailScreen} options={{ title: 'Tournoi' }} />
      <Stack.Screen name="LeagueDetail" component={LeagueDetailScreen} options={{ title: 'Ligue' }} />
      <Stack.Screen name="CreateTournament" component={CreateTournamentScreen} options={{ title: 'Nouveau Tournoi' }} />
      <Stack.Screen name="CreateLeague" component={CreateLeagueScreen} options={{ title: 'Nouvelle Ligue' }} />
    </Stack.Navigator>
  );
}
