import { Link } from '@inertiajs/react';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { Bell, Search, Sparkles } from 'lucide-react';

interface User {
  id: number;
  name: string;
  email: string;
  avatar_url?: string;
}

interface AppLayoutProps {
  children: React.ReactNode;
  user: User;
}

export default function AppLayout({ children, user }: AppLayoutProps) {
  const [searchValue, setSearchValue] = useState('');

  // Get initials for avatar fallback
  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Header */}
        <header className="bg-white" style={{ height: '80px', borderBottom: '1px solid #CED2DB' }}>
          <div className="h-full flex items-center justify-between px-6">
            {/* Page Title */}
            <div className="flex items-center gap-3">
              <img src="/assets/icons/home-3.svg" alt="Home" className="h-6 w-6" />
              <h2 className="text-base font-semibold" style={{ color: '#00184D' }}>Home</h2>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative" style={{ width: '294px' }}>
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#5B636E' }} />
                <Input
                  type="search"
                  placeholder="search records, appointment"
                  className="pl-10 h-12 border-0 rounded-full"
                  style={{ backgroundColor: '#EEF0F3', color: '#5B636E' }}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                />
              </div>

              {/* Notifications */}
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 rounded-full hover:bg-transparent"
                style={{ backgroundColor: '#EEF0F3' }}
              >
                <Bell className="h-6 w-6" style={{ color: '#0A0B0D', strokeWidth: 1.5 }} />
              </Button>

              {/* AI Assistant with gradient border */}
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 rounded-full hover:bg-transparent"
                style={{
                  backgroundColor: '#F5F8FF',
                  border: '1px solid transparent',
                  backgroundImage: 'linear-gradient(#F5F8FF, #F5F8FF), linear-gradient(135deg, #FFFFFF 0%, #0052FF 50%, #FFFFFF 100%)',
                  backgroundOrigin: 'border-box',
                  backgroundClip: 'padding-box, border-box'
                }}
              >
                <img src="/assets/icons/ai.svg" alt="AI Assistant" className="h-6 w-6" />
              </Button>

              {/* User Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="hover:opacity-80 transition-opacity">
                    <img
                      src="/assets/icons/avatar-sanjana.svg"
                      alt={user.name}
                      className="h-12 w-12 rounded-full"
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/settings/profile">Profile Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings/preferences">Preferences</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/logout" method="post" as="button" className="w-full">
                      Log Out
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main
          className="flex-1 overflow-y-auto flex justify-center"
          style={{
            background: 'linear-gradient(180deg, rgba(211, 225, 255, 0.5) 0%, rgba(255, 255, 255, 0.5) 13.94%, rgba(255, 255, 255, 1) 30.77%)',
            paddingTop: '60px'
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

/**
 * Sidebar Navigation Component
 */
function Sidebar() {
  return (
    <aside className="w-80 bg-background flex flex-col" style={{ borderRight: '1px solid #CED2DB' }}>
      {/* Logo */}
      <div className="px-6 py-8">
        <Link href="/dashboard" className="flex items-center gap-3">
          <img
            src="/assets/logos/logo.svg"
            alt="Hospital Logo"
            className="h-12 w-12"
          />
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-6 py-4 space-y-3">
        <NavLink href="/dashboard" iconName="home" label="Home" active />
        <NavLink
          href="/appointments"
          iconName="appointment"
          label="Appointments"
        />
        <NavLink
          href="/health-records"
          iconName="records"
          label="Health Records"
        />
        <NavLink href="/insurance" iconName="insurance" label="Insurance" />
        <NavLink href="/billing" iconName="billing" label="Billing" />
        <NavLink
          href="/family-members"
          iconName="family"
          label="Family Members"
        />
      </nav>
    </aside>
  );
}

/**
 * Navigation Link Component
 */
interface NavLinkProps {
  href: string;
  iconName: string;
  label: string;
  active?: boolean;
}

function NavLink({ href, iconName, label, active = false }: NavLinkProps) {
  // Exact Figma specs:
  // - Padding: 12px 16px (py-3 px-4)
  // - Gap: 12px (gap-3)
  // - Font: 14px / 600 (font-semibold)
  // - Height: 50px
  const baseClasses =
    'flex items-center gap-3 px-4 py-3 font-semibold transition-all h-[50px]';

  // Active: pill shape (rounded-full), Rest: rounded-lg (8px)
  const shapeClasses = active ? 'rounded-full' : 'rounded-lg';

  // Rest state: dark text with hover effect
  const restClasses = !active ? 'text-[#0A0B0D] hover:bg-muted' : '';

  // Use filled icon when active, outline when not
  const iconSrc = active
    ? `/assets/icons/${iconName}-selected.svg`
    : `/assets/icons/${iconName}.svg`;

  // Active: #F5F8FF background, #0052FF text
  // Rest: transparent background, #0A0B0D text (handled by class)
  const activeStyle = active
    ? { backgroundColor: '#F5F8FF', color: '#0052FF' }
    : {};

  return (
    <Link
      href={href}
      className={`${baseClasses} ${shapeClasses} ${restClasses}`}
      style={{ ...activeStyle, fontSize: '16px', lineHeight: '24px' }}
    >
      <img src={iconSrc} alt={label} className="h-6 w-6 flex-shrink-0" />
      <span>{label}</span>
    </Link>
  );
}
