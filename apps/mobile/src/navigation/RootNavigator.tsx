/**
 * RootNavigator — Everything ELO navigation (Phase C.5)
 */

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../theme/tokens';
import { TabNavigator } from './TabNavigator';

/* Screens */
import { EventDetailScreen }    from '../screens/EventDetailScreen';
import { LeagueDetailScreen }   from '../screens/LeagueDetailScreen';
import { CreateEventScreen }    from '../screens/CreateEventScreen';
import { CreateLeagueScreen }   from '../screens/CreateLeagueScreen';
import { ScoreScreen }          from '../screens/ScoreScreen';
import { AuthScreen }           from '../screens/AuthScreen';

export type RootStackParamList = {
  Tabs:         undefined;
  EventDetail:  { id: string };
  LeagueDetail: { id: string };
  CreateEvent:  undefined;
  CreateLeague: undefined;
  ScoreRecord:  { contextType: 'tournament' | 'league'; id: string };
  Auth:         undefined;
  /** @deprecated Use EventDetail */
  TournamentDetail: { id: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const headerStyle = {
  headerStyle: { backgroundColor: colors.bg.secondary },
  headerTintColor: colors.text.primary,
  headerTitleStyle: { fontWeight: '700' as const },
  contentStyle: { backgroundColor: colors.bg.primary },
};

export function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={headerStyle}>
      <Stack.Screen
        name="Tabs"
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EventDetail"
        component={EventDetailScreen}
        options={{ headerShown: false }}
      />
      {/* backward compat alias */}
      <Stack.Screen
        name="TournamentDetail"
        component={EventDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="LeagueDetail"
        component={LeagueDetailScreen}
        options={{ title: 'Ligue' }}
      />
      <Stack.Screen
        name="CreateEvent"
        component={CreateEventScreen}
        options={{ title: 'Nouvel Événement' }}
      />
      <Stack.Screen
        name="CreateLeague"
        component={CreateLeagueScreen}
        options={{ title: 'Nouvelle Ligue' }}
      />
      <Stack.Screen
        name="ScoreRecord"
        component={ScoreScreen}
        options={{ title: 'Nouveau Match' }}
      />
      <Stack.Screen
        name="Auth"
        component={AuthScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
