import { createContext, useContext } from "react";
export type NavigationAccess = {
  userId: string | null;
  factories: boolean;
  staff: boolean;
  customer: boolean;
};
export const unknownAccess: NavigationAccess = {
  userId: null,
  factories: false,
  staff: false,
  customer: false,
};
export const NavigationContext = createContext({
  access: unknownAccess,
  setAccess: (_value: NavigationAccess) => {},
});
/** Navigation hints only; existing server/RLS checks remain the sole access control. */
export const useNavigationAccess = () => useContext(NavigationContext);
