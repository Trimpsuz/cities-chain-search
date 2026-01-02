export const removeSpecial = (str: string) => str.replace(/^[^\p{L}\p{M}]+|[^\p{L}\p{M}]+$/gu, '');
