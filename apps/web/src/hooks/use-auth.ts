'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import type { SessionResponse, LoginInput, SignupInput } from '@forgeops/types';

export function useSession() {
  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: () => apiFetch<SessionResponse>('/api/auth/me'),
    retry: false,
    staleTime: 60_000,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: LoginInput) =>
      apiFetch<{ user: SessionResponse['user'] }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
      router.push('/app/dashboard');
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: SignupInput) =>
      apiFetch<{ user: SessionResponse['user'] }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
      router.push('/app/dashboard');
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: () =>
      apiFetch<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),
    onSuccess: () => {
      queryClient.clear();
      router.push('/login');
    },
  });
}
