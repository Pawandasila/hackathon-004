'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';
import { Authenticated, Unauthenticated } from 'convex/react';
import { BarLoader } from 'react-spinners';
import { Map, MessageSquare, PlusCircle, Bell } from 'lucide-react';

import { Button } from './ui/button';


import { useTransactionStore } from '@/lib/transaction-store'; 
import NotificationsPanel from './notifications-panel';
import { useStoreUser } from '@/hooks/user-store-user';

export default function Header() {
  const { isLoading } = useStoreUser();
  const pathname = usePathname();
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Get notifications from the mock store to show an indicator
  const { getUnreadCount, currentUserId } = useTransactionStore();
  const unreadCount = getUnreadCount(currentUserId);

  const navLinks = [
    { name: 'Find Surplus', href: '/find', icon: Map },
    { name: 'My Chats', href: '/chats', icon: MessageSquare },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-200 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 overflow-hidden">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <Image
                src="/logo.png" // Replace with your logo
                alt="Saajha Rasoi Logo"
                width={100}
                height={100}
              />
              <span className="font-bold text-xl text-gray-800 hidden sm:block">
                Rassoi
              </span>
            </Link>

            {/* Nav & Auth */}
            <div className="flex items-center gap-4">
              <Authenticated>
                <nav className="hidden md:flex items-center gap-6">
                  {/* ... nav links ... */}
                </nav>
                <div className="flex items-center gap-4">
                  <Link href="/post">
                    <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                      <PlusCircle className="h-4 w-4 md:mr-2" />
                      <span className="hidden md:block">Post Surplus</span>
                    </Button>
                  </Link>
                  {/* Notification Bell */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                    onClick={() => setIsPanelOpen(true)}
                  >
                    <Bell className="h-5 w-5 text-gray-600" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500" />
                    )}
                  </Button>
                  <UserButton afterSignOutUrl="/" />
                </div>
              </Authenticated>
              <Unauthenticated>
                <SignInButton mode="modal">
                  <Button variant="ghost">Log In</Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                    Get Started
                  </Button>
                </SignUpButton>
              </Unauthenticated>
            </div>
          </div>
        </div>
        {isLoading && <BarLoader width="100%" color="#F97316" />}
      </header>

      {/* Render the panel */}
      <NotificationsPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
      />
    </>
  );
}
