'use strict';

const elements = Object.fromEntries(
  [
    'globalStatus', 'setupPanel', 'setupForm', 'setupCode', 'setupPassword',
    'setupPasswordConfirm', 'loginPanel', 'loginForm', 'loginPassword', 'showRecoveryButton',
    'recoveryPanel', 'recoveryForm', 'recoveryCode', 'recoveryPassword',
    'recoveryPasswordConfirm', 'cancelRecoveryButton', 'adminPanel', 'logoutButton',
    'announcementForm', 'announcementEnabled', 'announcementType', 'announcementTitle',
    'announcementMessage', 'announcementStartEnabled', 'announcementStart',
    'announcementEndEnabled', 'announcementEnd', 'slotsFieldset',
    'morningFrom', 'morningTo', 'morningEnabled', 'afternoonFrom', 'afternoonTo',
    'afternoonEnabled', 'announcementPreview',
    'removeAnnouncementButton', 'presetForm', 'presetName', 'presetsList',
    'passwordForm', 'currentPassword', 'newPassword',
    'newPasswordConfirm', 'sessionsList', 'recoveryCodeDialog', 'newRecoveryCode',
  ].map((id) => [id, document.getElementById(id)]),
);

function cookie(name) {
  const prefix = `${name}=`;
  const part = document.cookie.split(';').map((value) => value.trim()).find((value) => value.startsWith(prefix));
  return part ? decodeURIComponent(part.slice(prefix.length)) : '';
}

function csrfToken() {
  return cookie('__Host-epicerie-csrf') || cookie('epicerie-csrf');
}

function setStatus(message = '', kind = '') {
  elements.globalStatus.textContent = message;
  elements.globalStatus.className = `status${kind ? ` ${kind}` : ''}`;
}

