export const removeSpecial = (str: string) => str.replace(/^\P{Letter}*|\P{Letter}*$/gu, '');
