# Correção pontual do reset pelo Perfil — destino v1.1.2

Data: 30/10/2026. Validação do código, sem bump, build APK/AAB, tag, commit ou release desta etapa. Versão do projeto preservada em 1.1.1 / versionCode 3. As alterações anteriores da correção de splash 1.1.1 e o arquivo preexistente setority-log.txt foram preservados.

## Escopo e rastreabilidade

RF-01 (autenticação), RNF-01/02 (clareza e feedback), RNF-05 (Android), RNF-11 (identidade autenticada), RNF-14/15 (serviço centralizado/reuso). Sem mudanças em RN-03/04/11/14, dados de estoque, isolamento, Firestore, Rules, SessionProvider, navegação, splash ou Boot nesta etapa. Nenhuma dependência adicionada.

## Investigação e causa

Auditados ContaScreen, SessionProvider, resolver/conversor de sessão, serviço nativo/web, utilitários Auth, RecuperarSenhaScreen, modal e callbacks/loading.

Constatações anteriores à alteração:

- ContaScreen chamava recuperarSenha(conta.email), usando a conta guardada no estado da sessão. O SessionProvider deriva essa conta do observador Auth e o conversor exige equivalência de UID/e-mail com o perfil. Não foi encontrada uma origem direta no cache de outro estabelecimento. Porém, o envio não revalidava a identidade corrente no momento da confirmação.
- A mensagem genérica era importada diretamente pelo Perfil: causa confirmada da microcopy incorreta.
- O mesmo serviço público suprimia auth/user-not-found e resolvia com sucesso. Reutilizá-lo no Perfil permitia falso sucesso sem envio nesse cenário, demonstrado em teste. Essa supressão é adequada apenas à resposta pública contra enumeração.
- A chamada já era aguardada antes do feedback, com trava em ref, loading e finally. Não foi encontrado sucesso em finally nem ausência de await. setLanguageCode(auth, 'pt') já antecedia sendPasswordResetEmail, na mesma instância obtida de getAuth(getApp()).

**Limite do diagnóstico do incidente:** não há evidência da chamada original que deixou de chegar à caixa postal. Não se comprovou que aquele caso específico retornou user-not-found, usou e-mail desatualizado, sofreu bloqueio de entrega ou foi classificado como spam. Não atribuir a causa de entrega a uma dessas hipóteses como fato. Resolver a Promise do SDK confirma a aceitação da solicitação pelo Firebase, não comprova recebimento na caixa postal.

