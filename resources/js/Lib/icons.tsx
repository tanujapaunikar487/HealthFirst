/**
 * Icon Mapping: Lucide → Hugeicons
 *
 * Centralized re-exports mapping old lucide names to hugeicons equivalents.
 * Import from '@/Lib/icons' instead of 'lucide-react'.
 *
 * Each export creates a React component wrapper around the icon data.
 */

import React from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import type { SVGProps } from 'react';

// Import individual icons from core-free-icons
import { Activity01Icon } from '@hugeicons/core-free-icons';
import { AlertCircleIcon } from '@hugeicons/core-free-icons';
import { Alert02Icon } from '@hugeicons/core-free-icons';
import { AmbulanceIcon } from '@hugeicons/core-free-icons';
import { Archive01Icon } from '@hugeicons/core-free-icons';
import { ArrowDown01Icon } from '@hugeicons/core-free-icons';
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';
import { ArrowRight01Icon } from '@hugeicons/core-free-icons';
import { ArrowUp01Icon } from '@hugeicons/core-free-icons';
import { Award01Icon } from '@hugeicons/core-free-icons';
import { Baby01Icon } from '@hugeicons/core-free-icons';
import { BarChartIcon } from '@hugeicons/core-free-icons';
import { BedDoubleIcon } from '@hugeicons/core-free-icons';
import { Notification03Icon } from '@hugeicons/core-free-icons';
import { BrainIcon } from '@hugeicons/core-free-icons';
import { Building02Icon } from '@hugeicons/core-free-icons';
import { Calendar03Icon } from '@hugeicons/core-free-icons';
import { CalendarAdd01Icon } from '@hugeicons/core-free-icons';
import { CalendarAdd02Icon } from '@hugeicons/core-free-icons';
import { Tick01Icon } from '@hugeicons/core-free-icons';
import { TickDouble01Icon } from '@hugeicons/core-free-icons';
import { CheckmarkCircle01Icon } from '@hugeicons/core-free-icons';
import { CheckmarkSquare01Icon } from '@hugeicons/core-free-icons';
import { RecordIcon } from '@hugeicons/core-free-icons';
import { CheckListIcon } from '@hugeicons/core-free-icons';
import { ClipboardIcon } from '@hugeicons/core-free-icons';
import { Clock01Icon } from '@hugeicons/core-free-icons';
import { Copy01Icon } from '@hugeicons/core-free-icons';
import { CreditCardIcon } from '@hugeicons/core-free-icons';
import { Door01Icon } from '@hugeicons/core-free-icons';
import { Download04Icon } from '@hugeicons/core-free-icons';
import { LinkSquare01Icon } from '@hugeicons/core-free-icons';
import { EyeIcon } from '@hugeicons/core-free-icons';
import { FileDownloadIcon } from '@hugeicons/core-free-icons';
import { HelpCircleIcon } from '@hugeicons/core-free-icons';
import { File01Icon } from '@hugeicons/core-free-icons';
import { FileMinusIcon } from '@hugeicons/core-free-icons';
import { FireIcon } from '@hugeicons/core-free-icons';
import { TestTubeIcon } from '@hugeicons/core-free-icons';
import { Folder01Icon } from '@hugeicons/core-free-icons';
import { FavouriteIcon } from '@hugeicons/core-free-icons';
import { Pulse01Icon } from '@hugeicons/core-free-icons';
import { Home01Icon } from '@hugeicons/core-free-icons';
import { RupeeIcon } from '@hugeicons/core-free-icons';
import { InformationCircleIcon } from '@hugeicons/core-free-icons';
import { Link01Icon } from '@hugeicons/core-free-icons';
import { Loading03Icon } from '@hugeicons/core-free-icons';
import { Loading01Icon } from '@hugeicons/core-free-icons';
import { Mail01Icon } from '@hugeicons/core-free-icons';
import { Location01Icon } from '@hugeicons/core-free-icons';
import { Message01Icon } from '@hugeicons/core-free-icons';
import { Mic01Icon } from '@hugeicons/core-free-icons';
import { MicroscopeIcon } from '@hugeicons/core-free-icons';
import { LaptopIcon } from '@hugeicons/core-free-icons';
import { MoreHorizontalIcon } from '@hugeicons/core-free-icons';
import { MoreVerticalIcon } from '@hugeicons/core-free-icons';
import { PencilEdit01Icon } from '@hugeicons/core-free-icons';
import { Call02Icon } from '@hugeicons/core-free-icons';
import { PillIcon } from '@hugeicons/core-free-icons';
import { Add01Icon } from '@hugeicons/core-free-icons';
import { AddTeamIcon } from '@hugeicons/core-free-icons';
import { Radio01Icon } from '@hugeicons/core-free-icons';
import { ReceiptDollarIcon } from '@hugeicons/core-free-icons';
import { Refresh01Icon } from '@hugeicons/core-free-icons';
import { RotateLeft01Icon } from '@hugeicons/core-free-icons';
import { ScanIcon } from '@hugeicons/core-free-icons';
import { ScissorIcon } from '@hugeicons/core-free-icons';
import { Search01Icon } from '@hugeicons/core-free-icons';
import { ServerStack01Icon } from '@hugeicons/core-free-icons';
import { Share01Icon } from '@hugeicons/core-free-icons';
import { ShieldIcon } from '@hugeicons/core-free-icons';
import { Shield01Icon } from '@hugeicons/core-free-icons';
import { SecurityCheckIcon } from '@hugeicons/core-free-icons';
import { Shield02Icon } from '@hugeicons/core-free-icons';
import { PoliceStationIcon } from '@hugeicons/core-free-icons';
import { SparklesIcon } from '@hugeicons/core-free-icons';
import { SquareIcon } from '@hugeicons/core-free-icons';
import { StarIcon } from '@hugeicons/core-free-icons';
import { StethoscopeIcon } from '@hugeicons/core-free-icons';
import { InjectionIcon } from '@hugeicons/core-free-icons';
import { TestTube01Icon } from '@hugeicons/core-free-icons';
import { TestTube02Icon } from '@hugeicons/core-free-icons';
import { Delete02Icon } from '@hugeicons/core-free-icons';
import { Upload04Icon } from '@hugeicons/core-free-icons';
import { UserIcon } from '@hugeicons/core-free-icons';
import { UserAdd01Icon } from '@hugeicons/core-free-icons';
import { UserGroupIcon } from '@hugeicons/core-free-icons';
import { Video01Icon } from '@hugeicons/core-free-icons';
import { FastWindIcon } from '@hugeicons/core-free-icons';
import { Cancel01Icon } from '@hugeicons/core-free-icons';
import { CancelCircleIcon } from '@hugeicons/core-free-icons';
import { Camera01Icon } from '@hugeicons/core-free-icons';
import { Logout01Icon } from '@hugeicons/core-free-icons';
import { LockKeyIcon } from '@hugeicons/core-free-icons';
import { Settings02Icon } from '@hugeicons/core-free-icons';
import { ViewOffIcon } from '@hugeicons/core-free-icons';
import { Unlink01Icon } from '@hugeicons/core-free-icons';

