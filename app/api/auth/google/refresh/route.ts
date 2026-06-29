import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function parseCookies(cookieHeader: string | null) {
    const map: Record<string, string> = {};
    if (!cookieHeader) return map;
    for (const part of cookieHeader.split(';')) {
        const idx = part.indexOf('=');
        if (idx < 0) continue;
        const name = part.slice(0, idx).trim();
        const val = part.slice(idx + 1).trim();
        map[name] = decodeURIComponent(val);
    }
    return map;
}

export async function GET(request: Request) {
    try {
        const cookieHeader = request.headers.get('cookie');
        const cookies = parseCookies(cookieHeader);
        const refreshToken = cookies['google_refresh'];
        if (!refreshToken) return NextResponse.json({ error: 'No refresh token available' }, { status: 400 });

        const params = new URLSearchParams();
        params.append('grant_type', 'refresh_token');
        params.append('refresh_token', refreshToken);
        const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
        if (!clientId) return NextResponse.json({ error: 'Missing GOOGLE_CLIENT_ID' }, { status: 500 });
        params.append('client_id', clientId);
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET || '';
        if (clientSecret) params.append('client_secret', clientSecret);

        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString(),
        });
        const tokenJson = await tokenRes.json();
        if (!tokenRes.ok) return NextResponse.json({ error: tokenJson }, { status: 500 });

        const accessToken = tokenJson.access_token;
        const expires = Number(tokenJson.expires_in || 3600);

        const res = NextResponse.json({ ok: true, access_token: accessToken, expires_in: expires });
        // set cookie with access token (not httpOnly so client can read it)
        res.headers.append('Set-Cookie', `google_token=${encodeURIComponent(accessToken)}; Path=/; Max-Age=${Math.floor(expires)}; SameSite=Lax`);

        return res;
    } catch (e: any) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
