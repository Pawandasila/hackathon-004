'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';
import { Authenticated, Unauthenticated } from 'convex/react';
import { BarLoader } from 'react-spinners';
import { Map, MessageSquare, PlusCircle, Menu, X } from 'lucide-react';
import { useState } from 'react';

import { Button } from './ui/button';
import { useStoreUser } from '@/hooks/user-store-user';
import { useConvexQuery } from '@/hooks/user-convex-query';
import { api } from '../../convex/_generated/api';

import { CheckCircle2 } from 'lucide-react';
import { Badge } from './ui/badge';

export default function Header() {
  const { isLoading: isStoreLoading } = useStoreUser();
  const { data: userData, isLoading: isUserLoading } = useConvexQuery(api.users.getCurrentUser);
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Navigation links for authenticated users
  const navLinks = [
    { name: 'Find Surplus', href: '/find', icon: Map },
    { name: 'My Chats', href: '/chats', icon: MessageSquare },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const isLoading = isStoreLoading || isUserLoading;

  return (
    <>
      <header className="fixed top-0 left-0 w-full bg-white/95 backdrop-blur-lg border-b border-gray-100 z-50 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Brand Name */}
            <Link href="/" className="flex items-center gap-3 flex-shrink-0 group">
              <div className="relative">
                <Image
                  src="/logo.png"
                  alt="Rasoi Logo"
                  width={36}
                  height={36}
                  className="object-contain transition-transform group-hover:scale-105"
                />
              </div>
              <span className="font-bold text-xl text-gray-800 hidden sm:block group-hover:text-orange-600 transition-colors">
                Saajha Rasoi
              </span>
            </Link>

            {/* Desktop Navigation and Authentication */}
            <div className="hidden md:flex items-center gap-6">
              <Authenticated>
                {/* Main navigation */}
                <nav className="flex items-center gap-8">
                  {navLinks.map((link) => (
                    <Link
                      key={link.name}
                      href={link.href}
                      className={`flex items-center gap-2 font-medium transition-all duration-200 hover:scale-105 ${
                        pathname === link.href
                          ? 'text-orange-600 font-semibold'
                          : 'text-gray-600 hover:text-orange-500'
                      }`}
                    >
                      <link.icon className="h-4 w-4" />
                      {link.name}
                    </Link>
                  ))}
                </nav>

                {/* User actions */}
                <div className="flex items-center gap-4">
                  <Link href="/post">
                    <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md hover:shadow-lg transition-all duration-200 font-medium px-4 py-2">
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Post Surplus
                    </Button>
                  </Link>
                  <div className="flex items-center gap-2">
                    {userData?.isVerified && (
                      <Badge className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1 px-2 py-1 hover:bg-green-50 transition-colors">
                        <CheckCircle2 className="w-3 h-3" />
                        <span className="text-xs font-medium">Verified</span>
                      </Badge>
                    )}
                    <UserButton
                      afterSignOutUrl="/"
                      appearance={{
                        elements: {
                          avatarBox: 'w-10 h-10 ring-2 ring-orange-100 hover:ring-orange-200 transition-all',
                          userButtonPopoverCard: 'bg-white border border-gray-100 shadow-xl rounded-xl',
                          userPreviewMainIdentifier: 'font-semibold text-gray-800',
                          userPreviewSecondaryIdentifier: 'text-gray-500',
                          userButtonPopoverActionButton: 'hover:bg-gray-50 rounded-lg transition-colors',
                        },
                      }}
                    />
                  </div>
                </div>
              </Authenticated>

              <Unauthenticated>
                <div className="flex items-center gap-3">
                  <SignInButton mode="modal">
                    <Button variant="ghost" className="font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition-all duration-200">
                      Log In
                    </Button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md hover:shadow-lg transition-all duration-200 font-medium px-6 py-2">
                      Get Started
                    </Button>
                  </SignUpButton>
                </div>
              </Unauthenticated>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center gap-3 md:hidden">
              <Authenticated>
                <Link href="/post">
                  <Button size="sm" className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md">
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </Link>
                <div className="flex items-center gap-2">
                  {userData?.isVerified && (
                    <Badge className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1 px-1.5 py-0.5 hover:bg-green-50 transition-colors">
                      <CheckCircle2 className="w-3 h-3" />
                      <span className="text-xs font-medium hidden sm:inline">Verified</span>
                    </Badge>
                  )}
                  <UserButton
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        avatarBox: 'w-9 h-9 ring-2 ring-orange-100',
                      },
                    }}
                  />
                </div>
              </Authenticated>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMobileMenu}
                className="p-2"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Loading bar */}
        {isLoading && (
          <div className="absolute bottom-0 left-0 w-full">
            <BarLoader width="100%" color="#F97316" height={3} />
          </div>
        )}
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm"
            onClick={toggleMobileMenu}
          />
          <div className="fixed top-16 left-0 right-0 bg-white border-b border-gray-100 shadow-lg">
            <div className="container mx-auto px-4 py-6">
              <Authenticated>
                <nav className="space-y-4">
                  {navLinks.map((link) => (
                    <Link
                      key={link.name}
                      href={link.href}
                      onClick={toggleMobileMenu}
                      className={`flex items-center gap-3 p-3 rounded-lg font-medium transition-all duration-200 ${
                        pathname === link.href
                          ? 'text-orange-600 bg-orange-50 font-semibold'
                          : 'text-gray-600 hover:text-orange-500 hover:bg-gray-50'
                      }`}
                    >
                      <link.icon className="h-5 w-5" />
                      {link.name}
                    </Link>
                  ))}
                </nav>
              </Authenticated>

              <Unauthenticated>
                <div className="space-y-3">
                  <SignInButton mode="modal">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                      onClick={toggleMobileMenu}
                    >
                      Log In
                    </Button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <Button 
                      className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium"
                      onClick={toggleMobileMenu}
                    >
                      Get Started
                    </Button>
                  </SignUpButton>
                </div>
              </Unauthenticated>
            </div>
          </div>
        </div>
      )}
    </>
  );
}