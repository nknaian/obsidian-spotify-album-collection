import axios from 'axios'

/* Provides client credentials authorization and a selection of API endpoints */
export class SpotifyApi {
	access_token: string;

    /* Initialize API with an access token using https://developer.spotify.com/documentation/web-api/tutorials/client-credentials-flow */
    async init(client_id: string, client_secret: string) {
        const auth_header = Buffer.from(`${client_id}:${client_secret}`).toString('base64');

        const auth_response = await axios.post(
			'https://accounts.spotify.com/api/token',
			'grant_type=client_credentials',
			{
				headers: {
				'Authorization': `Basic ${auth_header}`,
				'Content-Type': 'application/x-www-form-urlencoded',
				},
			}
		);

		this.access_token = auth_response.data.access_token;
    }

    /* Get album data using https://developer.spotify.com/documentation/web-api/reference/get-an-album */
    async album(id: string): Promise<SpotifyAlbum> {
        
        // Verify that id is the correct length
        if (id.length != SPOTIFY_ID_LENGTH) {
            throw new Error(`Invalid Spotify ID ${id} - expected string of length ${SPOTIFY_ID_LENGTH}`)
        }
        
        // Make API endpoint request
        try {
            const auth_response = await axios.get<SpotifyAlbum>(
                `${'https://api.spotify.com/v1/albums'}/${id}`,
                {
                    headers: {
                    'Authorization': `Bearer ${this.access_token}`,
                    },
                }
            );

            return auth_response.data;
        } catch (error) {
            throw new Error(`Spotify API failure getting album with id ${id}: ${error}`);
        }
    }
    async album_from_url(album_url: SpotifyAlbumURL): Promise<SpotifyAlbum> {
        const id_start_index = album_url.lastIndexOf('/') + 1;
        const album_id = album_url.substring(id_start_index, id_start_index+SPOTIFY_ID_LENGTH)

        return this.album(album_id);
    }
}

/* Constants */
const SPOTIFY_ID_LENGTH = 22;

/* Types */
type SpotifyAlbumURL = `https://open.spotify.com/album/${string}`;

/* Interfaces */
interface SpotifyAlbum {
    name: string;
    images: { url: string }[];
    artists: { name: string }[];
    id: string;
    uri: string;
}
