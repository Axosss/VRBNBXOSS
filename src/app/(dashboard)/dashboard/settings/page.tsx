import { Metadata } from 'next'
import { ProfileForm } from '@/components/auth/profile-form'

export const metadata: Metadata = {
  title: 'Settings | VRBNBXOSS',
  description: 'Manage your account settings and preferences',
}

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and preferences.
        </p>
      </div>

      <ProfileForm />
    </div>
  )
}