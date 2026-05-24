'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@forgeops/types';
import { useLogin } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

const DEMO_EMAIL = 'admin@forgeops.dev';
const DEMO_PASSWORD = 'password123';

export default function LoginPage() {
  const login = useLogin();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  function onSubmit(data: LoginInput) {
    login.mutate(data);
  }

  function handleDemoLogin() {
    setValue('email', DEMO_EMAIL, { shouldValidate: true });
    setValue('password', DEMO_PASSWORD, { shouldValidate: true });
    login.mutate({ email: DEMO_EMAIL, password: DEMO_PASSWORD });
  }

  return (
    <Card className="border-zinc-800 bg-zinc-900/50">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-base font-medium text-zinc-100">Sign in</CardTitle>
        <CardDescription className="text-zinc-400">
          Enter your credentials to access the platform
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-zinc-300">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@company.dev"
              className="border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-600"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-xs text-red-400">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-zinc-300">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              className="border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-600"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-xs text-red-400">{errors.password.message}</p>
            )}
          </div>
          <Button
            type="submit"
            className="w-full bg-indigo-600 text-white hover:bg-indigo-500"
            disabled={login.isPending}
          >
            {login.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-zinc-800" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-zinc-900 px-2 text-zinc-500">or</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
          onClick={handleDemoLogin}
          disabled={login.isPending}
        >
          Try the demo account
        </Button>

        <p className="text-center text-xs text-zinc-500">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-indigo-400 hover:text-indigo-300">
            Create workspace
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
