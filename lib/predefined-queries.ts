export interface PredefinedQuery {
  id: string;
  name: string;
  shortName: string;
  description: string;
  sql: string;
  category: "Monitoring" | "Reporting" | "Operations";
}

export const PREDEFINED_QUERIES: PredefinedQuery[] = [
  // ── Monitoring ──────────────────────────────────────────────────────
  {
    id: "MON-001",
    name: "MON-001 Last 100 anot transfers",
    shortName: "Last 100 transfers",
    description: "Liste des 100 derniers transferts (table anot) avec BU, numéro de transfert, date et faisceau.",
    category: "Monitoring",
    sql: `SELECT\n  bu,\n  trsfno,\n  datcre,\n  harnes,\n  issue\nFROM anot\nORDER BY datcre DESC, trsfno DESC\nLIMIT 100`,
  },
  {
    id: "MON-002",
    name: "MON-002 Transfers by business unit",
    shortName: "Transfers by BU",
    description: "Volume de transferts par Business Unit (anot).",
    category: "Monitoring",
    sql: `SELECT\n  bu,\n  COUNT(*) AS transfer_count\nFROM anot\nGROUP BY bu\nORDER BY transfer_count DESC`,
  },
  {
    id: "MON-003",
    name: "MON-003 Top 20 components by quantity",
    shortName: "Top 20 components",
    description: "Top 20 des composants les plus utilisés dans les transferts.",
    category: "Monitoring",
    sql: `SELECT\n  comppn,\n  SUM(comqty) AS total_quantity\nFROM anot\nGROUP BY comppn\nORDER BY total_quantity DESC\nLIMIT 20`,
  },
  {
    id: "MON-004",
    name: "MON-004 Assembly time per BU",
    shortName: "Assembly time / BU",
    description: "Temps de montage cumulé par Business Unit (anot.timass).",
    category: "Monitoring",
    sql: `SELECT\n  bu,\n  SUM(timass) AS total_assembly_time\nFROM anot\nGROUP BY bu\nORDER BY total_assembly_time DESC`,
  },
  {
    id: "MON-005",
    name: "MON-005 Transfers by error type",
    shortName: "Transfers by error",
    description: "Répartition des transferts par type d'erreur (anot.typano).",
    category: "Monitoring",
    sql: `SELECT\n  typano,\n  COUNT(*) AS transfer_count\nFROM anot\nGROUP BY typano\nORDER BY transfer_count DESC`,
  },
  {
    id: "MON-006",
    name: "MON-006 Latest anot activity by user",
    shortName: "Activity by user",
    description: "Dernière date de création de transfert par utilisateur (anot.userw).",
    category: "Monitoring",
    sql: `SELECT\n  userw,\n  MAX(datcre) AS last_creation_date,\n  COUNT(*) AS transfer_count\nFROM anot\nGROUP BY userw\nORDER BY last_creation_date DESC\nLIMIT 50`,
  },
  {
    id: "MON-007",
    name: "MON-007 Daily transfer volume (last 30 days)",
    shortName: "Daily volume",
    description: "Volume quotidien de transferts (anot.datcre, agrégé par date).",
    category: "Monitoring",
    sql: `SELECT\n  datcre AS creation_date,\n  COUNT(*) AS transfer_count\nFROM anot\nGROUP BY datcre\nORDER BY datcre DESC\nLIMIT 30`,
  },
  {
    id: "MON-008",
    name: "MON-008 Components with calculated qty",
    shortName: "Qty discrepancies",
    description: "Composants où les quantités calculées diffèrent de la quantité réelle.",
    category: "Monitoring",
    sql: `SELECT\n  comppn,\n  SUM(comqty) AS total_quantity,\n  SUM(comqtc) AS total_calc_quantity\nFROM anot\nWHERE comqtc IS NOT NULL\nGROUP BY comppn\nHAVING SUM(comqty) <> SUM(comqtc)\nORDER BY ABS(SUM(comqty) - SUM(comqtc)) DESC\nLIMIT 50`,
  },
  {
    id: "MON-009",
    name: "MON-009 Transfers by cost center",
    shortName: "By cost center",
    description: "Répartition des transferts par centre de coût composant (anot.coscen).",
    category: "Monitoring",
    sql: `SELECT\n  coscen,\n  COUNT(*) AS transfer_count\nFROM anot\nGROUP BY coscen\nORDER BY transfer_count DESC\nLIMIT 50`,
  },
  {
    id: "MON-010",
    name: "MON-010 Harness activity summary",
    shortName: "Harness summary",
    description: "Synthèse par faisceau (harnes) : nombre de transferts et temps de montage total.",
    category: "Monitoring",
    sql: `SELECT\n  harnes,\n  COUNT(*) AS transfer_count,\n  SUM(timass) AS total_assembly_time\nFROM anot\nGROUP BY harnes\nORDER BY transfer_count DESC\nLIMIT 50`,
  },

  // ── Reporting ───────────────────────────────────────────────────────
  {
    id: "REP-001",
    name: "REP-001 Operations by plant and route",
    shortName: "Ops by plant/route",
    description: "Nombre d'opérations par usine (plwerk) et route de production (ferweg) dans apag.",
    category: "Reporting",
    sql: `SELECT\n  plwerk AS plant,\n  ferweg AS route,\n  COUNT(*) AS operation_count\nFROM apag\nGROUP BY plwerk, ferweg\nORDER BY plant, route`,
  },
  {
    id: "REP-002",
    name: "REP-002 Operations per part number",
    shortName: "Ops per part",
    description: "Nombre d'opérations par référence (teilnr) dans apag.",
    category: "Reporting",
    sql: `SELECT\n  teilnr AS part_number,\n  COUNT(*) AS operation_count\nFROM apag\nGROUP BY teilnr\nORDER BY operation_count DESC\nLIMIT 50`,
  },
  {
    id: "REP-003",
    name: "REP-003 Recently modified operations",
    shortName: "Recent modifications",
    description: "Liste des opérations modifiées récemment (apag.aendat / aenuhr).",
    category: "Reporting",
    sql: `SELECT\n  firmnr,\n  plwerk,\n  teilnr,\n  ferweg,\n  arbgnr,\n  aendat,\n  aenuhr,\n  aenben\nFROM apag\nORDER BY aendat DESC, aenuhr DESC\nLIMIT 200`,
  },
  {
    id: "REP-004",
    name: "REP-004 Operations with long text flag",
    shortName: "Long text ops",
    description: "Opérations ayant une désignation détaillée (apag.langtx activé).",
    category: "Reporting",
    sql: `SELECT\n  teilnr AS part_number,\n  ferweg AS route,\n  arbgnr AS operation,\n  langtx\nFROM apag\nWHERE langtx <> 0\nORDER BY teilnr, ferweg, arbgnr\nLIMIT 200`,
  },
  {
    id: "REP-005",
    name: "REP-005 Operations per company",
    shortName: "Ops per company",
    description: "Volume d'opérations par client / company number (apag.firmnr).",
    category: "Reporting",
    sql: `SELECT\n  firmnr,\n  COUNT(*) AS operation_count\nFROM apag\nGROUP BY firmnr\nORDER BY operation_count DESC`,
  },
  {
    id: "REP-006",
    name: "REP-006 Routes with multiple alternatives",
    shortName: "Multi-route parts",
    description: "Routes de production ayant plusieurs alternatives d'opérations (apag.arbgal).",
    category: "Reporting",
    sql: `SELECT\n  teilnr AS part_number,\n  ferweg AS route,\n  COUNT(DISTINCT arbgal) AS alternative_count\nFROM apag\nGROUP BY teilnr, ferweg\nHAVING COUNT(DISTINCT arbgal) > 1\nORDER BY alternative_count DESC\nLIMIT 50`,
  },
  {
    id: "REP-007",
    name: "REP-007 Sequence inconsistencies",
    shortName: "Sequence issues",
    description: "Recherche de séquences d'opérations potentiellement incohérentes.",
    category: "Reporting",
    sql: `SELECT\n  teilnr AS part_number,\n  ferweg AS route,\n  arbgnr AS operation,\n  sequnr,\n  reihnr\nFROM apag\nWHERE sequnr <> reihnr\nORDER BY teilnr, ferweg, arbgnr\nLIMIT 200`,
  },
  {
    id: "REP-008",
    name: "REP-008 Operations without modification user",
    shortName: "No modifier user",
    description: "Opérations modifiées sans utilisateur renseigné (apag.aenben NULL).",
    category: "Reporting",
    sql: `SELECT\n  firmnr,\n  plwerk,\n  teilnr,\n  ferweg,\n  arbgnr,\n  aendat,\n  aenuhr\nFROM apag\nWHERE aenben IS NULL OR aenben = ''\nORDER BY aendat DESC, aenuhr DESC\nLIMIT 200`,
  },
  {
    id: "REP-009",
    name: "REP-009 Operations per text code",
    shortName: "By text code",
    description: "Répartition des opérations par code texte (apag.avtxsl).",
    category: "Reporting",
    sql: `SELECT\n  avtxsl AS text_code,\n  COUNT(*) AS operation_count\nFROM apag\nGROUP BY avtxsl\nORDER BY operation_count DESC\nLIMIT 50`,
  },
  {
    id: "REP-010",
    name: "REP-010 Operations without text code",
    shortName: "Missing text code",
    description: "Liste des opérations sans code texte (apag.avtxsl vide).",
    category: "Reporting",
    sql: `SELECT\n  firmnr,\n  plwerk,\n  teilnr,\n  ferweg,\n  arbgnr\nFROM apag\nWHERE avtxsl IS NULL OR avtxsl = ''\nORDER BY firmnr, plwerk, teilnr, ferweg, arbgnr\nLIMIT 200`,
  },

  // ── Operations ──────────────────────────────────────────────────────
  {
    id: "OPS-001",
    name: "OPS-001 Route sheet summary by part",
    shortName: "Route sheet summary",
    description: "Nombre total d'opérations par référence pour le pilotage des gammes.",
    category: "Operations",
    sql: `SELECT\n  teilnr AS part_number,\n  COUNT(*) AS operation_count,\n  MIN(aendat) AS first_change_date,\n  MAX(aendat) AS last_change_date\nFROM apag\nGROUP BY teilnr\nORDER BY operation_count DESC\nLIMIT 100`,
  },
  {
    id: "OPS-002",
    name: "OPS-002 Operations by plant",
    shortName: "Ops by plant",
    description: "Répartition des opérations par usine (plwerk) et client (firmnr).",
    category: "Operations",
    sql: `SELECT\n  firmnr,\n  plwerk AS plant,\n  COUNT(*) AS operation_count\nFROM apag\nGROUP BY firmnr, plwerk\nORDER BY operation_count DESC`,
  },
  {
    id: "OPS-003",
    name: "OPS-003 Detailed route operations",
    shortName: "Detailed routes",
    description: "Détail des opérations par route de fabrication pour une analyse de gamme.",
    category: "Operations",
    sql: `SELECT\n  teilnr AS part_number,\n  ferweg AS route,\n  arbgnr AS operation,\n  arbgal AS alt_operation,\n  sequnr,\n  reihnr,\n  aendat,\n  aenuhr\nFROM apag\nORDER BY teilnr, ferweg, sequnr\nLIMIT 500`,
  },
  {
    id: "OPS-004",
    name: "OPS-004 Operations with recent changes",
    shortName: "Recent changes",
    description: "Opérations modifiées dernièrement, pour le suivi des changements de gamme.",
    category: "Operations",
    sql: `SELECT\n  teilnr AS part_number,\n  ferweg AS route,\n  arbgnr AS operation,\n  aendat,\n  aenuhr,\n  aenben\nFROM apag\nORDER BY aendat DESC, aenuhr DESC\nLIMIT 300`,
  },
  {
    id: "OPS-005",
    name: "OPS-005 Parts with multiple routes",
    shortName: "Multi-route parts",
    description: "Références ayant plusieurs routes de production (ferweg distincts).",
    category: "Operations",
    sql: `SELECT\n  teilnr AS part_number,\n  COUNT(DISTINCT ferweg) AS route_count\nFROM apag\nGROUP BY teilnr\nHAVING COUNT(DISTINCT ferweg) > 1\nORDER BY route_count DESC\nLIMIT 50`,
  },
];

export const QUERY_CATEGORIES = ["All", "Monitoring", "Reporting", "Operations"] as const;
export type QueryCategory = typeof QUERY_CATEGORIES[number];
