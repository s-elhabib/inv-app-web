import { create } from 'zustand';

interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  login: async (email, password) => {
    // Mock authentication with different roles based on email
    let role = 'admin';
    let name = 'John Doe';

    if (email === 'supplier@admin.com' && password === 'psw2551') {
      role = 'supplier';
      name = 'Supplier Admin';
    } else if (email !== 'admin@example.com') {
      role = 'client';
    }

    const mockUser: User = {
      id: '1',
      name,
      email,
      role: role as 'admin' | 'client' | 'supplier',
    };
    set({ user: mockUser, isAuthenticated: true });
  },
  logout: () => set({ user: null, isAuthenticated: false }),
}));