// Helper to create a React component from icon data
function createIcon(iconData: any, displayName: string) {
  const IconComponent = (props: SVGProps<SVGSVGElement> & { size?: number; strokeWidth?: number }) => {
    const { size, strokeWidth, className, ...rest } = props;
    return React.createElement(HugeiconsIcon, { icon: iconData, size, strokeWidth, className, ...rest });
  };
  IconComponent.displayName = displayName;
  // Attach the raw icon data as a property so it can be used with the Icon wrapper
  (IconComponent as any).iconData = iconData;
  return IconComponent;
}

// Re-export the wrapper component
export { HugeiconsIcon } from '@hugeicons/react';

// ─── Icon Re-exports ───

// A
export const Activity = createIcon(Activity01Icon, 'Activity');
export const AddTeam = createIcon(AddTeamIcon, 'AddTeam');
export const AlertCircle = createIcon(AlertCircleIcon, 'AlertCircle');
export const AlertTriangle = createIcon(Alert02Icon, 'AlertTriangle');
export const Ambulance = createIcon(AmbulanceIcon, 'Ambulance');
export const Archive = createIcon(Archive01Icon, 'Archive');
export const ArrowDown = createIcon(ArrowDown01Icon, 'ArrowDown');
export const ArrowLeft = createIcon(ArrowLeft01Icon, 'ArrowLeft');
export const ArrowRight = createIcon(ArrowRight01Icon, 'ArrowRight');
export const ArrowUp = createIcon(ArrowUp01Icon, 'ArrowUp');
export const Award = createIcon(Award01Icon, 'Award');

// B
export const Baby = createIcon(Baby01Icon, 'Baby');
export const BarChart3 = createIcon(BarChartIcon, 'BarChart3');
export const BedDouble = createIcon(BedDoubleIcon, 'BedDouble');
export const Bell = createIcon(Notification03Icon, 'Bell');
export const BrainCircuit = createIcon(BrainIcon, 'BrainCircuit');
export const Building2 = createIcon(Building02Icon, 'Building2');

