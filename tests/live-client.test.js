'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const clientJs = fs.readFileSync(path.join(__dirname, '../public/live.js'), 'utf8');

function harness({manualRequests = false} = {}) {
  let markup = 'v0';
  let replacements = 0;
  let requests = 0;
  const pending = [];
  const sent = [];
  const intervals = [];
  const timers = new Map();
  const listeners = new Map();
  let timerSeq = 1;
  let zone;
  const document = {
    hidden: false,
    activeElement: null,
    querySelector(selector) {
      if (selector === '[data-live-zone]') return zone;
      if (selector === '[data-live-status]') return status;
      return null;
    },
    addEventListener(name, callback) { listeners.set(name, callback); }
  };
  const status = { textContent: 'Conectando seguimiento…' };
  function control(tagName, value = '') {
    return { tagName, type: 'text', name: tagName.toLowerCase(), value, defaultValue: value,
      get options() { return ['abierto', 'en_proceso', 'cerrado'].map(option => ({ selected: this.value === option })); } };
  }
  function makeZone(html) {
    const fields = [control('INPUT'), control('TEXTAREA'), control('SELECT', 'abierto'), control('TEXTAREA')];
    const form = {
      tagName: 'FORM', method: 'post', action: 'http://localhost:3000/tickets/7/status',
      querySelectorAll() { return fields.slice(0, 3); },
      reset() {
        listeners.get('reset')?.({ target: form });
        this.querySelectorAll().forEach(field => { field.value = field.defaultValue; });
      }
    };
    fields.forEach(field => { field.form = form; });
    const otherForm = { ...form, action: 'http://localhost:3000/tickets/7/notes',
      querySelectorAll() { return fields.slice(3); } };
    fields[3].form = otherForm;
    return {
      dataset: { ticketId: '7' }, innerHTML: html,
      fields, form, otherForm,
      querySelectorAll() { return fields; },
      contains(element) { return element === form || element === otherForm || fields.includes(element) || element?.tagName === 'TEXTAREA'; },
      replaceWith(newZone) { replacements++; zone = newZone; }
    };
  }
  zone = makeZone('v0');
  class FakeWebSocket {
    static CONNECTING = 0;
    static OPEN = 1;
    static CLOSED = 3;
    static instances = [];
    constructor(uri) {
      this.uri = uri;
      this.readyState = 0;
      this.callbacks = new Map();
      FakeWebSocket.instances.push(this);
    }
    addEventListener(name, fn) { this.callbacks.set(name, fn); }
    open() { this.readyState = 1; this.callbacks.get('open')?.(); }
    message(type = 'ticket_updated') { this.callbacks.get('message')?.({ data: JSON.stringify({ type }) }); }
    close() { this.readyState = 3; this.callbacks.get('close')?.(); }
  }
  const window = { WebSocket: FakeWebSocket, addEventListener(name, fn) { listeners.set(name, fn); } };
  const source = {
    document, window, WebSocket: FakeWebSocket,
    location: { protocol: 'http:', host: 'localhost:3000', pathname: '/tickets/7', search: '' },
    encodeURIComponent, URL, URLSearchParams,
    FormData: class { constructor(form) { return form.querySelectorAll().map(field => [field.name, field.value]); } },
    setTimeout(callback) { const id = timerSeq++; timers.set(id, callback); return id; },
    clearTimeout(id) { timers.delete(id); },
    setInterval(callback) { intervals.push(callback); return intervals.length; },
    fetch(url, options) {
      requests++;
      sent.push({ url, options });
      if (manualRequests) return new Promise((resolve, reject) => { resolve.reject = reject; pending.push(resolve); });
      return Promise.resolve(response(markup));
    },
    DOMParser: class { parseFromString(html) { return { querySelector() { return makeZone(html); } }; } }
  };
  vm.runInNewContext(clientJs, source, { filename: 'public/live.js' });
  return {
    status, document, window, intervals, listeners, timers, sockets: FakeWebSocket.instances, pending, sent,
    setMarkup(next) { markup = next; },
    respond(next, options = {}) { assert.ok(pending.length, 'pending HTTP request'); pending.shift()({ ...response(next), ...options }); },
    fail() { pending.shift()({ ok: false }); },
    get fields() { return zone.fields; },
    get form() { return zone.form; },
    get otherForm() { return zone.otherForm; },
    edit(index, value) { zone.fields[index].value = value; listeners.get('input')?.({ target: zone.fields[index] }); },
    submit() { listeners.get('submit')?.({ target: zone.form, preventDefault() {} }); },
    get replacements() { return replacements; },
    get requests() { return requests; },
    get html() { return zone.innerHTML; },
    async tick() { await new Promise(resolve => setImmediate(resolve)); }
  };
}
function response(body) { return { ok: true, text: async () => body }; }

