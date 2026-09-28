/* UI adapter for the original Jade panels. Server routes own validation and policy. */
const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
let activeInlineEditor;

function stopInlineEdit(restore = true) {
  if (!activeInlineEditor) return;
  const { control, original } = activeInlineEditor;
  if (restore) control.textContent = original;
  control.removeAttribute('contenteditable');
  control.removeAttribute('aria-keyshortcuts');
  activeInlineEditor = undefined;
}

function startInlineEdit(control) {
  if (activeInlineEditor?.control === control) return;
  stopInlineEdit();
  const container = document.getElementById(control.dataset.inlineForm);
  const field = container?.querySelector(`[name="${control.dataset.inlineField}"]`);
  if (!field) return;
  activeInlineEditor = { control, original: control.textContent, field, form: field.form };
  control.textContent = field.value;
  control.setAttribute('contenteditable', 'true');
  control.setAttribute('aria-keyshortcuts', 'Enter Escape');
  control.focus();
  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(control);
  selection.removeAllRanges();
  selection.addRange(range);
}

async function saveInlineEdit() {
  if (!activeInlineEditor) return;
  const { control, field, form, original } = activeInlineEditor;
  const previous = field.value;
  const value = control.textContent.trim();
  if (value === previous) return stopInlineEdit();
  field.value = value;
  if (!form.checkValidity()) {
    field.value = previous;
    window.alert(field.validationMessage || 'Revisá el valor antes de guardar.');
    control.focus();
    return;
  }
  control.setAttribute('aria-busy', 'true');
  try {
    const response = await fetch(form.action, {
      method: 'POST',
      credentials: 'same-origin',
      redirect: 'manual',
      body: new URLSearchParams(new FormData(form))
    });
    if (!response.ok && response.status !== 303 && response.type !== 'opaqueredirect') {
      throw new Error(`No se pudo guardar (HTTP ${response.status}).`);
    }
    // Refresh derived labels and related cards using the server's canonical values.
    window.location.assign(location.pathname);
  } catch (error) {
    field.value = previous;
    control.textContent = original;
    window.alert(error.message);
    stopInlineEdit();
  } finally {
    control.removeAttribute('aria-busy');
  }
}

function openDialog(id) {
  const dialog = document.getElementById(id);
  if (dialog instanceof HTMLDialogElement) dialog.showModal();
}

async function submitHomeNameChange(field, change) {
  const identityId = document.querySelector('.main[data-identity-id]')?.dataset.identityId;
  if (!identityId || !csrfToken) throw new Error('No se pudo identificar la sesión de la demo.');
  const response = await fetch(`/identities/${identityId}/metadata/${field}/items`, {
    method: 'POST',
    credentials: 'same-origin',
    redirect: 'manual',
    body: new URLSearchParams({ csrfToken, ...change })
  });
  if (!response.ok && response.status !== 303 && response.type !== 'opaqueredirect') {
    throw new Error(`No se pudo guardar (HTTP ${response.status}).`);
  }
  window.location.assign('/');
}

function startHomeNameAppend(panel, field) {
  stopInlineEdit();
  const array = panel.querySelector(`.array[data-target="${field}"]`);
  if (!array) return;
  const editor = document.createElement('span');
  editor.className = 'verb';
  editor.setAttribute('contenteditable', 'true');
  editor.setAttribute('role', 'textbox');
  editor.setAttribute('aria-label', `Agregar ${field}`);
  array.append(editor);
  editor.focus();

  let saving = false;
  editor.addEventListener('keydown', async event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      editor.remove();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const value = editor.textContent.trim();
      if (!value || saving) return;
      saving = true;
      try { await submitHomeNameChange(field, { operation: 'append', value }); }
      catch (error) { window.alert(error.message); saving = false; editor.focus(); }
    }
  });
  editor.addEventListener('blur', () => { if (!saving) editor.remove(); });
}

