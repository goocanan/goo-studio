import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
    baseURL: "http://localhost:3000" // the base url for the backend
});

export const { signIn, signUp, signOut, useSession } = authClient;
