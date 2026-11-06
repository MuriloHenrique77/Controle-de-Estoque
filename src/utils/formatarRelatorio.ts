const numeros = new Intl.NumberFormat('pt-BR');
const datas = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
export const formatarQuantidadeRelatorio = (quantidade: number) => numeros.format(quantidade);
export const formatarDataRelatorio = (data: Date) => datas.format(data);
