import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

/** MSW worker for the browser (dev demo without a backend). */
export const worker = setupWorker(...handlers);
