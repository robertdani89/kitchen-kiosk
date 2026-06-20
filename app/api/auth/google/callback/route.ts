import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function parseCookies(cookieHeader: string | null) {
    const map: Record<string, string> = {};
    if (!cookieHeader) return map;
    const parts = cookieHeader.split(';').map(p => p.trim());
    for (const p of parts) {
        const [k, ...rest] = p.split('=');
        map[k] = rest.join('=');
    }
    return map;
}

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const code = url.searchParams.get('code');
        if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 });

        const cookies = parseCookies(request.headers.get('cookie'));
        const verifier = cookies['pkce_verifier'];
        if (!verifier) return NextResponse.json({ error: 'Missing PKCE verifier cookie' }, { status: 400 });

        const origin = url.origin;
        const redirect = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT || `${origin}/api/auth/google/callback`;

        const params = new URLSearchParams();
        params.append('code', code);
        params.append('client_id', process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '');
        if (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET) params.append('client_secret', process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET);
        params.append('redirect_uri', redirect);
        params.append('grant_type', 'authorization_code');
        params.append('code_verifier', verifier);

        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString(),
        });
        const tokenJson = await tokenRes.json();
        if (!tokenRes.ok) return NextResponse.json({ error: tokenJson }, { status: 500 });

        const accessToken = tokenJson.access_token;
        const expires = Number(tokenJson.expires_in || 3600);

        const redirectTo = process.env.NEXT_PUBLIC_APP_URL || origin;
        const res = NextResponse.redirect(redirectTo);
        // set cookie with access token (not httpOnly so client can read it)
        res.headers.append('Set-Cookie', `google_token=${encodeURIComponent(accessToken)}; Path=/; Max-Age=${Math.floor(expires)}; SameSite=Lax`);
        // clear verifier
        res.headers.append('Set-Cookie', `pkce_verifier=; Path=/; Max-Age=0; SameSite=Lax`);
        return res;
    } catch (e: any) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
