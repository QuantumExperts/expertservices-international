const { ConfidentialClientApplication } = require('@azure/msal-node');

const TENANT_ID = process.env.AZURE_TENANT_ID;
const CLIENT_ID = process.env.AZURE_CLIENT_ID;
const CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET;
const SITE_HOSTNAME = 'quantumexperts.sharepoint.com';
const SITE_PATH = '/sites/ESISecurePortal';
const LIBRARY_NAME = 'Lockbox';
const MATTER_REGISTER_LIST = 'Matter Register';

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

async function getDriveId(token, siteId) {
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/sites/${siteId}/drives`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(`Failed to get drives: ${JSON.stringify(data)}`);
  const drive = data.value.find((d) => d.name === LIBRARY_NAME);
  if (!drive) throw new Error(`Drive "${LIBRARY_NAME}" not found`);
  return drive.id;
}

async function validateMatterAccess(token, siteId, matterReference, accessCode) {
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${encodeURIComponent(MATTER_REGISTER_LIST)}/items?$expand=fields&$top=500`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await res.json();
  if (!res.ok) return false;

  if (data.value && data.value.length > 0) {
    return data.value.find((item) => {
      const f = item.fields;
      return f &&
        f.MatterReference === matterReference &&
        f.AccessCode === accessCode &&
        f.Status === 'Active';
    });
  }
  return false;
}

async function ensureFolder(token, driveId, folderName) {
  const checkRes = await fetch(
    `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${folderName}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (checkRes.ok) return;

  const createRes = await fetch(
    `https://graph.microsoft.com/v1.0/drives/${driveId}/root/children`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: folderName,
        folder: {},
        '@microsoft.graph.conflictBehavior': 'fail',
      }),
    }
  );
  if (!createRes.ok && createRes.status !== 409) {
    const err = await createRes.json();
    throw new Error(`Failed to create folder: ${JSON.stringify(err)}`);
  }
}

async function createUploadSession(token, driveId, folderName, fileName) {
  const encodedPath = encodeURIComponent(folderName) + '/' + encodeURIComponent(fileName);
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${encodedPath}:/createUploadSession`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        item: {
          '@microsoft.graph.conflictBehavior': 'rename',
          name: fileName,
        },
      }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(`Failed to create upload session for ${fileName}: ${JSON.stringify(data)}`);
  return data.uploadUrl;
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
    const files = body.files || []; // Array of { name, size }

    if (!matterReference || !accessCode || files.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Matter reference, access code, and at least one file are required.' }),
      };
    }

    const token = await getAccessToken();
    const siteId = await getSiteId(token);

    // Validate access
    const validMatter = await validateMatterAccess(token, siteId, matterReference, accessCode);
    if (!validMatter) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Invalid matter reference or access code.' }),
      };
    }

    const driveId = await getDriveId(token, siteId);
    const folderName = matterReference.replace(/[<>:"/\\|?*]/g, '_').trim();

    // Ensure matter folder exists
    await ensureFolder(token, driveId, folderName);

    // Create upload sessions for each file
    const sessions = [];
    for (const file of files) {
      const uploadUrl = await createUploadSession(token, driveId, folderName, file.name);
      sessions.push({
        fileName: file.name,
        fileSize: file.size,
        uploadUrl: uploadUrl,
      });
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        folderName: folderName,
        driveId: driveId,
        sessions: sessions,
      }),
    };
  } catch (err) {
    console.error('Create upload sessions error:', err.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to prepare upload sessions. Please try again.' }),
    };
  }
};
