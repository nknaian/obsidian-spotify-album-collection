export interface Album {
    service: string;
    name: string;
    url: string;
    image_url: string;
    artists: string[];
    features: Record<string, unknown>;
}
