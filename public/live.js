'use strict';
// MesaHelp v0.3.1: avisos WebSocket con sincronización de recuperación.
// El servidor y SQLite siguen siendo la fuente de verdad; los eventos solo invitan a consultar.
(() => {
  const initialZone = document.querySelector('[data-live-zone]');
  if (!initialZone || !window.WebSocket) return;

  const ticketId = initialZone.dataset.ticketId || '';
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const path = '/live' + (ticketId ? '?ticket=' + encodeURIComponent(ticketId) : '');
  const status = document.querySelector('[data-live-status]');
  const inform = message => { if (status) status.textContent = message; };

  let socket;
  let retryDelay = 1000;
  let retryTimer = null;
  let fetching = false;
  let refreshQueued = false;
  let deferredForEditing = false;
  let revision = 0;
  const baselines = new WeakMap();
  const formRevisions = new WeakMap();
  const submitting = new Set();
  const fields = zone => [...zone.querySelectorAll('input, textarea, select')];
  const valueOf = field => JSON.stringify(field.tagName === 'SELECT'
    ? [...field.options].map(option => option.selected)
    : [field.value, field.checked]);
  function remember(zone) {
    fields(zone).forEach(field => baselines.set(field, valueOf(field)));
  }
  function dirty(zone) {
    return fields(zone).some(field => baselines.get(field) !== valueOf(field));
  }
  remember(initialZone);

  function editing(zone) {
    const active = document.activeElement;
    return Boolean(active && zone.contains(active) && /^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName));
  }

  async function refreshView() {
    refreshQueued = true;
    if (fetching || document.hidden) return;
    fetching = true;
    try {
      // Nunca descartar avisos que lleguen mientras hay una consulta HTTP pendiente.
      while (refreshQueued && !document.hidden) {
        refreshQueued = false;
        const requestedRevision = revision;
        const response = await fetch(location.pathname + location.search, {
          credentials: 'same-origin', cache: 'no-store'
        });
        if (!response.ok) {
          inform('No se pudo sincronizar; actualiza tu sesión');
          break;
        }
        const markup = await response.text();
        const parsed = new DOMParser().parseFromString(markup, 'text/html');
        const updated = parsed.querySelector('[data-live-zone]');
        const current = document.querySelector('[data-live-zone]');
        if (!updated || !current) {
          inform('No se pudo sincronizar; vuelve a iniciar sesión si es necesario');
          break;
        }
        // Una respuesta iniciada antes de editar/guardar/descartar ya no es vigente.
        if (requestedRevision !== revision) { refreshQueued = true; continue; }
        // Igualar la vista filtrada antes de comparar HTML: evita reemplazos
        // cada 20 s únicamente por filas ocultas en el explorador.
        const explorer = window.MesaHelpExplorer;
        if (explorer && typeof explorer.prepare === 'function') explorer.prepare(updated);
        // La consulta periódica NO reconstruye formularios si no hay cambios.
        if (updated.innerHTML === current.innerHTML) continue;
        // Evitar que un cambio remoto borre una observación que se está escribiendo.
        if (editing(current) || dirty(current) || submitting.size) {
          deferredForEditing = true;
          inform('Hay novedades; termina la edición para verlas');
          continue;
        }
        current.replaceWith(updated);
        if (explorer && typeof explorer.refresh === 'function') explorer.refresh(updated);
        remember(updated);
        deferredForEditing = false;
        inform('Actualizado en tiempo real');
      }
    } catch {
      inform('Sin conexión; puedes recargar la página');
    } finally {
      fetching = false;
      // Una notificación puede llegar justo antes del finally.
      if (refreshQueued && !document.hidden) void refreshView();
    }
  }

  function scheduleReconnect() {
    if (retryTimer !== null) return;
    retryTimer = setTimeout(() => {
      retryTimer = null;
      connect();
    }, document.hidden ? 3000 : retryDelay);
    retryDelay = Math.min(retryDelay * 2, 15000);
  }

  function connect() {
    if (document.hidden) { scheduleReconnect(); return; }
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return;
    try {
      socket = new WebSocket(protocol + '//' + location.host + path);
    } catch {
      inform('Reconectando seguimiento…');
      scheduleReconnect();
      return;
    }
    socket.addEventListener('open', () => {
      retryDelay = 1000;
      if (retryTimer !== null) { clearTimeout(retryTimer); retryTimer = null; }
      inform('Actualización en vivo activa');
      // Tras una caída podemos haber perdido cambios: sincronizar inmediatamente.
      void refreshView();
    });
    socket.addEventListener('message', event => {
      try {
        const notice = JSON.parse(event.data);
        if (notice.type === 'ticket_updated') void refreshView();
      } catch { /* Mensajes inválidos no modifican la interfaz. */ }
    });
    socket.addEventListener('close', () => {
      inform('Reconectando seguimiento…');
      scheduleReconnect();
    });
    socket.addEventListener('error', () => socket.close());
  }

  connect();
  // Red de seguridad: los eventos suelen ser inmediatos, el sondeo recupera avisos perdidos.
  setInterval(() => { if (!document.hidden) void refreshView(); }, 20000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) { connect(); void refreshView(); }
  });
  document.addEventListener('focusout', () => {
    if (deferredForEditing) void refreshView();
  });
  function changed(event) {
    const current = document.querySelector('[data-live-zone]');
    if (!current || !current.contains(event.target)) return;
    revision++;
    if (event.target.form) formRevisions.set(event.target.form, revision);
    if (deferredForEditing && !dirty(current)) void refreshView();
  }
  document.addEventListener('input', changed);
  document.addEventListener('change', changed);
  document.addEventListener('reset', event => {
    const current = document.querySelector('[data-live-zone]');
    if (!current || !current.contains(event.target)) return;
    revision++;
    formRevisions.set(event.target, revision);
    // El evento reset precede a la restauración nativa de valores.
    setTimeout(() => { if (deferredForEditing) void refreshView(); }, 0);
  });
  document.addEventListener('submit', async event => {
    const form = event.target;
    const current = document.querySelector('[data-live-zone]');
    if (!current || !current.contains(form) || form.method.toLowerCase() !== 'post') return;
    event.preventDefault();
    if (submitting.has(form)) return;
    submitting.add(form);
    revision++;
    const submittedRevision = formRevisions.get(form);
    const controls = fields(form);
    const submittedValues = controls.map(valueOf);
    try {
      const response = await fetch(form.action, {
        method: 'POST', credentials: 'same-origin', cache: 'no-store',
        body: new URLSearchParams(new FormData(form))
      });
      const destination = new URL(response.url || form.action, location.href);
      // Un 200 de login tras expirar la sesión no acredita un guardado.
      if (!response.ok || !response.redirected || destination.pathname !== location.pathname ||
          !['actualizado', 'sin_cambios', 'nota'].some(key => destination.searchParams.has(key))) {
        inform('No se pudo guardar; se conserva el borrador');
        return;
      }
      if (formRevisions.get(form) === submittedRevision &&
          controls.every((field, index) => valueOf(field) === submittedValues[index])) {
        form.reset();
      }
      revision++;
      deferredForEditing = true;
      inform('Guardado; sincronizando novedades');
    } catch {
      inform('No se pudo guardar; se conserva el borrador');
    } finally {
      submitting.delete(form);
      if (deferredForEditing) void refreshView();
    }
  });
  window.addEventListener('focus', () => { connect(); void refreshView(); });
  window.addEventListener('online', () => { connect(); void refreshView(); });
  window.addEventListener('pageshow', () => { connect(); void refreshView(); });
})();
