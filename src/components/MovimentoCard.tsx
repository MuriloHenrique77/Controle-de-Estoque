import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, touchTarget, typography } from '../theme';
import type { MovimentoGlobal } from '../types/visaoEstoque.types';
import { formatarDataRelatorio, formatarQuantidadeRelatorio } from '../utils/formatarRelatorio';
import { AppCard } from './ui/AppCard';
import { VendedorLinha } from './ui/VendedorLinha';
export const MovimentoCard = memo(function MovimentoCard({ registro, abrir }: { registro: MovimentoGlobal; abrir?: () => void }) {
  const entrada = registro.movimento.tipo === 'entrada';
  return <AppCard style={styles.card}><View style={styles.row}>
    <View style={styles.icon}><Ionicons name={entrada ? 'arrow-down-outline' : 'arrow-up-outline'} size={20} color={colors.primary} /></View>
    <View style={styles.info}><Text style={styles.title}>{registro.produto?.nome ?? 'Produto indisponível'}</Text>
      <Text style={styles.caption}>{registro.setor?.nome ?? 'Setor indisponível'}</Text>
      {registro.produto?.status === 'inativo' ? <Text style={styles.caption}>Inativo</Text> : null}</View>
  </View><View style={styles.bottom}>
    <Text style={styles.type}>{entrada ? 'Entrada +' : 'Saída -'}{formatarQuantidadeRelatorio(registro.movimento.quantidade)}</Text>
    <Text style={styles.caption}>{formatarDataRelatorio(registro.movimento.criadoEm)}</Text>
  </View><VendedorLinha movimento={registro.movimento} />{abrir ? <Pressable accessibilityRole="button" accessibilityLabel={'Ver produto ' + registro.produto?.nome}
    onPress={abrir} style={styles.link}><Text style={styles.linkText}>Ver produto</Text></Pressable> : null}</AppCard>;
});
const styles = StyleSheet.create({ card: { marginBottom: spacing.md }, row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: { width: touchTarget, height: touchTarget, borderRadius: radii.md, backgroundColor: colors.primarySoft, justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1 }, title: { ...typography.label, color: colors.text }, caption: { ...typography.caption, color: colors.textSecondary },
  bottom: { marginTop: spacing.md, gap: spacing.xs }, type: { ...typography.label, color: colors.primary },
  link: { minHeight: touchTarget, justifyContent: 'center' }, linkText: { ...typography.label, color: colors.primary } });
