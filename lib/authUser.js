/**
 * Statut auth depuis le JWT Supabase (user.is_anonymous / email), jamais localStorage.
 */

export function getAuthUserEmail(user) {
  if (!user) return null;
  const email = user.email || user.user_metadata?.email;
  return email ? String(email).trim() : null;
}

export function isPermanentAuthUser(user) {
  if (!user?.id) return false;
  if (user.is_anonymous === true) return false;
  if (user.is_anonymous === false) return true;
  return Boolean(getAuthUserEmail(user));
}

export function isAnonymousAuthUser(user) {
  if (!user?.id) return false;
  if (user.is_anonymous === true) return true;
  if (user.is_anonymous === false) return false;
  return !getAuthUserEmail(user);
}
