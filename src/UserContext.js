import React, { createContext, useContext, useState } from 'react';

export const UserContext = createContext(null);

export function useUser() {
  return useContext(UserContext);
}

export function UserProvider({ children }) {
  const [user, setUser] = useState(null); // user = { _id, ... }

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}