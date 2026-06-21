import { NextResponse } from 'next/server';
import { randomBytes, createHash } from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const codeVerifier = randomBytes(64).toString('base64url');
        const hash = createHash('sha256').update(codeVerifier).digest('base64');
        const codeChallenge = hash.replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');

        const url = new URL(request.url);
        const origin = url.origin;
        const redirect = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT || `${origin}/api/auth/google/callback`;
        const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        if (!clientId) return NextResponse.json({ error: 'Missing GOOGLE_CLIENT_ID' }, { status: 500 });

        const scope = 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/tasks.readonly https://www.googleapis.com/auth/drive.readonly';
        const params = new URLSearchParams({
            client_id: clientId,
            redirect_uri: redirect,
            response_type: 'code',
            scope,
            access_type: 'offline',
            prompt: 'consent',
            code_challenge: codeChallenge,
            code_challenge_method: 'S256',
        });

        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

        const res = NextResponse.redirect(authUrl);
        res.headers.append('Set-Cookie', `pkce_verifier=${codeVerifier}; Path=/; Max-Age=600; SameSite=Lax`);
        return res;
    } catch (e: any) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
