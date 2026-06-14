import { useCallback, useEffect, useState } from "react";
import {
  getGuestScanCount,
  GUEST_SCAN_LIMIT,
  hasRealAccount,
  incrementGuestScanCount,
} from "@/lib/guestAccount";

export function useGuestAccount() {
  const [isGuest, setIsGuest] = useState(true);
  const [guestScanCount, setGuestScanCount] = useState(0);
  const [guestCanScan, setGuestCanScan] = useState(true);
  const [accountReady, setAccountReady] = useState(false);

  const refreshGuestAccount = useCallback(async () => {
    const real = await hasRealAccount();
    const guest = !real;
    setIsGuest(guest);
    if (typeof window !== "undefined") {
      const count = getGuestScanCount();
      setGuestScanCount(count);
      setGuestCanScan(guest ? count < GUEST_SCAN_LIMIT : true);
    }
    setAccountReady(true);
    return { isGuest: guest, guestScanCount: getGuestScanCount() };
  }, []);

  useEffect(() => {
    refreshGuestAccount();
  }, [refreshGuestAccount]);

  const recordGuestScan = useCallback(() => {
    if (!isGuest) return guestScanCount;
    const next = incrementGuestScanCount();
    setGuestScanCount(next);
    setGuestCanScan(next < GUEST_SCAN_LIMIT);
    return next;
  }, [isGuest, guestScanCount]);

  return {
    isGuest,
    guestScanCount,
    guestScanLimit: GUEST_SCAN_LIMIT,
    guestCanScan,
    accountReady,
    refreshGuestAccount,
    recordGuestScan,
  };
}
