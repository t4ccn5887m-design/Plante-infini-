import { isPermanentAuthUser } from "./authUser";
/** Log des mémoires au démarrage : session et trouvailles. */
export function logPersistenceBootState(session, discoveriesCount = null) {
  const user = session?.user;
  console.info("[wilder:persistence] boot", {
    sessionPresent: Boolean(session?.access_token),
    user_id: user?.id ?? null,
    is_permanent: isPermanentAuthUser(user),
    is_anonymous: user?.is_anonymous ?? null,
    discoveries_loaded: discoveriesCount,
  });
}
