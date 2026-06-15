import { isPermanentAuthUser } from "./authUser";
import { readOnboardingVuFlag } from "./welcomeSlides";

/** Log des 3 mémoires au démarrage : onboarding, session, trouvailles. */
export function logPersistenceBootState(session, discoveriesCount = null) {
  const user = session?.user;
  console.info("[wilder:persistence] boot", {
    onboarding_vu: readOnboardingVuFlag(),
    sessionPresent: Boolean(session?.access_token),
    user_id: user?.id ?? null,
    is_permanent: isPermanentAuthUser(user),
    is_anonymous: user?.is_anonymous ?? null,
    discoveries_loaded: discoveriesCount,
  });
}
