'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Loader2, AlertCircle, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/lib/stores/auth-store'
import { signUpSchema, type SignUpInput } from '@/lib/validations'
import { cn } from '@/lib/utils'

interface SignupFormProps {
  className?: string
}

const PASSWORD_REQUIREMENTS = [
  { label: 'At least 8 characters', test: (password: string) => password.length >= 8 },
  { label: 'Contains uppercase letter', test: (password: string) => /[A-Z]/.test(password) },
  { label: 'Contains lowercase letter', test: (password: string) => /[a-z]/.test(password) },
  { label: 'Contains number', test: (password: string) => /\d/.test(password) },
]

export function SignupForm({ className }: SignupFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  
  const { signUp, isLoading, error, clearError } = useAuthStore()

  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
    },
  })

  const password = form.watch('password')

  const onSubmit = async (data: SignUpInput) => {
    try {
      clearError()
      await signUp(data.email, data.password, data.fullName)
      router.push('/dashboard')
    } catch (error) {
      // Error is handled by the store
      console.error('Signup error:', error)
    }
  }

  return (
    <Card className={cn('w-full max-w-md mx-auto', className)}>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Create your account</CardTitle>
        <CardDescription className="text-center">
          Get started with VRBNBXOSS to manage your rental properties
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter your full name"
                      autoComplete="name"
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="Enter your email address"
                      autoComplete="email"
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create a strong password"
                        autoComplete="new-password"
                        disabled={isLoading}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  {password && (
                    <div className="mt-2 space-y-1">
                      {PASSWORD_REQUIREMENTS.map((requirement, index) => {
                        const isValid = requirement.test(password)
                        return (
                          <div
                            key={index}
                            className={cn(
                              'flex items-center gap-2 text-xs',
                              isValid ? 'text-success' : 'text-muted-foreground'
                            )}
                          >
                            <Check
                              className={cn(
                                'h-3 w-3',
                                isValid ? 'text-success' : 'text-muted-foreground opacity-30'
                              )}
                            />
                            <span>{requirement.label}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create account
            </Button>
          </form>
        </Form>

        <div className="text-center">
          <div className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Button
              variant="link"
              className="p-0 h-auto font-medium text-primary"
              onClick={() => router.push('/login')}
              disabled={isLoading}
            >
              Sign in
            </Button>
          </div>
        </div>

        <div className="text-xs text-muted-foreground text-center">
          By creating an account, you agree to our{' '}
          <Button variant="link" className="p-0 h-auto text-xs underline">
            Terms of Service
          </Button>{' '}
          and{' '}
          <Button variant="link" className="p-0 h-auto text-xs underline">
            Privacy Policy
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}