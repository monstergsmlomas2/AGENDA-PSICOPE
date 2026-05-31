import express from 'express';
import multer from 'multer';
import pool from '../config/db.js';
import {
  getOAuth2Client,
  getAuthenticatedDrive,
  refreshTokensIfNeeded,
  getOrCreateFolder,
  bufferToStream,
} from '../services/googleDrive.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const CLIENT_URL = process.env.NODE_ENV === 'production'
  ? (process.env.CLIENT_URL || 'https://agenda-psicope.vercel.app')
  : 'http://localhost:5173';

async function getTokensFromDB(userId) {
  const result = await pool.query(
    'SELECT access_token, refresh_token, expiry_date FROM google_drive_tokens WHERE usuario_id = $1',
    [userId]
  );
  return result.rows[0] || null;
}

async function saveTokensToDB(userId, tokens) {
  await pool.query(
    `INSERT INTO google_drive_tokens (usuario_id, access_token, refresh_token, expiry_date, actualizado_en)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (usuario_id) DO UPDATE SET
       access_token = EXCLUDED.access_token,
       refresh_token = COALESCE(EXCLUDED.refresh_token, google_drive_tokens.refresh_token),
       expiry_date = EXCLUDED.expiry_date,
       actualizado_en = NOW()`,
    [userId, tokens.access_token, tokens.refresh_token, tokens.expiry_date]
  );
}

// GET /drive/auth-url
router.get('/auth-url', (req, res) => {
  const oauth2Client = getOAuth2Client();
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/drive.file'],
    state: req.userId,
  });
  res.json({ url });
});

// GET /drive/token — devuelve el access_token para el Google Picker en el cliente
router.get('/token', async (req, res) => {
  try {
    let tokens = await getTokensFromDB(req.userId);
    if (!tokens) return res.status(401).json({ error: 'drive_not_connected' });

    const { tokens: refreshed, refreshed: didRefresh } = await refreshTokensIfNeeded(tokens);
    if (didRefresh) {
      await saveTokensToDB(req.userId, refreshed);
      tokens = refreshed;
    }

    res.json({ access_token: tokens.access_token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener token' });
  }
});

// GET /drive/status
router.get('/status', async (req, res) => {
  try {
    const tokens = await getTokensFromDB(req.userId);
    res.json({ connected: !!tokens });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al verificar estado de Drive' });
  }
});

// DELETE /drive/disconnect
router.delete('/disconnect', async (req, res) => {
  try {
    await pool.query('DELETE FROM google_drive_tokens WHERE usuario_id = $1', [req.userId]);
    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al desconectar Drive' });
  }
});

// GET /drive/archivos/:pacienteId
router.get('/archivos/:pacienteId', async (req, res) => {
  try {
    let tokens = await getTokensFromDB(req.userId);
    if (!tokens) return res.status(401).json({ error: 'drive_not_connected' });

    const { tokens: refreshed, refreshed: didRefresh } = await refreshTokensIfNeeded(tokens);
    if (didRefresh) {
      await saveTokensToDB(req.userId, refreshed);
      tokens = refreshed;
    }

    const drive = getAuthenticatedDrive(tokens);
    const folderId = await getOrCreateFolder(drive, req.params.pacienteId);

    const result = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'files(id,name,size,mimeType,createdTime,webViewLink)',
      orderBy: 'createdTime desc',
    });

    res.json(result.data.files);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al listar archivos' });
  }
});

// POST /drive/archivos/:pacienteId
router.post('/archivos/:pacienteId', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se recibió archivo' });

    let tokens = await getTokensFromDB(req.userId);
    if (!tokens) return res.status(401).json({ error: 'drive_not_connected' });

    const { tokens: refreshed, refreshed: didRefresh } = await refreshTokensIfNeeded(tokens);
    if (didRefresh) {
      await saveTokensToDB(req.userId, refreshed);
      tokens = refreshed;
    }

    const drive = getAuthenticatedDrive(tokens);
    const folderId = await getOrCreateFolder(drive, req.params.pacienteId);

    const fileName = req.file.originalname;
    const result = await drive.files.create({
      requestBody: { name: fileName, parents: [folderId] },
      media: { mimeType: req.file.mimetype, body: bufferToStream(req.file.buffer) },
      fields: 'id,name,webViewLink',
    });

    res.json(result.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al subir archivo' });
  }
});

// POST /drive/vincular/:pacienteId — copia un archivo existente del Drive a la carpeta del paciente
router.post('/vincular/:pacienteId', async (req, res) => {
  try {
    const { fileId, fileName, mimeType } = req.body;
    if (!fileId || !fileName) return res.status(400).json({ error: 'fileId y fileName requeridos' });

    let tokens = await getTokensFromDB(req.userId);
    if (!tokens) return res.status(401).json({ error: 'drive_not_connected' });

    const { tokens: refreshed, refreshed: didRefresh } = await refreshTokensIfNeeded(tokens);
    if (didRefresh) {
      await saveTokensToDB(req.userId, refreshed);
      tokens = refreshed;
    }

    const drive = getAuthenticatedDrive(tokens);
    const folderId = await getOrCreateFolder(drive, req.params.pacienteId);

    // Copiar el archivo a la carpeta del paciente
    const result = await drive.files.copy({
      fileId,
      requestBody: { name: fileName, parents: [folderId] },
      fields: 'id,name,webViewLink,mimeType,size,createdTime',
    });

    res.json(result.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al vincular archivo' });
  }
});

// DELETE /drive/archivos/:pacienteId/:fileId
router.delete('/archivos/:pacienteId/:fileId', async (req, res) => {
  try {
    let tokens = await getTokensFromDB(req.userId);
    if (!tokens) return res.status(401).json({ error: 'drive_not_connected' });

    const { tokens: refreshed, refreshed: didRefresh } = await refreshTokensIfNeeded(tokens);
    if (didRefresh) {
      await saveTokensToDB(req.userId, refreshed);
      tokens = refreshed;
    }

    const drive = getAuthenticatedDrive(tokens);
    await drive.files.delete({ fileId: req.params.fileId });

    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar archivo' });
  }
});

// Named export para el callback de Google (sin authMiddleware)
export async function handleGoogleCallback(req, res) {
  const { code, state: userId } = req.query;

  if (!code || !userId) {
    return res.redirect(`${CLIENT_URL}/pacientes?drive=error`);
  }

  try {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    await saveTokensToDB(userId, tokens);
    res.redirect(`${CLIENT_URL}/pacientes?drive=connected`);
  } catch (error) {
    console.error('Error en callback de Google:', error);
    res.redirect(`${CLIENT_URL}/pacientes?drive=error`);
  }
}

export default router;
