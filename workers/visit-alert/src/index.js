// Receives a small JSON beacon from simonx.dev pages and forwards a visit
// alert to Discord. The webhook URL comes from the DISCORD_WEBHOOK secret,
// so it never appears in the public site code.

const ALLOWED_ORIGINS = [
    'https://simonx.dev',
    'https://www.simonx.dev',
    'http://localhost:8000',
];

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

        let data = {};
        try {
            data = JSON.parse((await request.text()).slice(0, 4000)) || {};
        } catch {
            data = {};
        }

        const cf = request.cf || {};
        const ip = request.headers.get('CF-Connecting-IP') || '—';
        const ua = request.headers.get('User-Agent') || '';
        const isBot = BOT_PATTERN.test(ua);
        const now = new Date();
        const romeTime = now.toLocaleString('it-IT', { timeZone: 'Europe/Rome', dateStyle: 'full', timeStyle: 'medium' });
        const place = [cf.city, cf.region, cf.country].filter(Boolean).join(', ');
        const network = [cf.asOrganization, cf.asn ? `AS${cf.asn}` : ''].filter(Boolean).join(' · ');

        const embed = {
            title: isBot ? '🤖 Visita (probabile bot)' : '👀 Nuova visita',
            description: clip(`${origin}${data.page || ''}`, 300),
            color: isBot ? 0x7c7c82 : 0xf5f5f5,
            timestamp: now.toISOString(),
            fields: [
                { name: 'Quando', value: clip(romeTime), inline: false },
                { name: 'IP', value: clip(ip), inline: true },
                { name: 'Posizione (approssimativa)', value: clip(place), inline: true },
                { name: 'Rete / provider', value: clip(network), inline: true },
                { name: 'Dispositivo', value: clip(describeUserAgent(ua)), inline: true },
                { name: 'Lingua', value: clip(data.language), inline: true },
                { name: 'Fuso orario', value: clip(data.timezone), inline: true },
                { name: 'Schermo / finestra', value: clip(`${data.screen || '?'} / ${data.viewport || '?'}`), inline: true },
                { name: 'Arrivato da', value: clip(data.referrer || 'diretto (nessun referrer)'), inline: true },
                { name: 'User agent', value: clip(ua, 1000), inline: false },
            ],
            footer: { text: 'simonx.dev · avviso visite' },
        };

        ctx.waitUntil(
            fetch(env.DISCORD_WEBHOOK, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: 'simonx.dev',
                    // Fixed text: visitor data only goes into the embed, which can't ping anyone.
                    content: '@here',
                    embeds: [embed],
                    allowed_mentions: { parse: ['everyone'] },
                }),
            }),
        );

        return new Response(null, { status: 204, headers: cors });
    },
};
