// :copyright: Copyright (c) 2022 ftrack

import { FullConfig } from "@playwright/test";
import { queryClient } from "@test-pw/data-utils";

async function globalSetup(config: FullConfig) {
  const { baseURL, storageState } = config.projects[0].use;
  console.log("HELLO", queryClient);
}

export default globalSetup;
