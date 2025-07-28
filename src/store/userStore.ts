import { create } from "zustand";

type UserState = {
  user: null | { id: string; name: string };
  setUser: (user: UserState["user"]) => void;
};

export const useUserStore = create<UserState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
