import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
    try {
        console.log("Adding analysis_id to ai_analysis...");
        try {
            await query("ALTER TABLE ai_analysis ADD COLUMN analysis_id VARCHAR(50)");
            await query("ALTER TABLE ai_analysis ADD UNIQUE (analysis_id)");
        } catch (e: any) {
            console.log("ai_analysis analysis_id issue:", e.message);
        }

        console.log("Adding impacted_tables to ai_analysis...");
        try {
            await query("ALTER TABLE ai_analysis ADD COLUMN impacted_tables TEXT");
        } catch (e: any) {
            console.log("ai_analysis impacted_tables issue:", e.message);
        }

        console.log("Adding analysis_id to validated_incidents...");
        try {
            await query("ALTER TABLE validated_incidents ADD COLUMN analysis_id VARCHAR(50)");
            await query("ALTER TABLE validated_incidents ADD FOREIGN KEY (analysis_id) REFERENCES ai_analysis(analysis_id)");
        } catch (e: any) {
            console.log("validated_incidents issue:", e.message);
        }

        console.log("Migration done.");
        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error("Migration failed:", e);
        return NextResponse.json({ success: false, error: e.message });
    }
}
