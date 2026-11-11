// Receives a beacon from simonx.dev pages and posts a plain "someone opened
// the page" alert to Discord, plus "non trovi la tua?" reports with their
// attachments. Page-open alerts carry no IP, location or device details;
// reports include the sender's IP, approximate location and device. The webhook URL comes from the DISCORD_WEBHOOK secret, so it
// never appears in the public site code.

const ALLOWED_ORIGINS = [
    'https://simonx.dev',
    'https://www.simonx.dev',
    'http://localhost:8000',
];

// Crawlers and link previews don't count as "a person opened the page".
const BOT_PATTERN = /bot|crawl|spider|slurp|preview|headless|lighthouse|python|curl|wget/i;

function corsHeaders(origin) {
    return {
        'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Vary': 'Origin',
    };
}

function clip(value, max = 1000) {
    const text = String(value ?? '').trim();
    if (!text) return '—';
    return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function romeTime() {
    return new Date().toLocaleString('it-IT', { timeZone: 'Europe/Rome', dateStyle: 'full', timeStyle: 'medium' });
}

function postToDiscord(env, payload) {
    return fetch(env.DISCORD_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
}

// ---------- "non trovi la tua?" reports ----------

const MAX_FILES = 4;
const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MAX_TOTAL_BYTES = 9 * 1024 * 1024; // stays under Discord's 10 MB upload limit
const ALLOWED_EXT = /\.(png|jpe?g|webp|gif|heic|heif|pdf|eml|msg|txt)$/i;

function json(body, status, cors) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' },
    });
}

