import React from 'react'
import Header from './Header'
import Footer from './Footer'
import Chatbot from './Chatbot'
import { Outlet } from 'react-router-dom'
import './RootLayout.css';
import { ClerkProvider } from '@clerk/clerk-react'
import AuthSync from './AuthSync' // 1. Ensure this import exists

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Publishable Key')
}

function RootLayout() {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      
      {/* 2. ✅ PLACE IT HERE */}
      {/* It renders nothing visually, but needs to be inside ClerkProvider to work */}
      <AuthSync /> 

      <div className="app-container">
        <Header />
     
        <main className="main-content">
          <div className="content-wrapper">
            <Outlet />
          </div>
        </main>

        <Footer />
        <Chatbot />
      </div>
    </ClerkProvider>
  )
}

export default RootLayout