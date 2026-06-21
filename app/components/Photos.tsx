"use client";

import { useEffect, useRef, useState } from 'react';
import { useGoogleAuth } from '../context/GoogleAuthContext';

export default function Photos() {
    const { googleToken, fetchWithAuth } = useGoogleAuth();
    const [imgSrc, setImgSrc] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const objectUrlRef = useRef<string | null>(null);
    const intervalRef = useRef<number | null>(null);

    const fetchRandomFromKiosk = async () => {
        if (!googleToken) return;
        setLoading(true);
        try {
            // find folder named 'kiosk'
            const qFolder = encodeURIComponent("name = 'kiosk' and mimeType = 'application/vnd.google-apps.folder' and trashed = false");
            const folderRes = await fetchWithAuth(`https://www.googleapis.com/drive/v3/files?q=${qFolder}&fields=files(id,name)&pageSize=1&spaces=drive`);
            if (!folderRes.ok) throw new Error('Folder lookup failed');
            const folderJson = await folderRes.json();
            const folder = (folderJson.files || [])[0];
            if (!folder) { setImgSrc(null); return; }

            // list images in the folder
            const qFiles = encodeURIComponent(`'${folder.id}' in parents and mimeType contains 'image/' and trashed = false`);
            const listRes = await fetchWithAuth(`https://www.googleapis.com/drive/v3/files?q=${qFiles}&fields=files(id,name,mimeType,thumbnailLink)&pageSize=100&spaces=drive`);
            if (!listRes.ok) throw new Error('Files list failed');
            const listJson = await listRes.json();
            const files = listJson.files || [];
            if (!files.length) { setImgSrc(null); return; }

            const file = files[Math.floor(Math.random() * files.length)];

            // download file content using authenticated request and create object URL
            const mediaRes = await fetchWithAuth(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`);
            if (!mediaRes.ok) throw new Error('File download failed');
            const blob = await mediaRes.blob();
            // revoke previous URL
            if (objectUrlRef.current) {
                try { URL.revokeObjectURL(objectUrlRef.current); } catch (e) { }
            }
            const url = URL.createObjectURL(blob);
            objectUrlRef.current = url;
            setImgSrc(url);
        } catch (e) {
            console.error('Photos fetch error', e);
            setImgSrc(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!googleToken) return;
        // initial fetch
        fetchRandomFromKiosk();
        // set interval every 10 minutes
        intervalRef.current = window.setInterval(() => fetchRandomFromKiosk(), 10 * 60 * 1000);
        return () => {
            if (intervalRef.current) window.clearInterval(intervalRef.current);
            if (objectUrlRef.current) {
                try { URL.revokeObjectURL(objectUrlRef.current); } catch (e) { }
            }
        };
    }, [googleToken]);

    return (
        <section className="col-span-1 bg-white p-1 rounded shadow h-full flex flex-col">
            <div className="flex-1 rounded overflow-hidden flex items-center justify-center">
                {loading && <div className="text-xs text-gray-500">Loading...</div>}
                {!loading && !imgSrc && <div className="text-xs text-gray-500">No photos available or not logged in</div>}
                {imgSrc && (
                    <picture className="w-full h-full flex items-center justify-center">
                        <img src={imgSrc} alt="Kiosk photo" className="max-w-full max-h-full object-contain object-center" />
                    </picture>
                )}
            </div>
        </section>
    );
}
