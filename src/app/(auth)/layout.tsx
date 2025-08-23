import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 ${inter.className}`}>
      <div className="flex min-h-screen">
        {/* Left side - Branding and welcome message */}
        <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-primary-700" />
          <div className="relative z-10 flex flex-col justify-center px-12">
            <div className="max-w-lg">
              <h1 className="text-4xl font-bold text-white mb-6">
                VRBNBXOSS
              </h1>
              <p className="text-xl text-primary-100 mb-8">
                Streamline your rental property management across all platforms
              </p>
              <div className="space-y-4 text-primary-50">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary-200 rounded-full" />
                  <span>Unified calendar across Airbnb, VRBO, and direct bookings</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary-200 rounded-full" />
                  <span>Automated cleaning schedules and guest communications</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary-200 rounded-full" />
                  <span>Comprehensive analytics and revenue insights</span>
                </div>
              </div>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />
        </div>

        {/* Right side - Authentication form */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}