"use client";

import { usePage } from "../context/PageContext";

export default function HelloWorldPage() {
    const { navigateTo } = usePage();

    return (
        <div className="h-[100vh] w-[100vw] flex flex-col items-center justify-center bg-gray-100 text-gray-900">
            <h1 className="text-5xl font-bold">Hello World</h1>
            <button
                onClick={() => navigateTo('home')}
                className="mt-8 px-6 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition"
            >
                Back to Home
            </button>
        </div>
    );
}
