"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  DollarSign, 
  ShoppingCart,
  Settings,
  FileText,
  UserCircle,
  LogOut,
  Package,
  Gift,
  Mail,
  Plug
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"

type UserRole = "admin" | "member"

interface NavigationProps {
  role?: UserRole
}

const adminNavItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/members", label: "Members", icon: Users },
  { href: "/admin/reservations", label: "Court Reservations", icon: Calendar },
  { href: "/admin/bookings", label: "Court Bookings", icon: Calendar },
  { href: "/admin/tee-sheet", label: "Tee Sheet", icon: Calendar },
  { href: "/admin/pos", label: "POS System", icon: ShoppingCart },
  { href: "/admin/pos/kds", label: "Kitchen Display", icon: ShoppingCart },
  { href: "/admin/inventory", label: "Inventory", icon: Package },
  { href: "/admin/house-accounts", label: "House Accounts", icon: DollarSign },
  { href: "/admin/events", label: "Events", icon: Calendar },
  { href: "/admin/communications", label: "Communications", icon: Mail },
  { href: "/admin/loyalty", label: "Loyalty & Discounts", icon: Gift },
  { href: "/admin/financial", label: "Financial", icon: DollarSign },
  { href: "/admin/reports", label: "Reports", icon: FileText },
  { href: "/admin/integrations", label: "Integrations", icon: Plug },
  { href: "/admin/settings", label: "Settings", icon: Settings },
]

const memberNavItems = [
  { href: "/member/dashboard", label: "My Dashboard", icon: LayoutDashboard },
  { href: "/member/bookings", label: "My Bookings", icon: Calendar },
  { href: "/member/statements", label: "Statements", icon: FileText },
  { href: "/member/profile", label: "Profile", icon: UserCircle },
]

export function Navigation({ role = "admin" }: NavigationProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const navItems = role === "admin" ? adminNavItems : memberNavItems

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  return (
    <nav className="border-r border-slate-200 bg-white h-screen w-64 fixed left-0 top-0 flex flex-col">
      <div className="p-6 border-b border-slate-200 flex-shrink-0">
        <h1 className="text-xl font-display font-medium text-primary tracking-tight">EliteClub OS</h1>
        <p className="text-xs text-slate-500 mt-1 font-sans">Country Club Management</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-sans transition-all duration-200 min-w-0",
                isActive
                  ? "bg-primary text-white"
                  : "text-slate-700 hover:bg-slate-50 hover:text-primary"
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </div>
      
      <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex-shrink-0">
        <div className="space-y-2">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center">
              <span className="text-white font-medium text-sm">
                {user?.name?.charAt(0).toUpperCase() || (role === "admin" ? "A" : "M")}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-sans font-medium text-primary truncate">
                {user?.name || (role === "admin" ? "Administrator" : "Member")}
              </p>
              <p className="text-xs text-slate-500 font-sans truncate">
                {user?.email || (role === "admin" ? "Full Access" : "Member Access")}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-slate-700 hover:text-red-600 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </nav>
  )
}

