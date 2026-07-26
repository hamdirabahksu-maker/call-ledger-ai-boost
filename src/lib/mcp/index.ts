import { auth, defineMcp } from "@lovable.dev/mcp-js";
import businessSummaryTool from "./tools/business-summary";
import createBookingTool from "./tools/create-booking";
import createLeadTool from "./tools/create-lead";
import listBookingsTool from "./tools/list-bookings";
import listCustomersTool from "./tools/list-customers";
import listLeadsTool from "./tools/list-leads";
import listMissedCallsTool from "./tools/list-missed-calls";

// Must be the direct Supabase host: the published SUPABASE_URL is a proxy that
// fails RFC 8414 issuer matching. VITE_SUPABASE_PROJECT_ID is inlined at build.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "callledger-mcp",
  title: "CallLedger",
  version: "0.1.0",
  instructions:
    "Tools for CallLedger, the AI front office for service businesses. Read and create leads, bookings, customers and missed-call records for the signed-in business. For clinics, scheduling is administrative only — never give medical advice.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    businessSummaryTool,
    listLeadsTool,
    createLeadTool,
    listBookingsTool,
    createBookingTool,
    listCustomersTool,
    listMissedCallsTool,
  ],
});
