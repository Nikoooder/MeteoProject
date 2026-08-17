

export interface Location {
    id: number;
    clientId?: string;
    name: string;
    latitude: number;
    longitude: number;
    creationDate?: string;
    userId?: number;
    updatedAt?: string;
    deletedAt?: string | null;
}
