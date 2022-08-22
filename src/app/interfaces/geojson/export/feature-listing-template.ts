export interface FeatureListingTemplate
{
    title: string;
    columns: Array<string>;
    sortColumn: string;
    sortMode: "asc" | "desc";
    created_at:string;
    updated_at:string;
}