test('cliente en vivo: sincroniza al abrir, no reemplaza contenido sin cambios', async () => {
  const h = harness();
  assert.equal(h.sockets.length, 1);
  h.sockets[0].open();
  await h.tick();
  assert.equal(h.replacements, 0);
  h.intervals[0]();
  await h.tick();
  assert.equal(h.replacements, 0);
  h.setMarkup('v1');
  h.sockets[0].message();
  await h.tick();
  assert.equal(h.html, 'v1');
  assert.equal(h.replacements, 1);
});

test('cliente en vivo: conserva texto y selección pendientes después de blur', async () => {
  const h = harness();
  h.sockets[0].open();
  await h.tick();
  h.edit(0, 'asunto pendiente');
  h.edit(1, 'observación pendiente');
  h.edit(2, 'en_proceso');
  h.document.activeElement = null;
  h.setMarkup('v1');
  h.sockets[0].message();
  await h.tick();
  h.listeners.get('focusout')();
  await h.tick();
  assert.equal(h.html, 'v0', 'un aviso tras blur no debe reemplazar el borrador');
  assert.deepEqual(h.fields.map(field => field.value), ['asunto pendiente', 'observación pendiente', 'en_proceso', '']);
});

test('cliente en vivo: detecta también valores modificados sin evento de entrada', async () => {
  for (const [index, value] of [[0, 'texto'], [1, 'nota'], [2, 'cerrado']]) {
    const h = harness();
    h.fields[index].value = value;
    h.setMarkup('v1');
    h.sockets[0].open();
    await h.tick();
    assert.equal(h.replacements, 0);
    assert.equal(h.fields[index].value, value);
  }
});

test('cliente en vivo: descartar o revertir permite recuperar novedades', async () => {
  for (const reset of [false, true]) {
    const h = harness();
    h.edit(1, 'borrador');
    h.setMarkup('v1');
    h.sockets[0].open();
    await h.tick();
    assert.equal(h.html, 'v0');
    if (reset) {
      h.form.reset();
      for (const callback of [...h.timers.values()]) callback();
    } else h.edit(1, '');
    await h.tick();
    assert.equal(h.html, 'v1');
  }
});

const saved = { redirected: true, url: 'http://localhost:3000/tickets/7?actualizado=1' };

test('cliente en vivo: un guardado confirmado recupera novedades', async () => {
  const h = harness({ manualRequests: true });
  h.edit(1, 'nota guardada');
  h.submit();
  assert.equal(h.requests, 1);
  assert.equal(h.sent[0].options.method, 'POST');
  assert.equal(h.sent[0].options.credentials, 'same-origin');
  assert.match(h.sent[0].options.body.toString(), /textarea=nota\+guardada/);
  h.respond('guardado', saved);
  await h.tick();
  assert.equal(h.fields[1].value, '');
  h.respond('v1');
  await h.tick();
  assert.equal(h.html, 'v1');
});

test('cliente en vivo: errores HTTP, red y login conservan el borrador', async () => {
  for (const failure of ['http', 'network', 'login']) {
    const h = harness({ manualRequests: true });
    h.edit(1, 'nota pendiente');
    h.submit();
    if (failure === 'http') h.fail();
    else if (failure === 'login') h.respond('login', { redirected: true, url: 'http://localhost:3000/login' });
    else h.pending.shift().reject(new Error('network'));
    await h.tick();
    assert.equal(h.fields[1].value, 'nota pendiente');
    assert.match(h.status.textContent, /conserva el borrador/);
    h.sockets[0].message();
    h.respond('v1');
    await h.tick();
    assert.equal(h.html, 'v0');
  }
});

test('cliente en vivo: un POST tardío conserva ediciones posteriores', async () => {
  const h = harness({ manualRequests: true });
  h.edit(1, 'enviada');
  h.submit();
  h.edit(1, 'edición posterior');
  h.respond('guardado', saved);
  await h.tick();
  h.respond('v1');
  await h.tick();
  assert.equal(h.html, 'v0');
  assert.equal(h.fields[1].value, 'edición posterior');
});

