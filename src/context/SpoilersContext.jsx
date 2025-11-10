import { createContext, useContext, useMemo, useState } from "react";

const SpoilersContext = createContext(null);

export function SpoilersProvider({ children, defaultHidden = true }) {
  const [hidden, setHidden] = useState(!!defaultHidden);
  const value = useMemo(() => ({ hidden, setHidden }), [hidden]);
  return <SpoilersContext.Provider value={value}>{children}</SpoilersContext.Provider>;
}

export function useSpoilers() {
  const ctx = useContext(SpoilersContext);
  if (!ctx) throw new Error("useSpoilers must be used within <SpoilersProvider>");
  return ctx;
}
