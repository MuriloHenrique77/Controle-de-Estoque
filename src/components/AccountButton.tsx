import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/types';
import { colors, spacing, touchTarget } from '../theme';

export default function AccountButton() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  return <Pressable accessibilityRole="button" accessibilityLabel="Abrir conta"
    onPress={() => navigation.navigate('Conta')} style={styles.button}>
    <Ionicons name="person-circle-outline" size={28} color={colors.primary} />
  </Pressable>;
}
const styles = StyleSheet.create({ button: { minWidth: touchTarget, minHeight: touchTarget,
  paddingHorizontal: spacing.lg, alignItems: 'center', justifyContent: 'center' } });