// C
export const Calendar = createIcon(Calendar03Icon, 'Calendar');
export const CalendarClock = createIcon(CalendarAdd01Icon, 'CalendarClock');
export const CalendarPlus = createIcon(CalendarAdd02Icon, 'CalendarPlus');
export const Check = createIcon(Tick01Icon, 'Check');
export const CheckCheck = createIcon(TickDouble01Icon, 'CheckCheck');
export const CheckCircle2 = createIcon(CheckmarkCircle01Icon, 'CheckCircle2');
export const CheckSquare = createIcon(CheckmarkSquare01Icon, 'CheckSquare');
export const ChevronDown = createIcon(ArrowDown01Icon, 'ChevronDown');
export const ChevronLeft = createIcon(ArrowLeft01Icon, 'ChevronLeft');
export const ChevronRight = createIcon(ArrowRight01Icon, 'ChevronRight');
export const ChevronUp = createIcon(ArrowUp01Icon, 'ChevronUp');
export const Circle = createIcon(RecordIcon, 'Circle');
export const ClipboardCheck = createIcon(CheckListIcon, 'ClipboardCheck');
export const ClipboardList = createIcon(ClipboardIcon, 'ClipboardList');
export const Clock = createIcon(Clock01Icon, 'Clock');
export const Copy = createIcon(Copy01Icon, 'Copy');
export const CreditCard = createIcon(CreditCardIcon, 'CreditCard');

// D
export const DoorOpen = createIcon(Door01Icon, 'DoorOpen');
export const Download = createIcon(Download04Icon, 'Download');

// E
export const ExternalLink = createIcon(LinkSquare01Icon, 'ExternalLink');
export const Eye = createIcon(EyeIcon, 'Eye');

// F
export const FileDown = createIcon(FileDownloadIcon, 'FileDown');
export const FileQuestion = createIcon(HelpCircleIcon, 'FileQuestion');
export const FileText = createIcon(File01Icon, 'FileText');
export const FileWarning = createIcon(FileMinusIcon, 'FileWarning');
export const Flame = createIcon(FireIcon, 'Flame');
export const FlaskConical = createIcon(TestTubeIcon, 'FlaskConical');
export const FolderOpen = createIcon(Folder01Icon, 'FolderOpen');

// H
export const Heart = createIcon(FavouriteIcon, 'Heart');
export const HeartPulse = createIcon(Pulse01Icon, 'HeartPulse');
export const Home = createIcon(Home01Icon, 'Home');

// I
export const IndianRupee = createIcon(RupeeIcon, 'IndianRupee');
export const Info = createIcon(InformationCircleIcon, 'Info');

// L
export const Link2 = createIcon(Link01Icon, 'Link2');
export const Loader2 = createIcon(Loading03Icon, 'Loader2');
export const LoaderCircle = createIcon(Loading01Icon, 'LoaderCircle');

// M
export const Mail = createIcon(Mail01Icon, 'Mail');
export const MapPin = createIcon(Location01Icon, 'MapPin');
export const MessageSquare = createIcon(Message01Icon, 'MessageSquare');
export const Mic = createIcon(Mic01Icon, 'Mic');
export const Microscope = createIcon(MicroscopeIcon, 'Microscope');
export const Monitor = createIcon(LaptopIcon, 'Monitor');
export const MoreHorizontal = createIcon(MoreHorizontalIcon, 'MoreHorizontal');
export const MoreVertical = createIcon(MoreVerticalIcon, 'MoreVertical');

// P
export const Pencil = createIcon(PencilEdit01Icon, 'Pencil');
export const Phone = createIcon(Call02Icon, 'Phone');
export const Pill = createIcon(PillIcon, 'Pill');
export const Plus = createIcon(Add01Icon, 'Plus');
// R
export const Radio = createIcon(Radio01Icon, 'Radio');
export const Receipt = createIcon(ReceiptDollarIcon, 'Receipt');
export const RefreshCw = createIcon(Refresh01Icon, 'RefreshCw');
export const RotateCcw = createIcon(RotateLeft01Icon, 'RotateCcw');

// S
export const ScanLine = createIcon(ScanIcon, 'ScanLine');
export const Scissors = createIcon(ScissorIcon, 'Scissors');
export const Search = createIcon(Search01Icon, 'Search');
export const ServerCrash = createIcon(ServerStack01Icon, 'ServerCrash');
export const Share2 = createIcon(Share01Icon, 'Share2');
export const Shield = createIcon(ShieldIcon, 'Shield');
export const ShieldAlert = createIcon(Shield01Icon, 'ShieldAlert');
export const ShieldCheck = createIcon(SecurityCheckIcon, 'ShieldCheck');
export const ShieldX = createIcon(Shield02Icon, 'ShieldX');
export const Siren = createIcon(PoliceStationIcon, 'Siren');
export const Sparkles = createIcon(SparklesIcon, 'Sparkles');
export const Square = createIcon(SquareIcon, 'Square');
export const Star = createIcon(StarIcon, 'Star');
export const Stethoscope = createIcon(StethoscopeIcon, 'Stethoscope');
export const Syringe = createIcon(InjectionIcon, 'Syringe');