function startHomeNameItemEdit(control, field) {
  stopInlineEdit();
  const index = control.closest('.item')?.dataset.target;
  if (index === undefined) return;
  const original = control.textContent;
  control.setAttribute('contenteditable', 'true');
  control.setAttribute('role', 'textbox');
  control.setAttribute('aria-label', `Editar ${field}`);
  control.focus();
  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(control);
  selection.removeAllRanges();
  selection.addRange(range);

  let saving = false;
  const controller = new AbortController();
  const cancel = () => {
    controller.abort();
    control.textContent = original;
    control.removeAttribute('contenteditable');
    control.removeAttribute('role');
    control.removeAttribute('aria-label');
  };
  control.addEventListener('keydown', async event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      cancel();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const value = control.textContent.trim();
      if (!value || saving) return;
      if (value === original) return cancel();
      saving = true;
      try { await submitHomeNameChange(field, { operation: 'replace', index, value }); }
      catch (error) { window.alert(error.message); saving = false; control.focus(); }
    }
  }, { signal: controller.signal });
  control.addEventListener('blur', () => { if (!saving) cancel(); }, { signal: controller.signal });
}

function legacyDestination(control) {
  const kind = control.closest('.credentials > .box')?.querySelector('.typeName')?.textContent;
  const verb = control.dataset.verb;
  const metadataPanel = control.closest('.main > .box');
  const field = (control.dataset.target || control.closest('.array')?.dataset.target)?.split('.').pop();

  if (metadataPanel && ['names', 'lastNames'].includes(field) && verb === 'append') {
    startHomeNameAppend(metadataPanel, field);
    return;
  }

  if (metadataPanel && ['names', 'lastNames'].includes(field) && verb === 'delete') {
    const index = control.closest('.item')?.dataset.target;
    if (index === undefined || !window.confirm(`¿Quitar este valor de ${field}?`)) return;
    void submitHomeNameChange(field, { operation: 'delete', index })
      .catch(error => window.alert(error.message));
    return;
  }

  if (metadataPanel && ['names', 'lastNames'].includes(field) && verb === 'edit') {
    startHomeNameItemEdit(control, field);
    return;
  }

  if (metadataPanel && ['nickName', 'names', 'lastNames', 'email'].includes(field)) {
    const editor = verb === 'edit' ? control : metadataPanel.querySelector(
      `.array[data-target="${field}"] .verb[data-verb="edit"], .array[data-target="${field}"] .voidItem`
    );
    if (!editor || !document.getElementById('home-profile-form')) return;
    editor.dataset.inlineField = field;
    editor.dataset.inlineForm = 'home-profile-form';
    editor.tabIndex = 0;
    editor.setAttribute('role', 'button');
    editor.setAttribute('aria-label', `Editar ${field}`);
    startInlineEdit(editor);
    return;
  }

  if (verb === 'create' && kind && kind !== 'ldapcredentials') {
    openDialog(`home-add-${kind}`);
    return;
  }

  if (control.closest('.credentialEntry, article.box')) {
    window.alert('La credencial de acceso de la demo está protegida. Administrá otras credenciales desde Identities.');
    return;
  }

  window.alert('Esta acción histórica aún no tiene un caso de uso seguro en la demo.');
}

const requestedDialog = new URLSearchParams(location.search).get('open');
if (requestedDialog && /^((profile|add-(simple|token|ssh)credentials)-[a-f0-9]{24}|create-identity|create-role)$/i.test(requestedDialog)) {
  openDialog(requestedDialog);
}

const requestedInline = new URLSearchParams(location.search).get('inline');
if (/^[a-f0-9]{24}:(nickName|names|lastNames|email)$/.test(requestedInline || '')) {
  const [identityId, field] = requestedInline.split(':');
  const control = document.querySelector(`[data-inline-form="profile-${identityId}"][data-inline-field="${field}"]`);
  if (control) {
    control.scrollIntoView({ block: 'center' });
    startInlineEdit(control);
  }
}

