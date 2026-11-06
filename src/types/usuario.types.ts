/** Perfil da aplicação, separado do User interno do Firebase Authentication. */
export type Usuario = {
  id: string;
  email: string;
  estabelecimentoId: string;
};
