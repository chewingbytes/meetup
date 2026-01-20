import { useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "./authContext";

export function useAuthRedirect(redirectTo: any = "/") {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) router.replace(redirectTo as any);

    console.log("USER:", user);
  }, [isLoading, user, redirectTo]);

  return { user, isCheckingAuth: isLoading };
}
