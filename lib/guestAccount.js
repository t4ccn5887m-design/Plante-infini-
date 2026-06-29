import { getCloudSession } from "./cloudSync";
import { isPermanentAuthUser } from "./authUser";

export async function hasRealAccount() {
  try {
    const session = await getCloudSession();
    return isPermanentAuthUser(session?.user);
  } catch {
    return false;
  }
}
