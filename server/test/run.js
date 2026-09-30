import assert from "node:assert/strict";
import { hasRole } from "../src/middleware/auth.js";
import { applySafetyRules } from "../src/modules/triage/service.js";
const tests = [];
function test(name, fn) {
  tests.push([name, fn]);
}
test("role guard grants only explicitly listed roles", () => {
  assert.equal(hasRole({ role: "ADMIN" }, ["ADMIN"]), true);
  assert.equal(hasRole({ role: "PATIENT" }, ["DOCTOR", "ADMIN"]), false);
  assert.equal(hasRole(null, ["ADMIN"]), false);
});
test("low confidence triage routes to manual General Medicine selection", () => {
  const r = applySafetyRules(
    {
      department: "Neurology",
      specialist: "Neurologist",
      urgency: "LOW",
      confidence: 0.31,
      reasoning: "Unclear",
    },
    "headache",
  );
  assert.equal(r.department, "General Medicine");
  assert.equal(r.specialist, "General Practitioner");
});
test("potential emergency phrases cannot be downgraded by model suggestions", () => {
  const r = applySafetyRules(
    {
      department: "General Medicine",
      specialist: "GP",
      urgency: "LOW",
      confidence: 0.9,
      reasoning: "Fine",
    },
    "chest pain and shortness of breath",
  );
  assert.equal(r.urgency, "EMERGENCY");
});
test("malformed model output uses the safe fallback", () => {
  const r = applySafetyRules(
    { department: "anything", specialist: "anything", urgency: "DIAGNOSE", confidence: 12 },
    "unclear symptoms",
  );
  assert.equal(r.urgency, "MEDIUM");
  assert.equal(r.confidence, 0.25);
});
let failures = 0;
for (const [name, fn] of tests) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (e) {
    failures++;
    console.error(`FAIL ${name}`, e);
  }
}
console.log(`${tests.length - failures}/${tests.length} checks passed`);
if (failures) process.exitCode = 1;
