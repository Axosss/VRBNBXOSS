'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface NavigationLinkProps {
  href: string
  name: string
  icon: LucideIcon
  onClick?: () => void
}

export function NavigationLink({ href, name, icon: Icon, onClick }: NavigationLinkProps) {
  const pathname = usePathname()
  const isActive = pathname === href || 
    (href !== '/dashboard' && pathname.startsWith(href))

  return (
    <Button
      variant={isActive ? 'secondary' : 'ghost'}
      className="w-full justify-start"
      onClick={onClick}
      asChild
    >
      <Link href={href}>
        <Icon className="mr-3 h-5 w-5" />
        {name}
      </Link>
    </Button>
  )
}