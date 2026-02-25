import React, { useEffect, useContext } from 'react';
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';
import { studentTeacherContextObj } from '../../contexts/StudentTeacherContext';

function AuthSync() {
  const { user, isSignedIn } = useUser(); // Get Clerk User
  const { setusers } = useContext(studentTeacherContextObj); // Get Your Context

  useEffect(() => {
    // Only run if Clerk says we are signed in
    if (isSignedIn && user) {
      const email = user.primaryEmailAddress.emailAddress;

      // Check if we already have the user in LocalStorage to avoid unnecessary API calls
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.email === email) {
          setusers(parsedUser); // Sync Context with Storage
          return; 
        }
      }

      // If not in storage, Fetch from YOUR Backend (MongoDB)
      console.log("🔄 Syncing Clerk User with MongoDB...");
      
      // Try fetching as Student first (You might need logic to check if Teacher)
      axios.get(`http://localhost:3000/student-api/student-by-email/${email}`)
        .then(res => {
          const mongoUser = res.data.payload;
          
          // ✅ CRITICAL: Save to LocalStorage & Context
          localStorage.setItem("user", JSON.stringify(mongoUser));
          setusers(mongoUser);
          console.log("✅ Sync Complete: User saved to storage");
        })
        .catch(err => {
          console.error("Sync Error: User exists in Clerk but not MongoDB?", err);
          // Optional: Redirect to a "Complete Registration" page here
        });
    }
  }, [isSignedIn, user, setusers]);

  return null; // This component renders nothing visually
}

export default AuthSync;