export type ProviderKey = "salesforce" | "hubspot" | "pipedrive" | "google" | "microsoft" | "slack" | "bi";

export interface ProviderDef {
  key: ProviderKey;
  name: string;
  category: "CRM" | "Email and calendar" | "Messaging" | "Business intelligence";
  description: string;
  syncs: string[];
  auth: "oauth" | "token";
  envId?: string;
  envSecret?: string;
  authorizeUrl?: string;
  tokenUrl?: string;
  scopes?: string;
  docs: string;
}

export const PROVIDERS: ProviderDef[] = [
  { key: "salesforce", name: "Salesforce", category: "CRM", description: "Import accounts, contacts and opportunities from Salesforce.", syncs: ["Accounts", "Contacts", "Opportunities"], auth: "oauth", envId: "SALESFORCE_CLIENT_ID", envSecret: "SALESFORCE_CLIENT_SECRET", authorizeUrl: `${process.env.SALESFORCE_LOGIN_URL ?? "https://login.salesforce.com"}/services/oauth2/authorize`, tokenUrl: `${process.env.SALESFORCE_LOGIN_URL ?? "https://login.salesforce.com"}/services/oauth2/token`, scopes: "api refresh_token", docs: "Create a Connected App with OAuth enabled and the callback URL shown below." },
  { key: "hubspot", name: "HubSpot", category: "CRM", description: "Import companies, contacts and deals from HubSpot.", syncs: ["Companies", "Contacts", "Deals"], auth: "oauth", envId: "HUBSPOT_CLIENT_ID", envSecret: "HUBSPOT_CLIENT_SECRET", authorizeUrl: "https://app.hubspot.com/oauth/authorize", tokenUrl: "https://api.hubapi.com/oauth/v1/token", scopes: "crm.objects.companies.read crm.objects.contacts.read crm.objects.deals.read oauth", docs: "Create a public app in your HubSpot developer account with the callback URL shown below." },
  { key: "pipedrive", name: "Pipedrive", category: "CRM", description: "Import organisations, people and deals from Pipedrive.", syncs: ["Organisations", "People", "Deals"], auth: "oauth", envId: "PIPEDRIVE_CLIENT_ID", envSecret: "PIPEDRIVE_CLIENT_SECRET", authorizeUrl: "https://oauth.pipedrive.com/oauth/authorize", tokenUrl: "https://oauth.pipedrive.com/oauth/token", scopes: "", docs: "Create an app in the Pipedrive Developer Hub with the callback URL shown below." },
  { key: "google", name: "Google Workspace", category: "Email and calendar", description: "Import Google Calendar meetings and match them to accounts by attendee domain.", syncs: ["Calendar meetings"], auth: "oauth", envId: "GOOGLE_CLIENT_ID", envSecret: "GOOGLE_CLIENT_SECRET", authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth", tokenUrl: "https://oauth2.googleapis.com/token", scopes: "https://www.googleapis.com/auth/calendar.readonly openid email", docs: "Create an OAuth client in Google Cloud Console with the callback URL shown below." },
  { key: "microsoft", name: "Microsoft Outlook", category: "Email and calendar", description: "Import Outlook calendar meetings and match them to accounts by attendee domain.", syncs: ["Calendar meetings"], auth: "oauth", envId: "MICROSOFT_CLIENT_ID", envSecret: "MICROSOFT_CLIENT_SECRET", authorizeUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize", tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token", scopes: "offline_access User.Read Calendars.Read", docs: "Register an application in Microsoft Entra ID with the callback URL shown below." },
  { key: "slack", name: "Slack", category: "Messaging", description: "Send agent approvals, deal risk alerts and forecast summaries to a Slack channel.", syncs: ["Alerts to a channel"], auth: "oauth", envId: "SLACK_CLIENT_ID", envSecret: "SLACK_CLIENT_SECRET", authorizeUrl: "https://slack.com/oauth/v2/authorize", tokenUrl: "https://slack.com/api/oauth.v2.access", scopes: "incoming-webhook", docs: "Create a Slack app with the incoming webhook feature and the callback URL shown below." },
  { key: "bi", name: "Business intelligence", category: "Business intelligence", description: "Read revenue metrics, pipeline and forecasts from Power BI, Looker, Tableau or any tool that calls a JSON API.", syncs: ["Metrics API"], auth: "token", docs: "Generate an access token and call the metrics endpoint with it." },
];

export function getProvider(key: string): ProviderDef | undefined {
  return PROVIDERS.find((p) => p.key === key);
}

/** A provider is available only when its OAuth app credentials are configured on the server. */
export function providerConfigured(key: ProviderKey): boolean {
  const p = getProvider(key);
  if (!p) return false;
  if (p.auth === "token") return true;
  return Boolean(p.envId && p.envSecret && process.env[p.envId] && process.env[p.envSecret]);
}
