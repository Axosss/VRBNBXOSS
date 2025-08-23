import { Metadata } from 'next'
import { LoginForm } from '@/components/auth/login-form'

export const metadata: Metadata = {
  title: 'Sign In | VRBNBXOSS',
  description: 'Sign in to your VRBNBXOSS account to manage your rental properties',
}

export default function LoginPage() {
  return <LoginForm />
}