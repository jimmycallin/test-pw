// :copyright: Copyright (c) 2023 ftrack

import { Session } from "@ftrack/api";

let session: Session | null = null;

export interface GetSessionOptions {
  serverUrl?: string;
  apiUser: string;
  apiEndpoint?: string;
  apiKey: string;
  clientToken?: string;
  autoConnectEventHub?: boolean;
  serverInformationValues?: string[];
  eventHubOptions?: { applicationId: string };
}

export function initializeSession({
  serverUrl = window.location.origin,
  apiEndpoint,
  apiUser,
  apiKey,
  eventHubOptions,
  clientToken,
  autoConnectEventHub = true,
  serverInformationValues = [],
}: GetSessionOptions): Session {
  if (session) {
    throw new Error("Session already exists, cannot reinitialize.");
  }

  session = new Session(serverUrl, apiUser, apiKey, {
    autoConnectEventHub: autoConnectEventHub,
    apiEndpoint,
    clientToken: clientToken,
    serverInformationValues,
    eventHubOptions,
  });
  return session;
}

export function getSession(): Session {
  if (!session) {
    throw new Error("Session not initialized.");
  }
  return session;
}
