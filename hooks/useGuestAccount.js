import { useCallback, useEffect, useState } from "react";
import { hasRealAccount } from "@/lib/guestAccount";

export function useGuestAccount() {
  const [isGuest, setIsGuest] = useState(true);
  const [accountReady, setAccountReady] = useState(false);

  const refreshGuestAccount = useCallback(async () => {
    const real = await hasRealAccount();
    const guest = !real;
    setIsGuest(guest);
    setAccountReady(true);
    return { isGuest: guest };
  }, []);

  useEffect(() => {
    refreshGuestAccount();
  }, [refreshGuestAccount]);

  return {
    isGuest,
    accountReady,
    refreshGuestAccount,
  };
}
