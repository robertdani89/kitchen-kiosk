import { NextResponse } from "next/server";
import { exec } from "child_process";

function runCommand(cmd: string): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
        exec(cmd, (err, stdout, stderr) => {
            if (err) return reject(err);
            resolve({ stdout: stdout ?? "", stderr: stderr ?? "" });
        });
    });
}

export async function POST(req: Request) {
    // feature flag: require server-side enable
    const enabled = (String(process.env.ENABLE_MOVEMENT_MONITOR || process.env.NEXT_PUBLIC_ENABLE_MOVEMENT_MONITOR || "").toLowerCase() === "1") || (String(process.env.ENABLE_MOVEMENT_MONITOR || process.env.NEXT_PUBLIC_ENABLE_MOVEMENT_MONITOR || "").toLowerCase() === "true");
    if (!enabled) {
        return NextResponse.json({ error: "movement monitor disabled" }, { status: 403 });
    }
    try {
        const body = await req.json().catch(() => ({}));
        const action = body?.action;
        if (!action || (action !== "on" && action !== "off")) {
            return NextResponse.json({ error: "invalid action" }, { status: 400 });
        }

        const onCmd = process.env.MONITOR_ON_CMD || "DISPLAY=:0 xrandr --output HDMI-1 --auto";
        const offCmd = process.env.MONITOR_OFF_CMD || "DISPLAY=:0 xrandr --output HDMI-1 --off";
        const cmd = action === "on" ? onCmd : offCmd;

        try {
            const { stdout, stderr } = await runCommand(cmd);
            return NextResponse.json({ status: "ok", stdout, stderr });
        } catch (e: any) {
            return NextResponse.json({ error: String(e) }, { status: 500 });
        }
    } catch (e: any) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
