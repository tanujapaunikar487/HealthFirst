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
        <header className="bg-white" style={{ height: '80px', borderBottom: '1px solid #E5E5E5' }}>
          <div className="h-full flex items-center justify-between px-6">
            {/* Page Title */}
            <div className="flex items-center gap-3">
              <img src="/assets/icons/home-3.svg" alt="Home" className="h-6 w-6" />
              <h2 className="text-base font-semibold" style={{ color: '#00184D' }}>Home</h2>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3">
              {/* Search Icon Button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 rounded-full hover:bg-gray-100"
                style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E5E5' }}
              >
                <Search className="h-5 w-5" style={{ color: '#171717', strokeWidth: 2 }} />
              </Button>

              {/* Notifications */}
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 rounded-full hover:bg-gray-100"
                style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E5E5' }}
              >
                <Bell className="h-5 w-5" style={{ color: '#171717', strokeWidth: 2 }} />
              </Button>
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
    <aside className="w-80 bg-background flex flex-col" style={{ borderRight: '1px solid #E5E5E5' }}>
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
