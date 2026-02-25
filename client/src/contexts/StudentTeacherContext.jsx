import React from 'react'
import { createContext } from 'react'
export const studentTeacherContextObj=createContext()
import { useState } from 'react'

function StudentTeacherContext({children}) {
  
  const [users,setusers]=useState({
    role:"",
    firstName:"",
    lastName:"",
    email:"",
    profileImageUrl:"",
    isActive:"",
    createdAt:""

  })
  return (
    <studentTeacherContextObj.Provider value={{users,setusers}}>
      {children}
    </studentTeacherContextObj.Provider>
  )
}

export default StudentTeacherContext