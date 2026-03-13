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
    const partyName = body.partyName || 'Unknown';
    const organisation = body.organisation || '';
    const email = body.email || '';
    const phone = body.phone || '';
    const description = body.description || '';
    const uploadedFiles = body.uploadedFiles || []; // Array of { name, size }

    if (!matterReference || !accessCode) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Matter reference and access code are required.' }),
      };
    }

    const token = await getAccessToken();
    const siteId = await getSiteId(token);

    // Validate access again for security
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

    // Create submission metadata text file
    const timestamp = new Date().toISOString();
    const metadata = [
      'Submission Details',
      '==================',
      `Date: ${timestamp}`,
      `Matter Reference: ${matterReference}`,
      `Uploading Party: ${partyName}`,
      `Organisation: ${organisation}`,
      `Email: ${email}`,
      `Phone: ${phone}`,
      `Description: ${description}`,
      '',
      'Files Uploaded:',
      ...uploadedFiles.map((f) => `  - ${f.name} (${(f.size / 1024 / 1024).toFixed(2)} MB)`),
      '',
      `Total Files: ${uploadedFiles.length}`,
      `Total Size: ${(uploadedFiles.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024).toFixed(2)} MB`,
    ].join('\n');

    const metadataFileName = `submission-${timestamp.replace(/[:.]/g, '-')}.txt`;
    const encodedPath = encodeURIComponent(folderName) + '/' + encodeURIComponent(metadataFileName);

    const uploadRes = await fetch(
      `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${encodedPath}:/content`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/plain',
        },
        body: metadata,
      }
    );

    if (!uploadRes.ok) {
      const err = await uploadRes.json();
      throw new Error(`Failed to upload metadata: ${JSON.stringify(err)}`);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Submission metadata recorded successfully.',
      }),
    };
  } catch (err) {
    console.error('Metadata upload error:', err.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to record submission metadata.' }),
    };
  }
};
