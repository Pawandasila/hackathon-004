'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';
import { Authenticated, Unauthenticated, useQuery } from 'convex/react';
import { BarLoader } from 'react-spinners';
import { Map, MessageSquare, PlusCircle, Bell, User2Icon } from 'lucide-react';

import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { NotificationsPanelNew } from './notifications-panel-new';
import { useStoreUser } from '@/hooks/user-store-user';
import { useCurrentUser } from '@/hooks/use-current-user';
import { api } from '../../convex/_generated/api';

export default function Header() {
  const { isLoading } = useStoreUser();
  const { user } = useCurrentUser();
  const pathname = usePathname();
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Get unread notifications count
  const unreadCount = useQuery(
    api.notifications.getUnreadCount, 
    user ? { userId: user._id } : "skip"
  );

  const navLinks = [
    { name: 'Messages', href: '/messages', icon: MessageSquare },
    { name: 'Profile', href: '/profile', icon: User2Icon },
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
                <nav className="hidden md:flex items-center gap-2">
                  {navLinks.map((link) => (
                    <Link key={link.name} href={link.href}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`${
                          pathname === link.href ? 'text-orange-500' : ''
                        }`}
                      >
                        <link.icon className="w-4 h-4 mr-2" />
                        {link.name}
                      </Button>
                    </Link>
                  ))}
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
                    {unreadCount && unreadCount > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                      >
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </Badge>
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
      {user && (
        <NotificationsPanelNew
          isOpen={isPanelOpen}
          onToggle={() => setIsPanelOpen(!isPanelOpen)}
          userId={user._id}
        />
      )}
    </>
  );
}
