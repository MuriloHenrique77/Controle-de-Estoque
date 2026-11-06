import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { AuthenticatedTabParamList } from './types';
import StockNavigator from './StockNavigator';
import HomeScreen from '../screens/home/HomeScreen';
import MovimentacoesScreen from '../screens/movimentacoes/MovimentacoesScreen';
import RelatoriosScreen from '../screens/relatorios/RelatoriosScreen';
import AccountButton from '../components/AccountButton';
import { colors, fonts, spacing } from '../theme';
import { appHeaderOptions } from '../theme/navigation';
const Tab = createBottomTabNavigator<AuthenticatedTabParamList>();
const icons = { Inicio: 'home-outline', Estoque: 'cube-outline', Movimentacoes: 'swap-vertical-outline', Relatorios: 'bar-chart-outline' } as const;
const labels = { Inicio: 'Início', Estoque: 'Estoque', Movimentacoes: 'Movimentações', Relatorios: 'Relatórios' } as const;
export default function AuthenticatedNavigator() {
  const insets = useSafeAreaInsets();
  return <Tab.Navigator initialRouteName="Inicio" backBehavior="history" screenOptions={({ route }) => ({
    ...appHeaderOptions, headerRight: () => <AccountButton />, tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.tabInactive,
    tabBarHideOnKeyboard: true, tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 11, lineHeight: 16 },
    tabBarLabel: ({ color }) => <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}
      style={{ fontFamily: fonts.medium, fontSize: 11, lineHeight: 16, color, textAlign: 'center', width: '100%' }}>{labels[route.name]}</Text>,
    tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, height: 64 + insets.bottom, paddingTop: spacing.sm, paddingBottom: Math.max(insets.bottom, spacing.sm) },
    tabBarAccessibilityLabel: `Aba ${labels[route.name]}`,
    tabBarIcon: ({ color, size }) => <Ionicons name={icons[route.name]} color={color} size={size} />,
  })}>
    <Tab.Screen name="Inicio" component={HomeScreen} options={{ title: 'Início' }} />
    <Tab.Screen name="Estoque" component={StockNavigator} options={{ title: 'Estoque', headerShown: false }} />
    <Tab.Screen name="Movimentacoes" component={MovimentacoesScreen} options={{ title: 'Movimentações' }} />
    <Tab.Screen name="Relatorios" component={RelatoriosScreen} options={{ title: 'Relatórios' }} />
  </Tab.Navigator>;
}