async function request(url, options = {}) {
  const headers = { Accept: 'application/json', ...(options.headers || {}) };
  if (options.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
  if (!['GET', 'HEAD'].includes(options.method || 'GET')) headers['X-CSRF-Token'] = csrfToken();
  const response = await fetch(url, { credentials: 'same-origin', ...options, headers });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.error || `Erreur HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return body;
}

function showLogin() {
	elements.setupPanel.hidden = true;
  elements.loginPanel.hidden = false;
  elements.recoveryPanel.hidden = true;
  elements.adminPanel.hidden = true;
  elements.logoutButton.hidden = true;
}

function showAdmin() {
	elements.setupPanel.hidden = true;
  elements.loginPanel.hidden = true;
  elements.recoveryPanel.hidden = true;
  elements.adminPanel.hidden = false;
  elements.logoutButton.hidden = false;
}

function showSetup() {
	elements.setupPanel.hidden = false;
	elements.loginPanel.hidden = true;
	elements.recoveryPanel.hidden = true;
	elements.adminPanel.hidden = true;
	elements.logoutButton.hidden = true;
}

function localDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return shifted.toISOString().slice(0, 16);
}

function isoDateTime(value) {
  return value ? new Date(value).toISOString() : null;
}

function slot(from, to, enabled) {
  return from || to ? { from, to, enabled } : null;
}

function formAnnouncement() {
  return {
    enabled: elements.announcementEnabled.checked,
    type: elements.announcementType.value,
    title: elements.announcementTitle.value,
    message: elements.announcementMessage.value,
    startAt: elements.announcementStartEnabled.checked
      ? isoDateTime(elements.announcementStart.value)
      : null,
    endAt: elements.announcementEndEnabled.checked
      ? isoDateTime(elements.announcementEnd.value)
      : null,
    closed: elements.announcementType.value === 'closed',
    slots: [
      slot(elements.morningFrom.value, elements.morningTo.value, elements.morningEnabled.checked),
      slot(elements.afternoonFrom.value, elements.afternoonTo.value, elements.afternoonEnabled.checked),
    ].filter(Boolean),
  };
}

function fillAnnouncement(announcement) {
  const value = announcement || {
    enabled: false,
    type: 'information',
    title: 'Information',
    message: '',
    slots: [
      { from: '08:30', to: '12:30' },
      { from: '15:30', to: '19:30' },
    ],
  };
  elements.announcementEnabled.checked = Boolean(value.enabled);
  elements.announcementType.value = value.type || 'information';
  elements.announcementTitle.value = value.title || '';
  elements.announcementMessage.value = value.message || '';
  elements.announcementStartEnabled.checked = Boolean(value.startAt);
  elements.announcementStart.value = localDateTime(value.startAt);
  elements.announcementEndEnabled.checked = Boolean(value.endAt);
  elements.announcementEnd.value = localDateTime(value.endAt);
  elements.morningFrom.value = value.slots?.[0]?.from || '';
  elements.morningTo.value = value.slots?.[0]?.to || '';
  elements.morningEnabled.checked = value.slots?.[0]?.enabled !== false;
  elements.afternoonFrom.value = value.slots?.[1]?.from || '';
  elements.afternoonTo.value = value.slots?.[1]?.to || '';
  elements.afternoonEnabled.checked = value.slots?.[1]?.enabled !== false;
  updatePreview();
}

function updatePreview() {
  elements.announcementStart.disabled = !elements.announcementStartEnabled.checked;
  elements.announcementEnd.disabled = !elements.announcementEndEnabled.checked;
  const value = formAnnouncement();
  elements.slotsFieldset.hidden = value.type === 'closed';
  const slots = value.type === 'closed'
    ? 'FERMÉ'
    : value.slots
      .filter((item) => item.enabled !== false)
      .map((item) => `${item.from || '…'} – ${item.to || '…'}`)
      .join(' · ');
  elements.announcementPreview.innerHTML = '';
  const title = document.createElement('strong');
  title.textContent = value.title || 'Titre de l’annonce';
  const message = document.createElement('span');
  message.textContent = value.message || 'Votre indication apparaîtra ici.';
  elements.announcementPreview.append(title, message);
  if (slots) {
    const schedule = document.createElement('span');
    schedule.className = 'preview-slots';
    schedule.textContent = slots;
    elements.announcementPreview.append(schedule);
  }
}

function dateLabel(value) {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

async function loadSessions() {
  const data = await request('/admin/sessions');
  elements.sessionsList.innerHTML = '';
  for (const session of data.sessions) {
    const row = document.createElement('div');
    row.className = 'session';
    const description = document.createElement('p');
    description.textContent = `${session.current ? 'Cet appareil · ' : ''}${session.userAgent || 'Appareil inconnu'}`;
    const details = document.createElement('small');
    details.textContent = `Dernière activité : ${dateLabel(session.lastSeenAt)} · expiration : ${dateLabel(session.expiresAt)}`;
    const button = document.createElement('button');
    button.className = 'danger';
    button.type = 'button';
    button.textContent = session.current ? 'Déconnecter' : 'Révoquer';
    button.addEventListener('click', async () => {
      if (!confirm('Supprimer cette connexion ?')) return;
      await request(`/admin/sessions/${encodeURIComponent(session.id)}`, { method: 'DELETE' });
      if (session.current) showLogin();
      else await loadSessions();
    });
    row.append(description, details, button);
    elements.sessionsList.append(row);
  }
}

const presetTypeLabels = {
  information: 'Information',
  holiday: 'Jour férié',
  special_hours: 'Horaires exceptionnels',
  closed: 'Fermeture',
};

async function loadPresets() {
  const data = await request('/admin/presets');
  elements.presetsList.replaceChildren();
  for (const preset of data.presets) {
    const row = document.createElement('div');
    row.className = 'preset';
    const description = document.createElement('p');
    const name = document.createElement('strong');
    name.textContent = preset.name;
    const type = document.createElement('small');
    type.textContent = presetTypeLabels[preset.payload.type] || 'Modèle';
    description.append(name, type);
    const loadButton = document.createElement('button');
    loadButton.type = 'button';
    loadButton.textContent = 'Reprendre';
    loadButton.addEventListener('click', () => {
      fillAnnouncement({ ...preset.payload, enabled: false });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setStatus(`Le modèle « ${preset.name} » est chargé. Vérifiez les dates puis publiez.`, 'success');
    });
    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'danger';
    deleteButton.textContent = 'Supprimer';
    deleteButton.addEventListener('click', async () => {
      if (!confirm(`Supprimer le modèle « ${preset.name} » ?`)) return;
      await request(`/admin/presets/${encodeURIComponent(preset.id)}`, { method: 'DELETE' });
      await loadPresets();
    });
    row.append(description, loadButton, deleteButton);
    elements.presetsList.append(row);
  }
  if (!data.presets.length) elements.presetsList.textContent = 'Aucun modèle enregistré.';
}

async function loadAdmin() {
  try {
    const state = await request('/admin/state');
    showAdmin();
    fillAnnouncement(state.announcement);
    await Promise.all([loadSessions(), loadPresets()]);
  } catch (error) {
    if (error.status === 401) showLogin();
    else setStatus(error.message, 'error');
  }
}

elements.loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  setStatus('Connexion…');
  try {
    await request('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ password: elements.loginPassword.value }),
    });
    elements.loginForm.reset();
    setStatus('Connexion réussie.', 'success');
    await loadAdmin();
  } catch (error) {
    setStatus(error.message, 'error');
  }
});

elements.setupForm.addEventListener('submit', async (event) => {
	event.preventDefault();
	if (elements.setupPassword.value !== elements.setupPasswordConfirm.value) {
		setStatus('Les deux mots de passe sont différents.', 'error');
		return;
	}
	try {
		const data = await request('/admin/setup', {
			method: 'POST',
			body: JSON.stringify({
				setupCode: elements.setupCode.value.trim(),
				password: elements.setupPassword.value,
			}),
		});
		elements.setupForm.reset();
		elements.newRecoveryCode.textContent = data.recoveryCode;
		elements.recoveryCodeDialog.showModal();
		setStatus('Accès administrateur créé.', 'success');
		await loadAdmin();
	} catch (error) {
		setStatus(error.message, 'error');
	}
});

elements.showRecoveryButton.addEventListener('click', () => {
  elements.loginPanel.hidden = true;
  elements.recoveryPanel.hidden = false;
  setStatus();
});

elements.cancelRecoveryButton.addEventListener('click', showLogin);

elements.recoveryForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (elements.recoveryPassword.value !== elements.recoveryPasswordConfirm.value) {
    setStatus('Les deux mots de passe sont différents.', 'error');
    return;
  }
  try {
    const data = await request('/admin/recover', {
      method: 'POST',
      body: JSON.stringify({
        recoveryCode: elements.recoveryCode.value,
        password: elements.recoveryPassword.value,
      }),
    });
    elements.recoveryForm.reset();
    elements.newRecoveryCode.textContent = data.recoveryCode;
    elements.recoveryCodeDialog.showModal();
    setStatus('Mot de passe réinitialisé.', 'success');
    await loadAdmin();
  } catch (error) {
    setStatus(error.message, 'error');
  }
});

elements.announcementForm.addEventListener('input', updatePreview);
elements.announcementForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  setStatus('Publication…');
  try {
    const data = await request('/admin/announcement', {
      method: 'PUT',
      body: JSON.stringify(formAnnouncement()),
    });
    fillAnnouncement(data.announcement);
    setStatus(
      data.announcement.enabled
        ? 'L’annonce est enregistrée et publiée sur le site.'
        : 'L’annonce est enregistrée mais non publiée. Activez la case « Publier » pour l’afficher.',
      data.announcement.enabled ? 'success' : 'error',
    );
  } catch (error) {
    setStatus(error.message, 'error');
  }
});

elements.removeAnnouncementButton.addEventListener('click', async () => {
  if (!confirm('Retirer complètement l’annonce du site ?')) return;
  try {
    await request('/admin/announcement', { method: 'DELETE' });
    fillAnnouncement(null);
    setStatus('L’annonce a été retirée.', 'success');
  } catch (error) {
    setStatus(error.message, 'error');
  }
});

elements.presetForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    await request('/admin/presets', {
      method: 'POST',
      body: JSON.stringify({ name: elements.presetName.value, announcement: formAnnouncement() }),
    });
    elements.presetForm.reset();
    await loadPresets();
    setStatus('Le modèle a été mémorisé.', 'success');
  } catch (error) {
    setStatus(error.message, 'error');
  }
});

elements.passwordForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (elements.newPassword.value !== elements.newPasswordConfirm.value) {
    setStatus('Les deux nouveaux mots de passe sont différents.', 'error');
    return;
  }
  try {
    const data = await request('/admin/password', {
      method: 'POST',
      body: JSON.stringify({
        currentPassword: elements.currentPassword.value,
        newPassword: elements.newPassword.value,
      }),
    });
    elements.passwordForm.reset();
    elements.newRecoveryCode.textContent = data.recoveryCode;
    elements.recoveryCodeDialog.showModal();
    setStatus('Mot de passe modifié. Les autres appareils ont été déconnectés.', 'success');
    await loadSessions();
  } catch (error) {
    setStatus(error.message, 'error');
  }
});

elements.logoutButton.addEventListener('click', async () => {
  try {
    await request('/admin/logout', { method: 'POST' });
  } finally {
    showLogin();
    setStatus('Vous êtes déconnecté.', 'success');
  }
});

async function initialize() {
	try {
		const health = await request('/health');
		if (!health.configured) {
			showSetup();
			return;
		}
		await loadAdmin();
	} catch (error) {
		setStatus(error.message, 'error');
		showLogin();
	}
}

initialize();
