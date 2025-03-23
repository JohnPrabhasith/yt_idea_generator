"use client";
import React from 'react'
import { Button } from './ui/button'
import { UserButton } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import { cn } from "@/lib/utils";
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { SettingsModal } from '@/components/SettingsModal';

const NavBar = () => {
  const pathName = usePathname();
  const { isSignedIn }  = useAuth();
  return (
    <nav>
        <div className="py-5">
            <div className="flex justify-between">
                <Link href='/' className='flex items-center space-x-1'>
                    <span className='text-xl font-bold '>InspiroBot</span>
                    <span className='text-xl'>✨</span>
                </Link>
                {isSignedIn && (
                    <div className="flex items-center space-x-8 ml-auto mr-4 text-md">
                        <Link href="/videos" className={
                            cn('text-md', pathName.startsWith('/videos') ? "border-b-2 border-red-500 text-red-500" : 'text-primary  hover-border')
                        }>
                        Videos 
                        </Link>
                        <Link href="/ideas" className={
                            cn('text-md', pathName.startsWith('/ideas') ? "border-b-2 border-red-500 text-red-500" : 'text-primary  hover-border')
                        }>
                        Ideas
                        </Link>
                        <SettingsModal /> 
                        <Link href="/about-me" className={
                            cn('text-md', pathName.startsWith('/about-me') ? "border-b-2 border-red-500 text-red-500" : 'text-primary  hover-border')
                        }>
                        About Me  
                        </Link>
                        <UserButton/>
                    </div>
                )}
                { !isSignedIn && (
                    <Link href = '/videos'>
                        <Button className='font-semibold text-white bg-red-500 hover:bg-red-600'>
                            Get Started   
                        </Button>                            
                    </Link>
                )}
            </div>
        </div>
    </nav>
  )
}

export default NavBar
