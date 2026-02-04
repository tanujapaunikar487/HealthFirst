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