Referências oficiais consultadas: [React Native Firebase: sendPasswordResetEmail](https://reference.rnfirebase.io/_react-native-firebase/auth/sendPasswordResetEmail.html), [setLanguageCode](https://reference.rnfirebase.io/_react-native-firebase/auth/setLanguageCode.html) e [proteção contra enumeração](https://docs.cloud.google.com/identity-platform/docs/admin/email-enumeration-protection). A proteção pode suprimir erros para endereços inexistentes; não foi alterada qualquer configuração externa.

## Correção e fonte do e-mail

ContaScreen chama recuperarSenhaDaConta(conta.uid), sem receber e-mail manual. O serviço lê obterAuth().currentUser.email no momento da ação, exige usuário atual com o mesmo UID da sessão, valida e aplica trim ao e-mail. Ausência de usuário, UID divergente, e-mail vazio/null/ausente/inválido bloqueiam a chamada Firebase.

O envio é centralizado em enviarRedefinicaoSenha, função interna única com setLanguageCode(auth, 'pt') e sendPasswordResetEmail. Após aguardar o idioma, o Perfil revalida UID/e-mail para bloquear logout, troca de conta ou mudança de e-mail durante a espera. A trava de concorrência é compartilhada com o fluxo público e liberada em finally. Erros do SDK não são suprimidos no Perfil.

## Contextos e feedback

Público, preservado sem alteração na tela:

> Se existir uma conta com este e-mail, enviaremos instruções para redefinir sua senha.

Perfil, somente após resolução bem-sucedida da Promise do serviço:

> Enviamos as instruções de redefinição de senha para seu e-mail.

Confirmação do Perfil: “Enviaremos um link de redefinição para o e-mail da sua conta.” Ações Cancelar/Enviar preservadas. Não há campo para redigitar e-mail.

Sem e-mail: “Não foi possível identificar o e-mail desta conta.” Offline: “Não foi possível enviar o e-mail. Verifique sua conexão e tente novamente.” Falhas não mostram sucesso; loading é liberado e pode-se tentar de novo. Erros não expõem códigos, stack ou mensagem técnica. Logout mantém o tratamento anterior. Nenhum log de senha, token, link de reset ou e-mail foi adicionado.

## Testes automatizados — PASS

- TypeScript: npx --no-install tsc --noEmit, sem erros.
- Auth/recuperação/Conta: 31/31.
- Lógica/serviços/UI, incluindo Auth: 149/149.
- Expo Doctor: 18/18.
- Rules: 551/551, exclusivamente emulators:exec com demo-estoque-local e emuladores locais Auth/Firestore; sem deploy nem alteração de Rules.
- git diff --check: PASS.

Cobertura adicionada: currentUser como fonte, UID A/B, trim/idioma/ordem, e-mail ausente ou inválido, sessão ausente/trocada, troca durante configuração de idioma, propagação de user-not-found no Perfil, erro offline/inesperado, sucesso somente após Promise, mensagens distintas, ausência de entrada manual, duplo toque, trava compartilhada, liberação após falha, retry e retorno após unmount. O fluxo público mantém sucesso genérico para user-not-found.

## Android

Pixel_6_API_36, development build x86_64 já existente, instalado sem compilar novo APK; código atual servido pelo Metro. Emulador visível no monitor principal, canto direito, retângulo 1066,60–1506,796. adb device e sys.boot_completed=1 conferidos. Nenhum Android Studio aberto, resolução/DPI do AVD preservados.

Fluxo público: PASS no Android para Login → Esqueci minha senha, obrigatório, inválido, endereço sintético válido, falha offline com Active default network:none e ausência de sucesso, botão liberado, reconexão e retry com resposta genérica. Rede Wi-Fi/dados restaurada. Endereço sintético não exige recebimento real; não é evidência de entrega.

Perfil no Android: PASS, usando conta real existente com login digitado pelo próprio usuário na janela do emulador. Conta acessível após login; modal confirmou envio ao e-mail da conta sem campo manual (zero EditTexts no modal). Com Wi-Fi/dados desativados e Active default network:none, a tentativa exibiu “Não foi possível enviar o e-mail. Verifique sua conexão e tente novamente.”, nenhum feedback de sucesso, modal fechado e ação Redefinir senha habilitada novamente. Rede restaurada; a nova tentativa online resolveu e mostrou “Enviamos as instruções de redefinição de senha para seu e-mail.”, sem mensagem pública. Botão liberado após conclusão. Nenhuma senha foi recebida pelo agente. Não houve cadastro, onboarding ou escrita de documentos Firestore para testar o Perfil; apenas leituras normais da sessão existente e solicitação Auth.

A54: usuário ativou depuração USB/Wi-Fi; apareceu temporariamente offline e não houve conexão ADB utilizável até esta revisão. O development build disponível contém somente x86_64. Não foi compilado APK ARM64, respeitando a proibição desta etapa. Não se alega validação física do código corrigido.

## Recebimento real e idioma

PASS. Solicitação pelo Perfil da conta real concluída com sucesso no SDK nativo e recebimento confirmado manualmente pelo usuário nesta etapa: “chegou, em portugues certo, link vãlido”. Idioma: português. Link: válido conforme conferência do usuário. Não foi necessário concluir outra redefinição. Caixa postal não acessada automaticamente; nenhuma credencial solicitada ou registrada. Esta confirmação é específica do envio desta correção; não reutiliza a confirmação histórica de outra etapa.

## Arquivos desta etapa

- src/screens/conta/ContaScreen.tsx
- src/services/firebase/session.ts
- src/services/firebase/session.web.ts
- src/utils/auth.ts
- tests/conta.test.cjs
- tests/recuperacao-senha.test.cjs
- docs/VALIDACAO_CORRECAO_RESET_PERFIL_v1.1.2.md

## Pendências

Nenhuma pendência funcional para o fluxo validado: público e Perfil online/offline, erros, concorrência automatizada e recebimento real aprovados. Validação ocorreu no Android Emulator com código atual e SDK nativo, usando conta real existente. A54 permaneceu indisponível via ADB; não se alega teste físico do código corrigido.

A causa de não recebimento do incidente anterior permanece sem comprovação histórica; os defeitos demonstrados no código e as hipóteses de entrega estão diferenciados acima. Isso não altera a evidência atual de recebimento real após solicitação pelo Perfil.

Release continua fora do escopo: sem bump 1.1.2, geração de APK/AAB, tag, commit ou publicação. Os artefatos e alterações anteriores 1.1.1 permanecem preservados.

## Resultado

CORREÇÃO RESET PELO PERFIL APROVADA PARA v1.1.2
