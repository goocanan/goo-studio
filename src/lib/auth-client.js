import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
    baseURL: import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || "http://localhost:4000",
    sessionOptions: {
        refetchOnWindowFocus: false,  // Prevent session refetch on tab switch (causes UI reset)
    }
});

export const { signIn, signUp, signOut, useSession } = authClient;
