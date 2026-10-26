import { createContext } from 'react';

// Lets the top bar open the sidebar on small screens, where it is hidden off-canvas.
export const SidebarContext = createContext({ openSidebar: () => {} });
