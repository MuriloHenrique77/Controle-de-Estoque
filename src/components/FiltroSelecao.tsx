import React, { useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radii, spacing, touchTarget, typography } from '../theme';

type Opcao = { id: string; nome: string };
type Props = { titulo: string; todos: string; opcoes: Opcao[]; valor?: string; disabled?: boolean; onChange: (id?: string) => void };
export default function FiltroSelecao({ titulo, todos, opcoes, valor, onChange, disabled }: Props) {
  const [aberto, setAberto] = useState(false), [busca, setBusca] = useState('');
  const escolhido = valor ? opcoes.find(o => o.id === valor)?.nome ?? 'Seleção indisponível' : todos;
  const termo = busca.trim().toLocaleLowerCase('pt-BR');
  const itens = [{ id: '', nome: todos }, ...opcoes.filter(o => o.nome.toLocaleLowerCase('pt-BR').includes(termo))];
  return <View style={styles.campo}>
    <Text style={styles.label}>{titulo}</Text>
    <Pressable accessibilityRole="button" accessibilityLabel={'Selecionar ' + titulo.toLowerCase()}
      accessibilityState={{ disabled }} disabled={disabled} style={[styles.botao, disabled && styles.disabled]}
      onPress={() => { setBusca(''); setAberto(true); }}>
      <Text style={styles.nome}>{escolhido}</Text><Text style={styles.indicador}>Selecionar</Text>
    </Pressable>
    <Modal visible={aberto} animationType="slide" onRequestClose={() => setAberto(false)}>
      <SafeAreaView style={styles.modal}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Text style={styles.titulo}>Selecionar {titulo.toLowerCase()}</Text>
        <TextInput accessibilityLabel={'Buscar ' + titulo.toLowerCase()} placeholder="Buscar por nome"
          style={styles.busca} value={busca} onChangeText={setBusca} />
        <FlatList data={itens} keyExtractor={o => o.id} keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => <Pressable accessibilityRole="button" accessibilityLabel={item.nome}
            accessibilityState={{ selected: item.id === (valor ?? '') }} style={styles.opcao}
            onPress={() => { onChange(item.id || undefined); setAberto(false); }}>
            <Text style={styles.nome}>{item.nome}{item.id === (valor ?? '') ? ' • Selecionado' : ''}</Text>
          </Pressable>} />
        <Pressable accessibilityRole="button" style={styles.fechar} onPress={() => setAberto(false)}><Text style={styles.nome}>Fechar seleção</Text></Pressable>
      </KeyboardAvoidingView></SafeAreaView>
    </Modal>
  </View>;
}
const styles = StyleSheet.create({
  campo: { marginBottom: spacing.lg }, label: { ...typography.label, marginBottom: spacing.sm, color: colors.text },
  botao: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, padding: spacing.lg, minHeight: touchTarget }, disabled: { opacity: 0.55 },
  nome: { ...typography.body, color: colors.text, flexShrink: 1 }, indicador: { ...typography.caption, color: colors.primary, marginTop: spacing.xs },
  modal: { flex: 1, backgroundColor: colors.background, padding: spacing.xl }, titulo: { ...typography.title, color: colors.text, marginBottom: spacing.lg },
  busca: { ...typography.body, color: colors.text, backgroundColor: colors.surface, borderRadius: radii.md, padding: spacing.lg, minHeight: touchTarget, marginBottom: spacing.md },
  opcao: { minHeight: touchTarget, padding: spacing.lg, borderBottomWidth: 1, borderColor: colors.border },
  fechar: { minHeight: touchTarget, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
});
