"use client";

import { useCallback, useEffect, useState } from "react";
import { useGoogleAuth } from "../context/GoogleAuthContext";
import { useKeyEvent } from "../context/KeyEventContext";
import { useRotaryEvent } from "../context/RotaryEventContext";

interface DriveFile {
    id: string;
    name: string;
}

export default function Custom() {
    const { googleToken, fetchWithAuth } = useGoogleAuth();
    const [htmlFiles, setHtmlFiles] = useState<DriveFile[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [pageContents, setPageContents] = useState<Record<string, string>>({});

    // Fetch the kiosk-pages folder and list all HTML files
    useEffect(() => {
        if (!googleToken) return;

        async function fetchKioskPages() {
            try {
                const folderRes = await fetchWithAuth(
                    `https://www.googleapis.com/drive/v3/files?q=name%3D'kiosk-pages'+and+mimeType%3D'application%2Fvnd.google-apps.folder'+and+trashed%3Dfalse&fields=files(id%2Cname)`
                );
                if (!folderRes.ok) return;
                const folderData = await folderRes.json();
                const folder: DriveFile | undefined = folderData.files?.[0];
                if (!folder) return;

                const filesRes = await fetchWithAuth(
                    `https://www.googleapis.com/drive/v3/files?q='${folder.id}'+in+parents+and+mimeType%3D'text%2Fhtml'+and+trashed%3Dfalse&fields=files(id%2Cname)&orderBy=name`
                );
                if (!filesRes.ok) return;
                const filesData = await filesRes.json();
                setHtmlFiles(filesData.files ?? []);
                setCurrentIndex(0);
            } catch (e) {
                console.error("CustomPage: failed to fetch kiosk-pages", e);
            }
        }

        fetchKioskPages();
    }, [googleToken]);

    // Fetch HTML content of the current page (cache already-loaded ones)
    useEffect(() => {
        const file = htmlFiles[currentIndex];
        if (!file || pageContents[file.id] !== undefined) return;

        async function loadContent() {
            try {
                const res = await fetchWithAuth(
                    `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`
                );
                if (!res.ok) return;
                const html = await res.text();
                setPageContents(prev => ({ ...prev, [file.id]: html }));
            } catch (e) {
                console.error("CustomPage: failed to load page content", e);
            }
        }

        loadContent();
    }, [currentIndex, htmlFiles, googleToken]);

    const goNext = useCallback(() => {
        if (htmlFiles.length === 0) return;
        setCurrentIndex(prev => (prev + 1) % htmlFiles.length);
    }, [htmlFiles.length]);

    const goPrev = useCallback(() => {
        if (htmlFiles.length === 0) return;
        setCurrentIndex(prev => (prev - 1 + htmlFiles.length) % htmlFiles.length);
    }, [htmlFiles.length]);

    const { subscribe: subscribeKey, unsubscribe: unsubscribeKey } = useKeyEvent();
    const { subscribe: subscribeRotary, unsubscribe: unsubscribeRotary } = useRotaryEvent();

    const currentFile = htmlFiles[currentIndex];
    const currentContent = currentFile ? pageContents[currentFile.id] : undefined;

    useEffect(() => {
        const id = subscribeKey(10, (e) => {
            if (htmlFiles.length === 0) return false;
            if (e.key === "ArrowRight") {
                if (currentIndex < htmlFiles.length - 1) { goNext(); return true; }
                return false;
            }
            if (e.key === "ArrowLeft") {
                if (currentIndex > 0) { goPrev(); return true; }
                return false;
            }
            return false;
        });
        return () => unsubscribeKey(id);
    }, [subscribeKey, unsubscribeKey, goNext, goPrev, currentIndex, htmlFiles.length]);

    useEffect(() => {
        const id = subscribeRotary(10, (action) => {
            if (htmlFiles.length === 0) return false;
            if (action === "rotate_right") {
                if (currentIndex < htmlFiles.length - 1) { goNext(); return true; }
                return false;
            }
            if (action === "rotate_left") {
                if (currentIndex > 0) { goPrev(); return true; }
                return false;
            }
            return false;
        });
        return () => unsubscribeRotary(id);
    }, [subscribeRotary, unsubscribeRotary, goNext, goPrev, currentIndex, htmlFiles.length]);

    return (
        <div className="h-[100vh] w-[100vw] bg-white">
            {currentContent ? (
                <iframe
                    key={currentFile?.id}
                    srcDoc={currentContent}
                    className="w-full h-full border-0"
                    sandbox="allow-scripts allow-same-origin allow-forms"
                    title={currentFile?.name}
                />
            ) : null}
        </div>
    );
}
