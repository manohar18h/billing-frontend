import React, { createContext, useContext, useEffect, useState } from "react";
import { Worker, fetchWorkers, invalidateWorkersCache } from "@/lib/WorkerService";

interface WorkersCtx {
  workers: Worker[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  invalidate: () => void;
}

const WorkersContext = createContext<WorkersCtx | undefined>(undefined);

export const WorkersProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchWorkers()
      .then(list => { setWorkers(list); setLoading(false); })
      .catch(e   => { setError(e);   setLoading(false); });
  }, []);

  const refresh = async () => {
    setLoading(true);
    const list = await fetchWorkers(true);
    setWorkers(list);
    setLoading(false);
  };

  return (
    <WorkersContext.Provider
      value={{ workers, loading, error, refresh, invalidate: invalidateWorkersCache }}
    >
      {children}
    </WorkersContext.Provider>
  );
};

export const useWorkers = () => {
  const ctx = useContext(WorkersContext);
  if (!ctx) throw new Error("useWorkers must be used inside <WorkersProvider>");
  return ctx;
};
