import { ActivityIndicator, Image, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, spacing, typography } from '../theme';
import { obterVersaoApp } from '../utils/versaoApp';

export default function BootScreen({ erro }: { erro?: boolean }) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  // As margens transparentes oficiais mantêm o símbolo na escala da splash Android.
  const tamanho = Math.min(216, width - insets.left - insets.right - spacing.xxl * 2);
  const topo = (height - tamanho) / 2;
  const versao = obterVersaoApp();
  return <View style={styles.area} accessibilityLiveRegion="polite">
    <Image source={require('../../assets/setority-adaptive-foreground.png')} resizeMode="contain"
      accessibilityLabel="Setority" style={[styles.imagem, { width: tamanho, height: tamanho, top: topo, left: (width - tamanho) / 2 }]} />
    <View style={[styles.marca, { top: topo + tamanho - spacing.md }]}>
      <Text style={styles.nome}>Setority</Text>
      <Text style={styles.subtitulo}>Controle de estoque por setores</Text>
    </View>
    <View style={[styles.estado, { bottom: insets.bottom + spacing.xxxl * 2 }]}>
      {erro ? <Text style={styles.erro}>Não foi possível carregar a interface. Reabra o aplicativo.</Text>
        : <ActivityIndicator color={colors.primary} accessibilityLabel="Carregando Setority" />}
    </View>
    {versao ? <Text style={[styles.versao, { left: insets.left + spacing.xxl, bottom: insets.bottom + spacing.lg }]}>v{versao}</Text> : null}
  </View>;
}

const styles = StyleSheet.create({
  area: { flex: 1, backgroundColor: '#F7F9FC' },
  imagem: { position: 'absolute' },
  marca: { position: 'absolute', left: spacing.xxl, right: spacing.xxl, alignItems: 'center' },
  nome: { fontFamily: fonts.bold, fontSize: 32, lineHeight: 42, color: colors.text },
  subtitulo: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
  estado: { position: 'absolute', left: spacing.xxl, right: spacing.xxl, alignItems: 'center' },
  versao: { position: 'absolute', ...typography.caption, color: colors.textSecondary },
  erro: { ...typography.body, color: colors.danger, textAlign: 'center' },
});
