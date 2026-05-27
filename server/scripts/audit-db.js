import pkg from "pg";
const { Pool } = pkg;
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "..", ".env") });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  ssl: { rejectUnauthorized: false },
});

// ─── HELPER ───
const report = { ok: [], warn: [], err: [] };
function ok(msg) {
  report.ok.push(msg);
  console.log(`  ✅ ${msg}`);
}
function warn(msg) {
  report.warn.push(msg);
  console.log(`  ⚠️ ${msg}`);
}
function err(msg) {
  report.err.push(msg);
  console.log(`  ❌ ${msg}`);
}

function printHeader(title) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${"=".repeat(60)}`);
}

async function query(text, params) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

// ─── 1. TABLAS EXISTENTES ───
async function checkTables() {
  printHeader("1. TABLAS EXISTENTES (schema public)");

  const { rows: tables } = await query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);

  const existingTables = tables.map((r) => r.table_name);
  console.log(`   Tablas en DB: [${existingTables.join(", ")}]`);

  const expectedTables = [
    "pacientes",
    "sesiones",
    "turnos",
    "consultorios",
    "obras_sociales",
    "informes",
    "evaluaciones",
    "pagos",
  ];

  for (const t of expectedTables) {
    if (existingTables.includes(t)) {
      ok(`Tabla "${t}" existe en la base de datos`);
    } else {
      err(`Tabla "${t}" NO existe en la base de datos`);
    }
  }

  // Tablas en DB pero no esperadas
  for (const t of existingTables) {
    if (!expectedTables.includes(t)) {
      warn(`Tabla "${t}" existe en DB pero no está en el listado esperado (schema fantasma)`);
    }
  }

  return existingTables;
}

// ─── 2. COLUMNAS POR TABLA ───
async function checkColumns() {
  printHeader("2. COLUMNAS POR TABLA");

  const expectedColumns = {
    pacientes: [
      { name: "id", type: "integer" },
      { name: "nombre", type: "character varying" },
      { name: "apellido", type: "character varying" },
      { name: "dni", type: "character varying" },
      { name: "fecha_nacimiento", type: "date" },
      { name: "telefono", type: "character varying" },
      { name: "email", type: "character varying" },
      { name: "obra_social", type: "character varying" }, // NOTA: usa obra_social (texto), NO obra_social_id
      { name: "motivo", type: "text" },
      { name: "entrevista", type: "jsonb" },
      { name: "created_at", type: "timestamp" },
      // Columnas adicionales detectadas en código
      { name: "sexo", type: "character varying" },
      { name: "domicilio", type: "text" },
      { name: "nro_afiliado", type: "character varying" },
      { name: "contacto_emergencia", type: "text" },
    ],
    sesiones: [
      { name: "id", type: "integer" },
      { name: "paciente_id", type: "integer" },
      { name: "fecha", type: "date" },
      { name: "observaciones", type: "text" },
      { name: "actividades_realizadas", type: "text" },
      { name: "created_at", type: "timestamp" },
    ],
    turnos: [
      { name: "id", type: "integer" },
      { name: "paciente_id", type: "integer" },
      { name: "fecha", type: "date" },
      { name: "hora", type: "time" },
      { name: "consultorio", type: "character varying" }, // NOTA: usa consultorio (texto), NO consultorio_id
      { name: "observaciones", type: "text" },
      { name: "estado", type: "character varying" },
      { name: "tipo_cobertura", type: "character varying" },
      { name: "created_at", type: "timestamp" },
    ],
    consultorios: [
      { name: "id", type: "integer" },
      { name: "nombre", type: "character varying" },
      { name: "direccion", type: "text" },
      { name: "color", type: "character varying" },
      { name: "created_at", type: "timestamp" },
    ],
    obras_sociales: [
      { name: "id", type: "integer" },
      { name: "nombre", type: "character varying" },
      { name: "codigo", type: "character varying" },
      { name: "sesiones_autorizadas", type: "integer" },
      { name: "valor_sesion", type: "numeric" },
      { name: "periodo_renovacion", type: "character varying" },
      { name: "observaciones", type: "text" },
      { name: "created_at", type: "timestamp" },
    ],
    informes: [
      { name: "id", type: "integer" },
      { name: "paciente_id", type: "integer" },
      { name: "tipo", type: "character varying" },
      { name: "fecha", type: "date" },
      { name: "contenido", type: "jsonb" },
      { name: "estado", type: "character varying" },
      { name: "fecha_vencimiento", type: "date" },
      { name: "created_at", type: "timestamp" },
    ],
    evaluaciones: [
      { name: "id", type: "integer" },
      { name: "paciente_id", type: "integer" },
      { name: "tipo_test", type: "character varying" },
      { name: "fecha_administracion", type: "date" },
      { name: "resultados", type: "jsonb" },
      { name: "puntaje_obtenido", type: "numeric" },
      { name: "observaciones", type: "text" },
      { name: "fecha_vencimiento", type: "date" },
      { name: "created_at", type: "timestamp" },
    ],
    pagos: [
      { name: "id", type: "integer" },
      { name: "paciente_id", type: "integer" },
      { name: "fecha", type: "date" },
      { name: "concepto", type: "character varying" },
      { name: "monto", type: "numeric" },
      { name: "tipo_pago", type: "character varying" },
      { name: "estado", type: "character varying" },
      { name: "observaciones", type: "text" },
      { name: "nro_sesion_facturada", type: "integer" },
      { name: "created_at", type: "timestamp" },
    ],
  };

  for (const [table, cols] of Object.entries(expectedColumns)) {
    console.log(`\n  ─── Tabla: ${table} ───`);
    const { rows: actualCols } = await query(
      `SELECT column_name, data_type, is_nullable, column_default
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = $1
       ORDER BY ordinal_position`,
      [table]
    );

    const actualMap = {};
    for (const c of actualCols) {
      actualMap[c.column_name] = c;
    }

    for (const col of cols) {
      const actual = actualMap[col.name];
      if (!actual) {
        err(`"${table}.${col.name}" — columna NO encontrada`);
        continue;
      }
      // Normalizar tipos para comparación
      const actualType = actual.data_type.toLowerCase();
      const expectedType = col.type.toLowerCase().replace("character varying", "text").replace("character", "text");

      if (actualType === expectedType || actualType.replace("time without time zone", "time") === expectedType) {
        ok(`"${table}.${col.name}" (${actual.data_type})`);
      } else {
        warn(`"${table}.${col.name}" — tipo esperado: ${col.type}, real: ${actual.data_type}`);
      }
      delete actualMap[col.column_name];
    }

    // Columnas extra (en DB pero no esperadas)
    for (const [extraName, extraCol] of Object.entries(actualMap)) {
      if (extraName !== "updated_at") {
        warn(`"${table}.${extraName}" — columna extra en DB (${extraCol.data_type}) no contemplada en la verificación`);
      }
    }
  }

  // ─── VERIFICACIÓN ESPECIAL: ¿existe obra_social_id en pacientes? ───
  const { rows: osIdCol } = await query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'pacientes' AND column_name = 'obra_social_id'`
  );
  if (osIdCol.length > 0) {
    warn(`"pacientes.obra_social_id" — existe como columna, pero el código usa "obra_social" (texto), no "obra_social_id" (FK). Posible inconsistencia de diseño.`);
  } else {
    ok(`"pacientes.obra_social_id" NO existe (correcto, el código usa obra_social como texto)`);
  }

  // ─── VERIFICACIÓN ESPECIAL: ¿existe consultorio_id en turnos? ───
  const { rows: consultorioIdCol } = await query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'turnos' AND column_name = 'consultorio_id'`
  );
  if (consultorioIdCol.length > 0) {
    warn(`"turnos.consultorio_id" — existe como columna, pero el código usa "consultorio" (texto), no "consultorio_id" (FK).`);
  } else {
    ok(`"turnos.consultorio_id" NO existe (correcto, el código usa consultorio como texto)`);
  }
}

// ─── 3. FOREIGN KEYS ───
async function checkForeignKeys() {
  printHeader("3. CLAVES FORÁNEAS");

  const { rows: fks } = await query(`
    SELECT
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
    ORDER BY tc.table_name, kcu.column_name
  `);

  const expectedFKs = [
    { from: "sesiones", col: "paciente_id", ref: "pacientes", refCol: "id" },
    { from: "turnos", col: "paciente_id", ref: "pacientes", refCol: "id" },
    { from: "informes", col: "paciente_id", ref: "pacientes", refCol: "id" },
    { from: "evaluaciones", col: "paciente_id", ref: "pacientes", refCol: "id" },
    { from: "pagos", col: "paciente_id", ref: "pacientes", refCol: "id" },
  ];

  const fkKey = (fk) => `${fk.from_table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`;
  const existingFKSet = new Set(fks.map(fkKey));

  console.log(`   FKs encontradas en DB (${fks.length}):`);
  for (const f of fks) {
    console.log(`     • ${fkKey(f)}`);
  }

  for (const efk of expectedFKs) {
    const key = `${efk.from}.${efk.col} → ${efk.ref}.${efk.refCol}`;
    if (existingFKSet.has(key)) {
      ok(`FK: ${key} — existe y es válida`);
    } else {
      // Revisar si la columna existe pero sin FK
      const { rows: colExists } = await query(
        `SELECT column_name FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2`,
        [efk.from, efk.col]
      );
      if (colExists.length > 0) {
        warn(`FK: ${key} — la columna existe pero NO tiene constraint de FK definido`);
      } else {
        err(`FK: ${key} — la columna NI SIQUIERA existe en la tabla`);
      }
    }
  }
}

// ─── 4. ÍNDICES ───
async function checkIndexes() {
  printHeader("4. ÍNDICES");

  const { rows: indexes } = await query(`
    SELECT
      tablename,
      indexname,
      indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename IN ('pacientes','sesiones','turnos','consultorios','obras_sociales','informes','evaluaciones','pagos')
    ORDER BY tablename, indexname
  `);

  const expectedIndexes = [
    { table: "turnos", col: "fecha", name: "idx_turnos_fecha" },
    { table: "turnos", col: "paciente_id", name: "idx_turnos_paciente_id" },
    { table: "pagos", col: "fecha", name: "idx_pagos_fecha" },
    { table: "pagos", col: "estado", name: "idx_pagos_estado" },
    { table: "sesiones", col: "fecha", name: "idx_sesiones_fecha" },
    { table: "sesiones", col: "paciente_id", name: "idx_sesiones_paciente_id" },
  ];

  const existingIndexNames = new Set(indexes.map((i) => i.indexname));

  console.log(`   Índices encontrados en DB (${indexes.length}):`);
  for (const idx of indexes) {
    console.log(`     • ${idx.indexname} (${idx.tablename}): ${idx.indexdef}`);
  }

  for (const ei of expectedIndexes) {
    if (existingIndexNames.has(ei.name)) {
      ok(`Índice "${ei.name}" sobre ${ei.table}(${ei.col}) — existe`);
    } else {
      warn(`Índice "${ei.name}" sobre ${ei.table}(${ei.col}) — NO encontrado (recomendado para rendimiento)`);
    }
  }

  // También verificar PKs (índices implícitos)
  const { rows: pks } = await query(`
    SELECT tc.table_name, kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'PRIMARY KEY'
      AND tc.table_schema = 'public'
    ORDER BY tc.table_name
  `);

  console.log(`\n   Primary Keys encontradas (${pks.length}):`);
  const tablesWithPK = new Set(pks.map((p) => p.table_name));
  for (const t of ["pacientes", "sesiones", "turnos", "consultorios", "obras_sociales", "informes", "evaluaciones", "pagos"]) {
    if (tablesWithPK.has(t)) {
      ok(`PK en "${t}" (${pks.find((p) => p.table_name === t)?.column_name})`);
    } else {
      err(`NO hay PK definida en "${t}"`);
    }
  }
}

// ─── 5. DATOS DE PRUEBA (conteo de registros) ───
async function checkRowCounts(existingTables) {
  printHeader("5. CONTEO DE REGISTROS");

  for (const table of existingTables) {
    try {
      const { rows } = await query(`SELECT COUNT(*)::int AS count FROM "${table}"`);
      const count = rows[0].count;
      if (count > 0) {
        ok(`"${table}" — ${count} registros`);
      } else {
        warn(`"${table}" — 0 registros (tabla vacía)`);
      }
    } catch (e) {
      err(`"${table}" — error al contar: ${e.message}`);
    }
  }
}

// ─── 6. INCONSISTENCIAS ───
async function checkInconsistencies(existingTables) {
  printHeader("6. INCONSISTENCIAS DETECTADAS");

  // ¿Tablas en DB sin ruta en el servidor?
  const routedTables = ["pacientes", "turnos", "consultorios", "obras_sociales", "informes", "evaluaciones", "pagos"]; // sesiones está embebida en pacientes
  for (const t of existingTables) {
    if (!routedTables.includes(t) && t !== "sesiones") {
      warn(`Tabla "${t}" existe en DB pero no tiene ruta montada en server.js`);
    }
  }

  // ¿Columnas usadas en queries que no existen?
  // Verificar específicamente:
  // - pacientes.motivo_consulta (si alguien renombró)
  const { rows: motivoConsulta } = await query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'pacientes' AND column_name = 'motivo_consulta'`
  );
  if (motivoConsulta.length > 0) {
    warn(`La columna se llama "motivo_consulta" en lugar de "motivo" — el código usa "motivo"`);
  } else {
    ok(`No existe columna "motivo_consulta" (el código usa "motivo", correcto)`);
  }

  // Verificar si "consultorio_id" se usa como FK pero no existe
  const { rows: turnosHasConsultorioId } = await query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'turnos' AND column_name = 'consultorio_id'`
  );
  if (turnosHasConsultorioId.length > 0) {
    warn(`"turnos.consultorio_id" existe en DB pero el código usa "turnos.consultorio" (texto) — posible mezcla de schemas`);
  }

  // Verificar si "obra_social_id" como FK existe
  const { rows: pacientesHasObraSocialId } = await query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'pacientes' AND column_name = 'obra_social_id'`
  );
  if (pacientesHasObraSocialId.length > 0) {
    warn(`"pacientes.obra_social_id" existe en DB pero el código usa "pacientes.obra_social" (texto)`);
  }

  // Verificar que las columnas usadas en el código existan realmente
  // turnos.js usa: consultorio (no consultorio_id), tipo_cobertura, estado
  const checkColsExist = async (table, cols) => {
    const { rows: existingCols } = await query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = $1`,
      [table]
    );
    const existingNames = new Set(existingCols.map((c) => c.column_name));
    for (const col of cols) {
      if (!existingNames.has(col)) {
        err(`Columna "${table}.${col}" es usada en queries SQL del servidor pero NO existe en la tabla`);
      }
    }
  };

  // Columnas clave usadas en queries
  await checkColsExist("turnos", ["consultorio", "tipo_cobertura", "estado", "fecha", "hora", "paciente_id"]);
  await checkColsExist("evaluaciones", ["tipo_test", "fecha_administracion", "resultados", "puntaje_obtenido"]);
  await checkColsExist("informes", ["fecha_vencimiento", "estado", "contenido"]);
  await checkColsExist("pagos", ["concepto", "tipo_pago", "estado", "nro_sesion_facturada"]);
  await checkColsExist("pacientes", ["obra_social", "nro_afiliado", "sexo", "domicilio", "contacto_emergencia", "entrevista", "motivo"]);
  await checkColsExist("sesiones", ["observaciones", "actividades_realizadas", "paciente_id", "fecha"]);
}

// ─── MAIN ───
async function main() {
  console.log(`\n${"█".repeat(60)}`);
  console.log(`  AUDITORÍA DE BASE DE DATOS — AGENDA PSICOPE`);
  console.log(`  Fecha: ${new Date().toISOString()}`);
  console.log(`${"█".repeat(60)}\n`);

  try {
    // Test conexión
    const { rows: connTest } = await query("SELECT NOW() AS ahora, version() AS version");
    console.log(`✅ Conexión exitosa a Supabase PostgreSQL`);
    console.log(`   Servidor: ${connTest[0].version.split(",")[0]}`);
    console.log(`   Hora DB: ${connTest[0].ahora}`);

    const existingTables = await checkTables();
    await checkColumns();
    await checkForeignKeys();
    await checkIndexes();
    await checkRowCounts(existingTables);
    await checkInconsistencies(existingTables);

    // ─── RESUMEN FINAL ───
    printHeader("RESUMEN FINAL");
    console.log(`   ✅ OK: ${report.ok.length}`);
    console.log(`   ⚠️  ADVERTENCIAS: ${report.warn.length}`);
    console.log(`   ❌ ERRORES: ${report.err.length}`);
    console.log(`\n${"─".repeat(60)}`);

    if (report.err.length > 0) {
      console.log("\n  🔴 CORRECIONES PRIORITARIAS:");
      report.err.forEach((e, i) => console.log(`    ${i + 1}. ❌ ${e}`));
    }

    if (report.warn.length > 0) {
      console.log("\n  🟡 ADVERTENCIAS A REVISAR:");
      report.warn.forEach((w, i) => console.log(`    ${i + 1}. ⚠️ ${w}`));
    }

    console.log(`\n${"█".repeat(60)}\n`);
  } catch (error) {
    console.error("\n❌ Error fatal durante la auditoría:", error);
  } finally {
    await pool.end();
  }
}

main();
