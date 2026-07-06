"use client";

import { usePage } from "../context/PageContext";

export default function ShoppingPage() {
    const { navigateTo } = usePage();

    return (
        <div className="h-[100vh] w-[100vw] flex flex-col items-center justify-center bg-gray-100 text-gray-900">
            <h1 className="text-5xl font-bold">Shopping Page</h1>

        </div>
    );
}