document.addEventListener('click', async event => {
  const control = event.target.closest('button, .verb');
  if (!control) return;

  if (control.dataset.inlineField) {
    startInlineEdit(control);
    return;
  }

  if (control.dataset.open) {
    openDialog(control.dataset.open);
    return;
  }

  if (control.dataset.close !== undefined) {
    control.closest('dialog')?.close();
    return;
  }

  if (control.dataset.delete) {
    if (!window.confirm('¿Eliminar este elemento de prueba?')) return;
    try {
      const response = await fetch(control.dataset.delete, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ csrfToken })
      });
      if (!response.ok) throw new Error(`No se pudo eliminar (HTTP ${response.status}).`);
      window.location.reload();
    } catch (error) {
      window.alert(error.message);
    }
    return;
  }

  // The historical generic API is intentionally retired. Its home shortcuts
  // lead to the same objects in the managed view instead of calling /lapi.
  if (control.dataset.verb && location.pathname === '/') {
    event.preventDefault();
    legacyDestination(control);
  }
});

document.addEventListener('keydown', event => {
  const control = event.target.closest('[data-inline-field]');
  if (!control) return;
  if (event.key === 'Enter') {
    event.preventDefault();
    if (activeInlineEditor?.control === control) void saveInlineEdit();
    else startInlineEdit(control);
  } else if (event.key === 'Escape' && activeInlineEditor?.control === control) {
    event.preventDefault();
    stopInlineEdit();
    control.blur();
  }
});

document.addEventListener('focusout', event => {
  if (activeInlineEditor?.control === event.target && !event.target.hasAttribute('aria-busy')) {
    stopInlineEdit();
  }
});

document.querySelectorAll('input[data-filter]').forEach(input => {
  input.addEventListener('input', () => {
    const term = input.value.trim().toLocaleLowerCase();
    input.closest('.credentialGroup')
      ?.querySelectorAll('.credentialEntry')
      .forEach(entry => {
        entry.hidden = !entry.textContent.toLocaleLowerCase().includes(term);
      });
  });
});

document.querySelectorAll('.box.filter input:not([data-filter])').forEach(input => {
  input.addEventListener('input', () => {
    const term = input.value.trim().toLocaleLowerCase();
    input.closest('section.box')?.querySelectorAll('.scroll-container article').forEach(entry => {
      entry.hidden = !entry.textContent.toLocaleLowerCase().includes(term);
    });
  });
});

document.querySelectorAll('form[data-home-submit]').forEach(form => {
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const submitter = event.submitter;
    if (submitter) submitter.disabled = true;
    const isToken = form.dataset.homeSubmit === 'token';
    try {
      const response = await fetch(form.action, {
        method: 'POST',
        credentials: 'same-origin',
        redirect: isToken ? 'follow' : 'manual',
        headers: isToken ? { Accept: 'application/json' } : {},
        body: new URLSearchParams(new FormData(form))
      });
      if (isToken) {
        if (response.status !== 201) throw new Error(`No se pudo emitir el token (HTTP ${response.status}).`);
        const { token, expiresAt } = await response.json();
        form.closest('dialog').close();
        document.getElementById('home-token-value').textContent = token;
        document.getElementById('home-token-expires').textContent =
          `Vence el ${new Date(expiresAt).toLocaleString('es-AR')}.`;
        openDialog('home-token-issued');
      } else {
        if (!response.ok && response.status !== 303 && response.type !== 'opaqueredirect') {
          throw new Error(`No se pudo guardar (HTTP ${response.status}).`);
        }
        window.location.assign('/');
      }
    } catch (error) {
      window.alert(error.message);
    } finally {
      if (submitter) submitter.disabled = false;
    }
  });
});

document.getElementById('home-token-issued')?.addEventListener('close', () => {
  document.getElementById('home-token-value').textContent = '';
});

document.getElementById('access-check')?.addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const output = document.getElementById('access-result');
  try {
    const response = await fetch(form.action, {
      method: 'POST',
      credentials: 'same-origin',
      body: new URLSearchParams(new FormData(form))
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const decision = await response.json();
    output.textContent = decision.allowed ? 'allowed' : 'denied';
  } catch (error) {
    output.textContent = `Error: ${error.message}`;
  }
});