test('cliente en vivo: guardar un formulario conserva el borrador del otro', async () => {
  const h = harness({ manualRequests: true });
  h.edit(1, 'enviada');
  h.edit(3, 'otra observación pendiente');
  h.submit();
  h.respond('guardado', saved);
  await h.tick();
  assert.equal(h.fields[1].value, '');
  assert.equal(h.fields[3].value, 'otra observación pendiente');
  h.respond('v1');
  await h.tick();
  assert.equal(h.html, 'v0');
  h.otherForm.reset();
  for (const callback of [...h.timers.values()]) callback();
  h.respond('v1');
  await h.tick();
  assert.equal(h.html, 'v1');
});

test('cliente en vivo: ignora un GET anterior a una edición aunque luego se revierta', async () => {
  const h = harness({ manualRequests: true });
  h.sockets[0].open();
  h.edit(1, 'nota');
  h.edit(1, '');
  h.respond('antigua');
  await h.tick();
  assert.equal(h.html, 'v0');
  assert.equal(h.requests, 2);
  h.respond('actual');
  await h.tick();
  assert.equal(h.html, 'actual');
});

test('cliente en vivo: recupera visibilidad y eventos de ventana sin perder borradores', async () => {
  const h = harness();
  h.document.hidden = true;
  h.sockets[0].message();
  assert.equal(h.requests, 0);
  h.setMarkup('v1');
  h.document.hidden = false;
  h.listeners.get('visibilitychange')();
  await h.tick();
  assert.equal(h.html, 'v1');
  h.edit(2, 'cerrado');
  h.setMarkup('v2');
  for (const name of ['focus', 'online', 'pageshow']) {
    h.listeners.get(name)();
    await h.tick();
    assert.equal(h.html, 'v1');
    assert.equal(h.fields[2].value, 'cerrado');
  }
});

test('cliente en vivo: no pierde avisos simultáneos durante una consulta', async () => {
  const h = harness({ manualRequests: true });
  h.sockets[0].open();
  assert.equal(h.requests, 1);
  h.sockets[0].message(); // Se encola aunque el fetch anterior no ha respondido.
  h.respond('v0');
  await h.tick();
  assert.equal(h.requests, 2, 'debe consultar de nuevo tras el aviso en cola');
  h.respond('v1');
  await h.tick();
  assert.equal(h.html, 'v1');
});

test('cliente en vivo: recupera cambios al reconectar y al hacer sondeo', async () => {
  const h = harness();
  h.sockets[0].open();
  await h.tick();
  h.sockets[0].close();
  h.setMarkup('v1');
  const callback = [...h.timers.values()][0];
  assert.ok(callback);
  callback();
  assert.equal(h.sockets.length, 2);
  h.sockets[1].open();
  await h.tick();
  assert.equal(h.html, 'v1');
  h.setMarkup('v2');
  h.intervals[0]();
  await h.tick();
  assert.equal(h.html, 'v2');
});

test('cliente en vivo: respeta campos activos durante una actualización', async () => {
  const h = harness();
  h.sockets[0].open();
  await h.tick();
  h.document.activeElement = { tagName: 'TEXTAREA' };
  h.setMarkup('v1');
  h.sockets[0].message();
  await h.tick();
  assert.equal(h.html, 'v0');
  assert.match(h.status.textContent, /novedades/i);
  h.document.activeElement = null;
  h.listeners.get('focusout')();
  await h.tick();
  assert.equal(h.html, 'v1');
});


test('cliente en vivo: respeta el filtrado existente y no reemplaza filas solo por filtros visuales', async () => {
  const h = harness();
  let prepared = 0;
  let applied = 0;
  h.window.MesaHelpExplorer = {
    prepare(updated) { prepared++; updated.innerHTML += '|filtrada'; },
    refresh() { applied++; }
  };
  h.setMarkup('v1');
  h.sockets[0].open();
  await h.tick();
  assert.equal(h.html, 'v1|filtrada');
  assert.equal(h.replacements, 1);
  assert.equal(applied, 1);
  h.intervals[0]();
  await h.tick();
  assert.equal(h.replacements, 1, 'el sondeo no debe reemplazar filas por el atributo hidden');
  assert.equal(prepared, 2);
  assert.equal(applied, 1);
  h.setMarkup('v2');
  h.sockets[0].message();
  await h.tick();
  assert.equal(h.html, 'v2|filtrada');
  assert.equal(applied, 2, 'las novedades del servidor vuelven a aplicar los filtros');
});
