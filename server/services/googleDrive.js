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

export async function getOrCreateFolder(drive, pacienteId, pacienteNombre) {
  const rootName = 'Agenda Psicope';
  const folderName = `Psicope-Paciente-${pacienteId}`;

  // Buscar carpeta raíz
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
      requestBody: {
        name: rootName,
        mimeType: 'application/vnd.google-apps.folder',
      },
      fields: 'id',
    });
    rootId = root.data.id;
  }

  // Buscar carpeta del paciente
  const folderSearch = await drive.files.list({
    q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and '${rootId}' in parents and trashed=false`,
    fields: 'files(id)',
    spaces: 'drive',
  });

  if (folderSearch.data.files.length > 0) {
    return folderSearch.data.files[0].id;
  }

  const folder = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [rootId],
    },
    fields: 'id',
  });

  return folder.data.id;
}

export function bufferToStream(buffer) {
  const readable = new Readable();
  readable.push(buffer);
  readable.push(null);
  return readable;
}
