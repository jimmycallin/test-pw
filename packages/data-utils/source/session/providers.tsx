// :copyright: Copyright (c) 2022 ftrack

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  QueryClient,
  QueryClientProvider as ReactQueryClientProvider,
} from "@tanstack/react-query";
import { Session } from "@ftrack/api";
import { v4 as uuid } from "uuid";

const defaultQueryClient = new QueryClient();

export function getDefaultQueryClient() {
  return defaultQueryClient;
}

interface QueryClientProviderOptions {
  children: React.ReactNode;
  queryClient?: QueryClient;
}

declare global {
  interface Window {
    showDebugTools: Function;
  }
}

class UpdateEventTarget extends EventTarget {}

export function QueryClientProvider({
  children,
  queryClient = defaultQueryClient,
}: QueryClientProviderOptions) {
  const [devtoolsOpen, showDebugTools] = useState(false);
  window.showDebugTools = () => showDebugTools(true);
  return (
    <ReactQueryClientProvider client={queryClient}>
      {children}
      {devtoolsOpen && <ReactQueryDevtools initialIsOpen={true} />}
    </ReactQueryClientProvider>
  );
}

interface SessionContextType {
  session: Session | null;
  updateEventTarget: UpdateEventTarget | null;
}

const SessionContext = createContext<SessionContextType>({
  session: null,
  updateEventTarget: null,
});

const PushTokenContext = createContext<string>(uuid());

interface PushTokenProps {
  children?: React.ReactNode;
}

export const PushTokenProvider = ({ children }: PushTokenProps) => {
  const pushTokenRef = useRef<string>(uuid());
  return (
    <PushTokenContext.Provider
      value={pushTokenRef.current}
      children={children}
    />
  );
};

export function usePushTokenContext() {
  return useContext(PushTokenContext);
}

export function useSessionContext() {
  return useContext(SessionContext);
}

interface SessionProviderProps {
  session: Session;
  children: React.ReactNode;
  queryClient?: QueryClient;
  disableEventHub?: boolean;
}

// Passing custom queryClient is only used for tests
export const SessionProvider = ({
  session,
  children,
  queryClient,
  disableEventHub = false,
}: SessionProviderProps) => {
  const [initialized, setInitialized] = useState(session.initialized);

  if (!initialized) {
    session.initializing.then(() => {
      setInitialized(true);
    });
  }
  const updateEventTargetRef = useRef(new UpdateEventTarget());

  useEffect(() => {
    if (disableEventHub) return;
    let subscriptionId: string;
    try {
      subscriptionId = session.eventHub.subscribe(
        "topic=ftrack.update",
        (event) => {
          updateEventTargetRef.current.dispatchEvent(
            new CustomEvent("ftrack.update", {
              detail: event,
            })
          );
        }
      );
    } catch (error) {
      console.log(error, "Unable to subscribe to update events");
    }
    return () => {
      if (subscriptionId && !disableEventHub) {
        try {
          session.eventHub.unsubscribe(subscriptionId);
        } catch (error) {
          console.log(error, "Unable to unsubscribe from update events");
        }
      }
    };
  }, [session, disableEventHub]);

  return (
    <SessionContext.Provider
      value={{
        session,
        updateEventTarget: updateEventTargetRef.current,
      }}
    >
      <PushTokenProvider>
        <QueryClientProvider queryClient={queryClient}>
          {initialized && children}
        </QueryClientProvider>
      </PushTokenProvider>
    </SessionContext.Provider>
  );
};