function field(form, name, max) {
    const value = form.get(name);
    return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function safeFileName(name, index) {
    const ext = (name.match(/\.[a-z0-9]{1,5}$/i) || [''])[0].toLowerCase();
    const base = name.slice(0, name.length - ext.length)
        .normalize('NFD').replace(/[^\w-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40);
    return `prova-${index + 1}${base ? `-${base}` : ''}${ext}`;
}

function describeUserAgent(ua) {
    const browser =
        /Edg\//.test(ua) ? 'Edge' :
        /OPR\/|Opera/.test(ua) ? 'Opera' :
        /SamsungBrowser/.test(ua) ? 'Samsung Internet' :
        /Firefox\//.test(ua) ? 'Firefox' :
        /CriOS|Chrome\//.test(ua) ? 'Chrome' :
        /Safari\//.test(ua) ? 'Safari' : 'Sconosciuto';
    const os =
        /Windows NT/.test(ua) ? 'Windows' :
        /iPhone|iPad|iPod/.test(ua) ? 'iOS' :
        /Android/.test(ua) ? 'Android' :
        /Mac OS X/.test(ua) ? 'macOS' :
        /CrOS/.test(ua) ? 'ChromeOS' :
        /Linux/.test(ua) ? 'Linux' : 'Sconosciuto';
    const device = /Mobi|iPhone|Android(?!.*Tablet)/.test(ua) ? 'mobile' : /iPad|Tablet/.test(ua) ? 'tablet' : 'desktop';
    return `${browser} su ${os} (${device})`;
}

// Sender details, attached only to "non trovi la tua?" reports (never to page-open alerts).
function senderInfo(request) {
    const cf = request.cf || {};
    const ua = request.headers.get('User-Agent') || '';
    return {
        ip: request.headers.get('CF-Connecting-IP') || '—',
        place: [cf.city, cf.region, cf.country].filter(Boolean).join(', '),
        network: [cf.asOrganization, cf.asn ? `AS${cf.asn}` : ''].filter(Boolean).join(' · '),
        device: describeUserAgent(ua),
        ua,
    };
}

async function handleReport(request, env, cors) {
    const sender = senderInfo(request);

    if (env.REPORT_LIMITER) {
        const { success } = await env.REPORT_LIMITER.limit({ key: sender.ip });
        if (!success) return json({ error: 'Troppe segnalazioni in poco tempo. Riprova tra un minuto.' }, 429, cors);
    }

    let form;
    try {
        form = await request.formData();
    } catch {
        return json({ error: 'Richiesta non valida.' }, 400, cors);
    }

    // Honeypot: real visitors never see or fill this field.
    if (field(form, 'website', 200)) return json({ ok: true }, 200, cors);

    const school = field(form, 'scuola', 200);
    const code = field(form, 'codice', 20).toUpperCase();
    const town = field(form, 'comune', 100);
    const notes = field(form, 'note', 1000);
    const contact = field(form, 'contatto', 200);
    const files = form.getAll('prova').filter((f) => typeof f === 'object' && f && f.size > 0);

    if (school.length < 3) return json({ error: 'Inserisci il nome della scuola.' }, 400, cors);
    if (code && !/^[A-Z0-9]{10}$/.test(code)) return json({ error: 'Il codice meccanografico ha 10 caratteri (es. RMIC8EK00L).' }, 400, cors);
    if (files.length === 0) return json({ error: 'Allega almeno una prova (screenshot o file dell\'email).' }, 400, cors);
    if (files.length > MAX_FILES) return json({ error: `Puoi allegare al massimo ${MAX_FILES} file.` }, 400, cors);
    let total = 0;
    for (const f of files) {
        if (!ALLOWED_EXT.test(f.name || '')) return json({ error: `Formato non supportato: ${clip(f.name, 60)}` }, 400, cors);
        if (f.size > MAX_FILE_BYTES) return json({ error: `File troppo grande: ${clip(f.name, 60)} (max 8 MB).` }, 400, cors);
        total += f.size;
    }
    if (total > MAX_TOTAL_BYTES) return json({ error: 'Gli allegati superano 9 MB in totale.' }, 400, cors);

    const names = files.map((f, i) => safeFileName(f.name || 'file', i));
    const firstImage = names.find((n) => /\.(png|jpe?g|webp|gif)$/i.test(n));
    const embed = {
        title: '📩 Segnalazione: scuola non in elenco',
        color: 0xf5a524,
        timestamp: new Date().toISOString(),
        fields: [
            { name: 'Scuola', value: clip(school, 300), inline: false },
            { name: 'Codice', value: clip(code), inline: true },
            { name: 'Comune', value: clip(town), inline: true },
            { name: 'Contatto', value: clip(contact), inline: true },
            { name: 'Note', value: clip(notes, 1000), inline: false },
            { name: 'Allegati', value: clip(files.map((f, i) => `${names[i]} (${Math.ceil(f.size / 1024)} KB)`).join('\n')), inline: false },
            { name: 'Quando', value: clip(romeTime()), inline: false },
            { name: 'IP', value: clip(sender.ip), inline: true },
            { name: 'Posizione (approssimativa)', value: clip(sender.place), inline: true },
            { name: 'Rete / provider', value: clip(sender.network), inline: true },
            { name: 'Dispositivo', value: clip(sender.device), inline: true },
            { name: 'User agent', value: clip(sender.ua, 1000), inline: false },
        ],
        footer: { text: 'simonx.dev · segnalazioni' },
    };
    if (firstImage) embed.image = { url: `attachment://${firstImage}` };

    const payload = new FormData();
    payload.append('payload_json', JSON.stringify({
        username: 'simonx.dev',
        // Fixed text: everything the visitor typed stays inside the embed, which can't ping anyone.
        content: '@here nuova segnalazione',
        embeds: [embed],
        allowed_mentions: { parse: ['everyone'] },
        attachments: names.map((filename, id) => ({ id, filename })),
    }));
    files.forEach((f, i) => payload.append(`files[${i}]`, f, names[i]));

    const res = await fetch(env.DISCORD_WEBHOOK, { method: 'POST', body: payload });
    if (!res.ok) {
        console.log('Discord rejected report', res.status, await res.text());
        return json({ error: 'Invio non riuscito. Riprova più tardi.' }, 502, cors);
    }
    return json({ ok: true }, 200, cors);
}

// ---------- page-open alerts ----------

async function handleVisit(request, env, ctx, origin, cors) {
    if (BOT_PATTERN.test(request.headers.get('User-Agent') || '')) {
        return new Response(null, { status: 204, headers: cors });
    }

    let page = '';
    try {
        const data = JSON.parse((await request.text()).slice(0, 2000)) || {};
        page = typeof data.page === 'string' ? data.page : '';
    } catch {
        page = '';
    }

    ctx.waitUntil(postToDiscord(env, {
        username: 'simonx.dev',
        content: '@here',
        embeds: [{
            title: '👀 Qualcuno ha aperto la pagina',
            description: clip(`${origin}${page}`, 300),
            color: 0xf5f5f5,
            timestamp: new Date().toISOString(),
            fields: [{ name: 'Quando', value: clip(romeTime()), inline: false }],
            footer: { text: 'simonx.dev · avviso visite' },
        }],
        allowed_mentions: { parse: ['everyone'] },
    }));

    return new Response(null, { status: 204, headers: cors });
}

export default {
    async fetch(request, env, ctx) {
        const origin = request.headers.get('Origin') || '';
        const cors = corsHeaders(origin);

        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: cors });
        }
        if (request.method !== 'POST' || !ALLOWED_ORIGINS.includes(origin)) {
            return new Response('Forbidden', { status: 403, headers: cors });
        }
        if (!env.DISCORD_WEBHOOK) {
            return new Response('Webhook not configured', { status: 500, headers: cors });
        }

        if (new URL(request.url).pathname === '/segnala') {
            return handleReport(request, env, cors);
        }
        return handleVisit(request, env, ctx, origin, cors);
    },
};
