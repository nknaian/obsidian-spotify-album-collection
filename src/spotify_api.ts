import axios from 'axios'

export class SpotifyApiAlbum {
    name: string;
    primary_artist: string;
    img_url: string;
    img_dimen: number;
    
    constructor(album_dict) {
        try {
            this.name = album_dict["name"];
            this.primary_artist = album_dict["artists"][0]["name"];
            this.img_url = album_dict["images"][0]["url"];
            this.img_dimen = album_dict["images"][0]["height"];
        } catch (error) {
            console.log(error);
            return;
        }
    }
}

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
    async get_spotify_album(album_id: string): Promise<SpotifyApiAlbum | null> {
		const auth_response = await axios.get(
		`${'https://api.spotify.com/v1/albums'}/${album_id}`,
		{
			headers: {
			'Authorization': `Bearer ${this.access_token}`,
			},
		}
		);
		
        return new SpotifyApiAlbum(auth_response.data);
    }
}