// T
export const TestTube = createIcon(TestTube01Icon, 'TestTube');
export const TestTube2 = createIcon(TestTube02Icon, 'TestTube2');
export const Trash2 = createIcon(Delete02Icon, 'Trash2');

// U
export const Upload = createIcon(Upload04Icon, 'Upload');
export const User = createIcon(UserIcon, 'User');
export const UserPlus = createIcon(UserAdd01Icon, 'UserPlus');
export const Users = createIcon(UserGroupIcon, 'Users');

// V
export const Video = createIcon(Video01Icon, 'Video');

// W
export const Wind = createIcon(FastWindIcon, 'Wind');

// X
export const X = createIcon(Cancel01Icon, 'X');
export const XCircle = createIcon(CancelCircleIcon, 'XCircle');

// Additional icons for Settings
export const Camera = createIcon(Camera01Icon, 'Camera');
export const LogOut = createIcon(Logout01Icon, 'LogOut');
export const Lock = createIcon(LockKeyIcon, 'Lock');
export const Settings2 = createIcon(Settings02Icon, 'Settings2');
export const EyeOff = createIcon(ViewOffIcon, 'EyeOff');
export const Unlink = createIcon(Unlink01Icon, 'Unlink');

// ─── Brand Icons (Custom SVGs) ───

export const GoogleMeet = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M15.5 7.5V10.5L19.5 7V17L15.5 13.5V16.5C15.5 17.05 15.05 17.5 14.5 17.5H5.5C4.95 17.5 4.5 17.05 4.5 16.5V7.5C4.5 6.95 4.95 6.5 5.5 6.5H14.5C15.05 6.5 15.5 6.95 15.5 7.5Z" fill="#00897B"/>
    <path d="M10 10C10.83 10 11.5 10.67 11.5 11.5C11.5 12.33 10.83 13 10 13C9.17 13 8.5 12.33 8.5 11.5C8.5 10.67 9.17 10 10 10Z" fill="#00695C"/>
  </svg>
);
GoogleMeet.displayName = 'GoogleMeet';

export const ZoomIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect x="3" y="6" width="18" height="12" rx="2" fill="#2D8CFF"/>
    <path d="M7 10H11V11H8V12H11V13H8V14H11V15H7V10Z" fill="white"/>
    <path d="M12 12.5C12 11.12 13.12 10 14.5 10C15.88 10 17 11.12 17 12.5C17 13.88 15.88 15 14.5 15C13.12 15 12 13.88 12 12.5Z" fill="white"/>
  </svg>
);
ZoomIcon.displayName = 'ZoomIcon';

export const GoogleCalendar = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M18 4H17V3C17 2.45 16.55 2 16 2C15.45 2 15 2.45 15 3V4H9V3C9 2.45 8.55 2 8 2C7.45 2 7 2.45 7 3V4H6C4.9 4 4 4.9 4 6V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V6C20 4.9 19.1 4 18 4Z" fill="#4285F4"/>
    <rect x="6" y="9" width="12" height="11" fill="white"/>
    <path d="M8 11H10V13H8V11Z" fill="#EA4335"/>
    <path d="M11 11H13V13H11V11Z" fill="#FBBC04"/>
    <path d="M14 11H16V13H14V11Z" fill="#34A853"/>
    <path d="M8 14H10V16H8V14Z" fill="#4285F4"/>
    <path d="M11 14H13V16H11V14Z" fill="#EA4335"/>
    <path d="M14 14H16V16H14V14Z" fill="#FBBC04"/>
    <path d="M8 17H10V19H8V17Z" fill="#34A853"/>
    <path d="M11 17H13V19H11V17Z" fill="#4285F4"/>
  </svg>
);
GoogleCalendar.displayName = 'GoogleCalendar';

export const AppleIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M17.05 20.28C16.07 21.23 15 21.08 13.97 20.63C12.88 20.17 11.88 20.15 10.73 20.63C9.29 21.25 8.53 21.07 7.67 20.28C2.79 15.25 3.51 7.59 9.05 7.31C10.4 7.38 11.34 8.05 12.13 8.11C13.31 7.87 14.44 7.18 15.71 7.28C17.22 7.41 18.36 8.05 19.12 9.18C15.98 11.04 16.72 15.3 19.58 16.45C19 17.89 18.26 19.32 17.04 20.29L17.05 20.28ZM12.03 7.25C11.88 5.02 13.69 3.18 15.77 3C16.06 5.58 13.43 7.5 12.03 7.25Z"/>
  </svg>
);
AppleIcon.displayName = 'AppleIcon';
