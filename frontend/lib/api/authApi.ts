import { httpClient } from "@/lib/api/client";
import type { User } from "@/lib/types/entities";

interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload extends LoginPayload {
  full_name: string;
  role: "admin" | "engineer" | "viewer";
  organization_name: string;
}

export const authApi = {
  async login(payload: LoginPayload): Promise<{ token: string; user: User }> {
    const { data } = await httpClient.post("/api/auth/login", payload);
    return data;
  },

  async register(payload: RegisterPayload): Promise<{ token: string; user: User }> {
    const { data } = await httpClient.post("/api/auth/register", payload);
    return data;
  },

  async me(): Promise<User> {
    const { data } = await httpClient.get("/api/auth/me");
    return data;
  },

  async logout(): Promise<void> {
    await httpClient.post("/api/auth/logout");
  },
};

