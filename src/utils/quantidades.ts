export function quantidadeInteiraNaoNegativa(quantidade: number): boolean {
  return Number.isFinite(quantidade) && Number.isInteger(quantidade) && quantidade >= 0;
}
