'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signupSchema, type SignupInput } from '@forgeops/types';
import { useRegister } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const registerUser = useRegister();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
  });

  function onSubmit(data: SignupInput) {
    registerUser.mutate(data);
  }

  return (
    <Card className="border-zinc-800 bg-zinc-900/50">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-base font-medium text-zinc-100">Create workspace</CardTitle>
        <CardDescription className="text-zinc-400">
          Set up your workspace to get started
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-zinc-300">Name</Label>
            <Input
              id="name"
              placeholder="Alice Nguyen"
              className="border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-600"
              {...register('name')}
            />
            {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-zinc-300">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@company.dev"
              className="border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-600"
              {...register('email')}
            />
            {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
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
            {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="workspaceName" className="text-zinc-300">Workspace name</Label>
            <Input
              id="workspaceName"
              placeholder="Acme Corp"
              className="border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-600"
              {...register('workspaceName')}
            />
            {errors.workspaceName && <p className="text-xs text-red-400">{errors.workspaceName.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="workspaceSlug" className="text-zinc-300">Workspace slug</Label>
            <Input
              id="workspaceSlug"
              placeholder="acme-corp"
              className="border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-600"
              {...register('workspaceSlug')}
            />
            {errors.workspaceSlug && <p className="text-xs text-red-400">{errors.workspaceSlug.message}</p>}
          </div>
          <Button
            type="submit"
            className="w-full bg-indigo-600 text-white hover:bg-indigo-500"
            disabled={registerUser.isPending}
          >
            {registerUser.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating workspace...
              </>
            ) : (
              'Create workspace'
            )}
          </Button>
        </form>

        <p className="text-center text-xs text-zinc-500">
          Already have an account?{' '}
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
