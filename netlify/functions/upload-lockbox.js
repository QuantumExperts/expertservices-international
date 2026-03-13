const { ConfidentialClientApplication } = require('@azure/msal-node');
const Busboy = require('busboy');

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

async function ensureFolder(token, driveId, folderName) {
  // Try to get the folder first
  const checkRes = await fetch(
    `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${folderName}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (checkRes.ok) return;

  // Create the folder
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

async function uploadFile(token, driveId, folderName, fileName, fileBuffer) {
  const encodedPath = encodeURIComponent(folderName) + '/' + encodeURIComponent(fileName);
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${encodedPath}:/content`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/octet-stream',
      },
      body: fileBuffer,
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(`Failed to upload file: ${JSON.stringify(data)}`);
  return data;
}

function parseMultipart(event) {
  return new Promise((resolve, reject) => {
    const fields = {};
    const files = [];

    const contentType = event.headers['content-type'] || event.headers['Content-Type'];
    const busboy = Busboy({ headers: { 'content-type': contentType } });

    busboy.on('field', (name, val) => {
      fields[name] = val;
    });

    busboy.on('file', (name, stream, info) => {
      const { filename, mimeType } = info;
      const chunks = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => {
        files.push({
          fieldName: name,
          filename,
          mimeType,
          buffer: Buffer.concat(chunks),
        });
      });
    });

    busboy.on('finish', () => resolve({ fields, files }));
    busboy.on('error', reject);

    const body = event.isBase64Encoded
      ? Buffer.from(event.body, 'base64')
      : Buffer.from(event.body);
    busboy.end(body);
  });
}

exports.handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { fields, files } = await parseMultipart(event);

    const matterRef = fields['matter-reference'] || fields['matter-ref'] || 'Unspecified';
    const accessCode = fields['access-code'] || '';
    const partyName = fields['uploading-party'] || 'Unknown';
    const organisation = fields['organisation'] || '';
    const email = fields['email'] || '';
    const description = fields['document-description'] || '';

    const token = await getAccessToken();
    const siteId = await getSiteId(token);

    // Validate matter reference and access code against Matter Register
    const filterQuery = encodeURIComponent(
      `fields/MatterReference eq '${matterRef.replace(/'/g, "''")}' and fields/AccessCode eq '${accessCode.replace(/'/g, "''")}' and fields/Status eq 'Active'`
    );
    const validateRes = await fetch(
      `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${encodeURIComponent(MATTER_REGISTER_LIST)}/items?$filter=${filterQuery}&$expand=fields&$top=1`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const validateData = await validateRes.json();

    if (!validateRes.ok || !validateData.value || validateData.value.length === 0) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Invalid matter reference or access code. Upload rejected.' }),
      };
    }

    // Sanitise folder name
    const folderName = matterRef.replace(/[<>:"/\\|?*]/g, '_').trim();

    const driveId = await getDriveId(token, siteId);

    // Create matter folder
    await ensureFolder(token, driveId, folderName);

    // Upload each file
    const uploaded = [];
    for (const file of files) {
      const result = await uploadFile(token, driveId, folderName, file.filename, file.buffer);
      uploaded.push({ name: file.filename, size: file.buffer.length, webUrl: result.webUrl });
    }

    // Upload a submission metadata text file
    const timestamp = new Date().toISOString();
    const metadata = [
      `Submission Details`,
      `==================`,
      `Date: ${timestamp}`,
      `Matter Reference: ${matterRef}`,
      `Uploading Party: ${partyName}`,
      `Organisation: ${organisation}`,
      `Email: ${email}`,
      `Description: ${description}`,
      ``,
      `Files Uploaded:`,
      ...uploaded.map((f) => `  - ${f.name} (${(f.size / 1024).toFixed(1)} KB)`),
    ].join('\n');

    await uploadFile(
      token,
      driveId,
      folderName,
      `submission-${timestamp.replace(/[:.]/g, '-')}.txt`,
      Buffer.from(metadata, 'utf-8')
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Documents uploaded successfully',
        filesUploaded: uploaded.length,
      }),
    };
  } catch (err) {
    console.error('Upload error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Upload failed. Please try again or contact us directly.' }),
    };
  }
};
