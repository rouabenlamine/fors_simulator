import { NextResponse } from 'next/server';
import { generateAnalysisWithOllama } from '@/lib/ai';

export async function POST(request: Request) {
    console.log('Incoming request to /api/analyze');
    try {
        const body = await request.json();
        const { title, description, ticket_number } = body;

        // Support both "title/description" and a single "text" field
        const finalTitle = title || ticket_number || 'New Analysis Request';
        const finalDesc = description || body.text || '';

        if (!finalDesc && !title) {
            return NextResponse.json({ error: 'title or description/text is required' }, { status: 400 });
        }

        console.log(`Analyzing: ${finalTitle}`);
        
        // Use the existing logic configured for phi3 in lib/ai.ts
        const result = await generateAnalysisWithOllama(finalTitle, finalDesc);

        return NextResponse.json({ 
            success: true, 
            analysis: result 
        });

    } catch (error: any) {
        console.error('Error in /api/analyze:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
