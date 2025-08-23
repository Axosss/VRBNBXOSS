import { Metadata } from 'next'
import { SignupForm } from '@/components/auth/signup-form'

export const metadata: Metadata = {
  title: 'Create Account | VRBNBXOSS',
  description: 'Create your VRBNBXOSS account to start managing your rental properties',
}

export default function RegisterPage() {
  return <SignupForm />
}