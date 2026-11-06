import { StyleSheet, Text } from 'react-native';
import type { Movimentacao } from '../../types/movimentacao.types';
import { colors, typography } from '../../theme';

export function VendedorLinha({ movimento }: { movimento: Pick<Movimentacao, 'tipo' | 'vendedorNome'> }) {
  return movimento.tipo === 'saida' && movimento.vendedorNome
    ? <Text style={styles.texto}>Vendedor: {movimento.vendedorNome}</Text> : null;
}
const styles = StyleSheet.create({ texto: { ...typography.caption, color: colors.textSecondary, flexShrink: 1 } });
