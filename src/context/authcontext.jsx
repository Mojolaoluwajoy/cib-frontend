import { createContext, useContext, useState } from 'react';

// This creates a global "box" that holds the logged-in user's info
// Any component anywhere in the app can reach into this box and read the info
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Initialize from localStorage so the user stays logged in on page refresh
  const [user, setUser] = useState({
    token: localStorage.getItem('cib_token'),
    role:  localStorage.getItem('cib_role'),
    name:  localStorage.getItem('cib_name'),
    email: localStorage.getItem('cib_email'),
  });

  // Called after successful login — saves everything to localStorage and state
  const login = (userData) => {
    const fullName = `${userData.firstName} ${userData.lastName}`;
    localStorage.setItem('cib_token', userData.token);
    localStorage.setItem('cib_role',  userData.role);
    localStorage.setItem('cib_name',  fullName);
    localStorage.setItem('cib_email', userData.email);
    setUser({
      token: userData.token,
      role:  userData.role,
      name:  fullName,
      email: userData.email,
    });
  };

  // Called when user clicks Sign Out — clears everything
  const logout = () => {
    localStorage.clear();
    setUser({ token: null, role: null, name: null, email: null });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// This is a custom hook — any page calls useAuth() to get user info
// For example: const { user } = useAuth(); then use user.role, user.name etc
export const useAuth = () => useContext(AuthContext);