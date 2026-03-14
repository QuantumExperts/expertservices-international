const { ConfidentialClientApplication } = require('@azure/msal-node');

const TENANT_ID = process.env.AZURE_TENANT_ID;
const CLIENT_ID = process.env.AZURE_CLIENT_ID;
const CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET;
const SITE_HOSTNAME = 'quantumexperts.sharepoint.com';
const SITE_PATH = '/sites/ESISecurePortal';
const LIBRARY_NAME = 'Nominations';

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
    const folderName = body.folderName || '';
    const nominatingName = body.nominatingName || 'Unknown';
    const organisation = body.organisation || '';
    const email = body.email || '';
    const phone = body.phone || '';
    const positionTitle = body.positionTitle || '';
    const engagementType = body.engagementType || '';
    const jurisdiction = body.jurisdiction || '';
    const matterReference = body.matterReference || '';
    const matterDescription = body.matterDescription || '';
    const disputeValue = body.disputeValue || '';
    const opposingParty = body.opposingParty || '';
    const opposingRep = body.opposingRep || '';
    const conflictsDetails = body.conflictsDetails || '';
    const uploadedFiles = body.uploadedFiles || [];

    if (!folderName) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Folder name is required.' }),
      };
    }

    const token = await getAccessToken();
    const siteId = await getSiteId(token);
    const driveId = await getDriveId(token, siteId);

    // Create nomination metadata text file
    const timestamp = new Date().toISOString();
    const metadata = [
      'Nomination Details',
      '==================',
      `Date Submitted: ${timestamp}`,
      '',
      'NOMINATING PARTY',
      `Full Name: ${nominatingName}`,
      `Organisation: ${organisation}`,
      `Email: ${email}`,
      `Phone: ${phone}`,
      `Position/Title: ${positionTitle}`,
      '',
      'ENGAGEMENT DETAILS',
      `Engagement Type: ${engagementType}`,
      `Jurisdiction: ${jurisdiction}`,
      `Matter Reference: ${matterReference}`,
      `Estimated Dispute Value: ${disputeValue}`,
      '',
      'Matter Description:',
      matterDescription,
      '',
      'OPPOSING PARTY',
      `Opposing Party Name: ${opposingParty}`,
      `Opposing Legal Representative: ${opposingRep}`,
      '',
      'CONFLICTS CHECK',
      conflictsDetails,
      '',
      'DOCUMENTS UPLOADED',
      ...uploadedFiles.map((f) => `  - ${f.name} (${(f.size / 1024 / 1024).toFixed(2)} MB)`),
      uploadedFiles.length === 0 ? '  None' : '',
      '',
      `Total Files: ${uploadedFiles.length}`,
      `Total Size: ${(uploadedFiles.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024).toFixed(2)} MB`,
    ].join('\n');

    const metadataFileName = `nomination-${timestamp.replace(/[:.]/g, '-')}.txt`;
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
        message: 'Nomination metadata recorded successfully.',
      }),
    };
  } catch (err) {
    console.error('Nomination metadata error:', err.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to record nomination details.' }),
    };
  }
};
