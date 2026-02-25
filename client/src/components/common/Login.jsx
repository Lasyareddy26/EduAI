import React from 'react'
import { SignIn } from '@clerk/clerk-react'
import './Register.css'

function Login() {
  return (
    <div className="register-container">
      <SignIn
        appearance={{
          layout: {
            socialButtonsPlacement: 'bottom',
            helpPageUrl: false,
          },
          variables: {
            colorPrimary: '#240046',        /* Main Purple */
            colorTextOnPrimaryBackground: 'white',
            colorText: '#10002b',           
            colorBackground: '#ffffff',     
            colorInputBackground: '#f3f0f5',
            colorInputText: '#240046',
            borderRadius: '6px',
          },
          elements: {
            card: {
              boxShadow: '0 8px 20px rgba(36, 0, 70, 0.15) !important',
              border: '1px solid #e0e0e0 !important'
            },
            
            // 1. Fix the "Continue" Button (Remove Gold Gradient, Make Purple)
            formButtonPrimary: {
              background: '#240046 !important',      /* Force Flat Purple */
              backgroundColor: '#240046 !important', /* Double safety */
              backgroundImage: 'none !important',    /* Remove the Amazon gradient */
              border: 'none !important',
              fontSize: '14px !important',
              textTransform: 'none !important',
            },
            
            // Hover state for "Continue"
            formButtonPrimary__hover: {
              backgroundColor: '#3c096c !important'
            },

            // 2. Fix the Social Buttons (Google, GitHub, etc.)
            // Currently they are gold. Let's make them white with purple border
            socialButtonsBlockButton: {
              background: 'white !important',
              backgroundImage: 'none !important',
              border: '1px solid #d1d5db !important',
              color: '#240046 !important'
            },
            
            // Text color inside social buttons
            socialButtonsBlockButtonText: {
              color: '#240046 !important'
            },

            // Links (Sign in, etc.)
            footerActionLink: {
              color: '#240046 !important', /* Make links Purple instead of Gold */
              fontWeight: 'bold !important'
            }
          }
        }}
      />
    </div>
  )
}

export default Login