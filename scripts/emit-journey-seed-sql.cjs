/**
 * Prints UPDATE statements for public.quests journey columns.
 * Run: node scripts/emit-journey-seed-sql.cjs
 */
const data = require('./quest-journeys-data.cjs');

function sqlString(s) {
  return "'" + String(s).replace(/'/g, "''") + "'";
}

for (const [id, row] of Object.entries(data)) {
  const intro =
    row.journeyIntro == null || row.journeyIntro === ''
      ? 'null'
      : sqlString(row.journeyIntro);
  const json = JSON.stringify(row.actionSteps);
  console.log(
    `update public.quests set journey_intro = ${intro}, action_steps = $json$${json}$json$::jsonb where id = '${id}';`
  );
}
