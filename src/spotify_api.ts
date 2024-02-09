import axios from 'axios'

/* Provides client credentials authorization and a selection of API endpoints */
export class SpotifyApi {
	accessToken: string;

    /* Initialize API with an access token using https://developer.spotify.com/documentation/web-api/tutorials/client-credentials-flow */
    async init(clientId: string, clientSecret: string) {
        // Convert client id and secret to base64-encoded string, falling back to the legacy btoa
        // function for the case where the NodeJS "Buffer" isn't available (i.e. mobile) 
        let authHeader: string;
        try {
            authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        } catch {
            authHeader = btoa(`${clientId}:${clientSecret}`);
        }

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
            const response = await axios.get<SpotifyAlbum>(
                `${'https://api.spotify.com/v1/albums'}/${id}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                    },
                }
            );

            return response.data;
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

    /* Get track data using https://developer.spotify.com/documentation/web-api/reference/get-an-albums-tracks */
    async albumTracks(id: string): Promise<SpotifyTrack[]> {
        try {
            const response = await axios.get<SpotifyAlbumTracks>(
                `https://api.spotify.com/v1/albums/${id}/tracks`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                    },
                }
            );
            return response.data.items;
        } catch (error) {
            console.log(error);
            throw new Error(`Spotify API failed to get album's tracks with id ${id}`);
        }
    }

    /* Get audio features for a list of tracks using https://developer.spotify.com/documentation/web-api/reference/get-several-audio-features */
    async tracksAudioFeatures(ids: string[]): Promise<SpotifyTrackAudioFeatures[]> {
        try {
            const response = await axios.get<SpotifyTracksAudioFeatures>(
                `https://api.spotify.com/v1/audio-features?ids=${ids.join(",")}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                    },
                }
            );
            return response.data.audio_features;
        } catch (error) {
            console.log(error);
            throw new Error("Spotify API failed to get tracks audio features");
        }
    }
}

/* Constants */
const SPOTIFY_ID_LENGTH = 22;
const SPOTIFY_ALBUM_URL_PREFIX = "https://open.spotify.com/album/";

/* Types */
export type SpotifyAlbumURL = `${typeof SPOTIFY_ALBUM_URL_PREFIX}${string}`;

/* Interfaces */
interface SpotifyAuth {
    access_token: string;
}

export interface SpotifyTrackAudioFeatures {
    acousticness: number;
    danceability: number;
    energy: number;
    instrumentalness: number;
    liveness: number;
    loudness: number;
    speechiness: number;
    tempo: number;
    valence: number;
    duration_ms: number;
}

interface SpotifyTracksAudioFeatures {
    audio_features: {
        acousticness: number;
        danceability: number;
        energy: number;
        instrumentalness: number;
        liveness: number;
        loudness: number;
        speechiness: number;
        tempo: number;
        valence: number;
        duration_ms: number;
    }[];
}

export interface SpotifyTrack {
    id: string;
    name: string;
    uri: string;
}
  
interface SpotifyAlbumTracks {
    items: {
        id: string;
        name: string;
        uri: string;
    }[];
}

export interface SpotifyAlbum {
    name?: string;
    release_date?: string;
    images?: { url: string }[];
    artists?: { name: string }[];
    genres?: { genre: string }[];
    id?: string;
    uri?: string;
    external_urls?: { spotify: string };
    album_type?: string;
}
