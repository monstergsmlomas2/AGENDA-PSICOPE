import { google } from 'googleapis';
import { Readable } from 'stream';

export function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

export function getAuthenticatedDrive(tokens) {
  const auth = getOAuth2Client();
  auth.setCredentials(tokens);
  return google.drive({ version: 'v3', auth });
}

export async function refreshTokensIfNeeded(tokens) {
  const now = Date.now();
  if (tokens.expiry_date && tokens.expiry_date > now + 60000) {
    return { tokens, refreshed: false };
  }
  const auth = getOAuth2Client();
  auth.setCredentials(tokens);
  const { credentials } = await auth.refreshAccessToken();
  return { tokens: credentials, refreshed: true };
}

async function findOrCreateFolder(drive, name, parentId) {
  const search = await drive.files.list({
    q: `name='${name}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`,
    fields: 'files(id)',
    spaces: 'drive',
  });
  if (search.data.files.length > 0) return search.data.files[0].id;

  const created = await drive.files.create({
    requestBody: { name, mimeType: 'application/vnd.google-apps.folder', parents: [parentId] },
    fields: 'id',
  });
  return created.data.id;
}

export async function getOrCreateFolder(drive, pacienteId, subfolderName = null) {
  const rootName = 'Agenda Psicope';
  const folderName = `Psicope-Paciente-${pacienteId}`;

  // Carpeta raíz
  const rootSearch = await drive.files.list({
    q: `name='${rootName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id)',
    spaces: 'drive',
  });

  let rootId;
  if (rootSearch.data.files.length > 0) {
    rootId = rootSearch.data.files[0].id;
  } else {
    const root = await drive.files.create({
      requestBody: { name: rootName, mimeType: 'application/vnd.google-apps.folder' },
      fields: 'id',
    });
    rootId = root.data.id;
  }

  // Carpeta del paciente
  const pacienteId_ = await findOrCreateFolder(drive, folderName, rootId);

  // Subcarpeta de sección (Informes, Evaluaciones, etc.)
  if (subfolderName) {
    return await findOrCreateFolder(drive, subfolderName, pacienteId_);
  }

  return pacienteId_;
}

export function bufferToStream(buffer) {
  const readable = new Readable();
  readable.push(buffer);
  readable.push(null);
  return readable;
}
