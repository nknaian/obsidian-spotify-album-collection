import axios from 'axios'

/* Provides client credentials authorization and a selection of API endpoints */
export class SpotifyApi {
	accessToken: string;

    /* Initialize API with an access token using https://developer.spotify.com/documentation/web-api/tutorials/client-credentials-flow */
    async init(clientId: string, clientSecret: string) {
        const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

        // Make request for API token with client credentials
        try {
            const authResponse = await axios.post<SpotifyAuth>(
                'https://accounts.spotify.com/api/token',
                'grant_type=client_credentials',
                {
                    headers: {
                    'Authorization': `Basic ${authHeader}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }
            );

            this.accessToken = authResponse.data.access_token;
        } catch (error) {
            console.log(error);
            throw new Error("Spotify API failed to initialize with your client credentials");
        }
    }

    /* Get album data using https://developer.spotify.com/documentation/web-api/reference/get-an-album */
    async album(id: string): Promise<SpotifyAlbum> {

        // Verify that id is the correct length
        if (id.length != SPOTIFY_ID_LENGTH) {
            throw new Error(`Invalid Spotify ID ${id}`)
        }

        // Make API endpoint request
        try {
            const authResponse = await axios.get<SpotifyAlbum>(
                `${'https://api.spotify.com/v1/albums'}/${id}`,
                {
                    headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    },
                }
            );

            return authResponse.data;
        } catch (error) {
            console.log(error);
            throw new Error(`Spotify API failed to get album with id ${id}`);
        }
    }
    async albumFromUrl(albumUrl: SpotifyAlbumURL): Promise<SpotifyAlbum> {
        const IdStartIndex = albumUrl.lastIndexOf('/') + 1;
        const albumId = albumUrl.substring(IdStartIndex, IdStartIndex+SPOTIFY_ID_LENGTH)

        return this.album(albumId);
    }
}

/* Constants */
const SPOTIFY_ID_LENGTH = 22;

/* Types */
export type SpotifyAlbumURL = `https://open.spotify.com/album/${string}`;

/* Interfaces */
interface SpotifyAuth {
    access_token: string;
}

export interface SpotifyAlbum {
    name: string;
    images: { url: string }[];
    artists: { name: string }[];
    id: string;
    uri: string;
}
