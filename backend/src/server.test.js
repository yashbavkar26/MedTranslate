import assert from "node:assert/strict";

import {
  normalizeHomeRemedies,
  normalizeUrgency,
  parseOllamaResponse
} from "./server.js";

assert.deepEqual(
  parseOllamaResponse({ response: "{\"urgency\":\"urgent\"}" }),
  { urgency: "urgent" }
);

assert.deepEqual(parseOllamaResponse({}), {});
assert.deepEqual(parseOllamaResponse({ response: "{" }), {});

assert.equal(normalizeUrgency("self-care"), "self_care");
assert.equal(normalizeUrgency("self_care"), "self_care");
assert.equal(normalizeUrgency("unclear"), "soon");

const remedies = {
  homeRemedies: [
    { remedy: "Fluids", instruction: "Sip water" },
    { remedy: "Rest", instruction: "Sleep" },
    "Use a cool cloth",
    "Another item"
  ]
};

assert.deepEqual(normalizeHomeRemedies(remedies, "urgent"), []);
assert.deepEqual(normalizeHomeRemedies(remedies, "soon"), []);
assert.deepEqual(normalizeHomeRemedies(remedies, "self_care"), [
  "Fluids: Sip water",
  "Rest: Sleep",
  "Use a cool cloth"
]);
