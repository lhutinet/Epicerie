"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
	periodLabel,
	shouldReplaceHours,
} = require("../../script/site-announcement.js");

test("les horaires habituels restent visibles avec toute annonce", () => {
	assert.equal(shouldReplaceHours({ closed: true, slots: [] }), false);
	assert.equal(
		shouldReplaceHours({
			type: "special_hours",
			closed: false,
			slots: [{ from: "08:30", to: "12:30" }],
		}),
		false,
	);
	assert.equal(
		shouldReplaceHours({
			type: "information",
			closed: false,
			slots: [{ from: "08:30", to: "12:30" }],
		}),
		false,
	);
	assert.equal(
		shouldReplaceHours({
			type: "special_hours",
			closed: false,
			slots: [{ from: "08:30", to: "12:30", enabled: false }],
		}),
		false,
	);
	assert.equal(shouldReplaceHours({ closed: false, slots: [] }), false);
});

test("la période d'une même journée reste concise", () => {
	const label = periodLabel({
		startAt: "2026-12-24T00:00:00+01:00",
		endAt: "2026-12-24T23:59:59+01:00",
	});
	assert.match(label, /^Le /);
	assert.match(label, /24 décembre 2026/);
});
