import { z } from 'zod';
/**
 * Schema for a single table row (use case entry)
 */
export declare const tableRowSchema: z.ZodObject<{
    id: z.ZodString;
    use_case: z.ZodString;
    diagram: z.ZodOptional<z.ZodString>;
    required_context: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    required_tools: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    potential_interactions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    notes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    id: string;
    use_case: string;
    diagram?: string | undefined;
    required_context?: string[] | undefined;
    required_tools?: string[] | undefined;
    potential_interactions?: string[] | undefined;
    notes?: string[] | undefined;
}, {
    id: string;
    use_case: string;
    diagram?: string | undefined;
    required_context?: string[] | undefined;
    required_tools?: string[] | undefined;
    potential_interactions?: string[] | undefined;
    notes?: string[] | undefined;
}>;
/**
 * Schema for the complete table document
 */
export declare const tableDocumentSchema: z.ZodObject<{
    confluence_url: z.ZodOptional<z.ZodString>;
    table: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        use_case: z.ZodString;
        diagram: z.ZodOptional<z.ZodString>;
        required_context: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        required_tools: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        potential_interactions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        notes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        use_case: string;
        diagram?: string | undefined;
        required_context?: string[] | undefined;
        required_tools?: string[] | undefined;
        potential_interactions?: string[] | undefined;
        notes?: string[] | undefined;
    }, {
        id: string;
        use_case: string;
        diagram?: string | undefined;
        required_context?: string[] | undefined;
        required_tools?: string[] | undefined;
        potential_interactions?: string[] | undefined;
        notes?: string[] | undefined;
    }>, "many">;
    aiSessionId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    table: {
        id: string;
        use_case: string;
        diagram?: string | undefined;
        required_context?: string[] | undefined;
        required_tools?: string[] | undefined;
        potential_interactions?: string[] | undefined;
        notes?: string[] | undefined;
    }[];
    confluence_url?: string | undefined;
    aiSessionId?: string | undefined;
}, {
    table: {
        id: string;
        use_case: string;
        diagram?: string | undefined;
        required_context?: string[] | undefined;
        required_tools?: string[] | undefined;
        potential_interactions?: string[] | undefined;
        notes?: string[] | undefined;
    }[];
    confluence_url?: string | undefined;
    aiSessionId?: string | undefined;
}>;
/**
 * Schema for table document summary (used in list views)
 */
export declare const tableDocumentSummarySchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    directory: z.ZodString;
    useCaseCount: z.ZodNumber;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    confluence_url: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    directory: string;
    useCaseCount: number;
    createdAt: string;
    updatedAt: string;
    confluence_url?: string | undefined;
}, {
    id: string;
    name: string;
    directory: string;
    useCaseCount: number;
    createdAt: string;
    updatedAt: string;
    confluence_url?: string | undefined;
}>;
/**
 * TypeScript types inferred from Zod schemas
 */
export type TableRow = z.infer<typeof tableRowSchema>;
export type TableDocument = z.infer<typeof tableDocumentSchema>;
export type TableDocumentSummary = z.infer<typeof tableDocumentSummarySchema>;
