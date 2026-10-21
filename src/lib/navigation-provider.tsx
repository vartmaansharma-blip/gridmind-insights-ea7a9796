import { useState, useEffect, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { NavigationContext, unknownAccess } from "./navigation-context";
export function NavigationAccessProvider({ children }: { children: ReactNode }) {
  const [access, setAccess] = useState(unknownAccess);
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") setAccess(unknownAccess);
      else if (event === "SIGNED_IN")
        setAccess((old) => (old.userId === session?.user.id ? old : unknownAccess));
    });
    return () => data.subscription.unsubscribe();
  }, []);
  return (
    <NavigationContext.Provider value={{ access, setAccess }}>
      {children}
    </NavigationContext.Provider>
  );
}
