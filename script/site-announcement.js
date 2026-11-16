(function (globalScope) {
	"use strict";

	const DEFAULT_API_URL = "https://horaires.digitalh.fr/announcement";

	function shouldReplaceHours(announcement) {
		return false;
	}

	function periodLabel(announcement, locale = "fr-FR") {
		if (!announcement?.startAt && !announcement?.endAt) return "";
		const formatter = new Intl.DateTimeFormat(locale, { dateStyle: "long" });
		const start = announcement.startAt
			? formatter.format(new Date(announcement.startAt))
			: "maintenant";
		const end = announcement.endAt
			? formatter.format(new Date(announcement.endAt))
			: "nouvel ordre";
		if (announcement.startAt && announcement.endAt) {
			const startDate = new Date(announcement.startAt);
			const endDate = new Date(announcement.endAt);
			if (startDate.toDateString() === endDate.toDateString()) return `Le ${start}`;
		}
		return `Du ${start} au ${end}`;
	}

	function renderAnnouncement(announcement, documentRef = document) {
		const panel = documentRef.getElementById("siteAnnouncement");
		const normalHours = documentRef.getElementById("horaireNormal");
		if (!panel || !normalHours) return;
		if (!announcement) {
			panel.hidden = true;
			normalHours.hidden = false;
			return;
		}

		documentRef.getElementById("siteAnnouncementTitle").textContent =
			announcement.title || "Information";
		documentRef.getElementById("siteAnnouncementMessage").textContent =
			announcement.message || "";
		documentRef.getElementById("siteAnnouncementPeriod").textContent =
			periodLabel(announcement);

		const slotsHost = documentRef.getElementById("siteAnnouncementSlots");
		slotsHost.replaceChildren();
		if (announcement.closed) {
			const closed = documentRef.createElement("p");
			closed.className = "horaireVert";
			closed.textContent = "FERMÉ";
			slotsHost.append(closed);
		} else {
			for (const slot of (announcement.slots || []).filter((item) => item.enabled !== false)) {
				const line = documentRef.createElement("p");
				line.className = "horaireVert";
				line.textContent = `${slot.from} – ${slot.to}`;
				slotsHost.append(line);
			}
		}

		normalHours.hidden = shouldReplaceHours(announcement);
		panel.hidden = false;
	}

	async function loadAnnouncement(documentRef = document, fetchRef = fetch) {
		const url = String(globalScope.EPICERIE_ANNOUNCEMENT_API_URL || DEFAULT_API_URL);
		try {
			const response = await fetchRef(url, { cache: "no-store" });
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			const data = await response.json();
			renderAnnouncement(data?.announcement || null, documentRef);
		} catch (error) {
			console.warn("Annonce du magasin indisponible :", error);
			renderAnnouncement(null, documentRef);
		}
	}

	if (typeof module !== "undefined" && module.exports) {
		module.exports = { periodLabel, shouldReplaceHours };
	}
	if (typeof document !== "undefined") loadAnnouncement();
})(typeof window !== "undefined" ? window : globalThis);
