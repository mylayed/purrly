// Email, введений на екрані входу, — щоб не набирати його вдруге на «Забули пароль».
// Тримаємо в пам'яті, а не в параметрах маршруту: у web вони потрапили б в URL та історію.
let emailDraft = '';

export function setEmailDraft(email: string) {
  emailDraft = email.trim();
}

export function getEmailDraft() {
  return emailDraft;
}
