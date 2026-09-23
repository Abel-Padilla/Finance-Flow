import { Redirect } from "expo-router";
import { useSession } from "../src/store/session";
export default function Index() {
  const { user } = useSession();
  return (
    <Redirect
      href={
        !user ? "/(auth)/login" : user.onboarded ? "/(tabs)" : "/onboarding"
      }
    />
  );
}
