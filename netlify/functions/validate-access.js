const { ConfidentialClientApplication } = require('@azure/msal-node');

const TENANT_ID = process.env.AZURE_TENANT_ID;
const CLIENT_ID = process.env.AZURE_CLIENT_ID;
const CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET;
const SITE_HOSTNAME = 'quantumexperts.sharepoint.com';
const SITE_PATH = '/sites/ESISecurePortal';
const LIST_NAME = 'Matter Register';

const msalConfig = {
  auth: {
    clientId: CLIENT_ID,
    authority: `https://login.microsoftonline.com/${TENANT_ID}`,
    clientSecret: CLIENT_SECRET,
  },
};

async function getAccessToken() {
  const cca = new ConfidentialClientApplication(msalConfig);
  const result = await cca.acquireTokenByClientCredential({
    scopes: ['https://graph.microsoft.com/.default'],
  });
  return result.accessToken;
}

async function getSiteId(token) {
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/sites/${SITE_HOSTNAME}:${SITE_PATH}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(`Failed to get site: ${JSON.stringify(data)}`);
  return data.id;
}

async function validateMatterAccess(token, siteId, matterReference, accessCode) {
  // Fetch all items from the Matter Register with their fields
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${encodeURIComponent(LIST_NAME)}/items?$expand=fields&$top=500`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  const data = await res.json();
  if (!res.ok) throw new Error(`Failed to query list: ${JSON.stringify(data)}`);

  // Find matching active matter with correct access code
  if (data.value && data.value.length > 0) {
    const match = data.value.find((item) => {
      const f = item.fields;
      return f &&
        f.MatterReference === matterReference &&
        f.AccessCode === accessCode &&
        f.Status === 'Active';
    });

    if (match) {
      return {
        valid: true,
        matterReference: match.fields.MatterReference,
        clientName: match.fields.ClientName || '',
        matterDescription: match.fields.MatterDescription || '',
      };
    }
  }

  return { valid: false };
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const body = JSON.parse(event.body);
    const matterReference = (body.matterReference || '').trim();
    const accessCode = (body.accessCode || '').trim();

    if (!matterReference || !accessCode) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ valid: false, error: 'Matter reference and access code are required.' }),
      };
    }

    const token = await getAccessToken();
    const siteId = await getSiteId(token);
    const result = await validateMatterAccess(token, siteId, matterReference, accessCode);

    if (result.valid) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          valid: true,
          matterReference: result.matterReference,
        }),
      };
    } else {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          valid: false,
          error: 'Invalid matter reference or access code. Please check your details and try again.',
        }),
      };
    }
  } catch (err) {
    console.error('Validation error:', err.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ valid: false, error: 'An error occurred during validation. Please try again.' }),
    };
  }
};
