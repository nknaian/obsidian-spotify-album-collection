import { SpotifyAlbum, SpotifyTrackAudioFeatures } from './spotify_api'



export function albumNoteTitle(album: SpotifyAlbum): string {
    // Replace any excluded characters in the album name with hyphens
    const OBSIDIAN_TITLE_EXCLUDED_CHARS = /[\\/*?"<>|]/g;
    const albumName = album.name?.replace(OBSIDIAN_TITLE_EXCLUDED_CHARS, "-");

    return `${albumName} by ${album.artists?.map(artist => artist.name).join(", ")}`;
}

export function albumNoteImageLink(album: SpotifyAlbum): string {
    let imageUrl = undefined
    if (album.images !== undefined) {
        imageUrl = album.images[0].url;
    }

    return `<a href="${album.external_urls?.spotify}"><img src="${imageUrl}" alt="Open in Spotify"></a>`
}

/* Get a SpotifyAlbum object from an album note file */
export function albumNoteToSpotifyAlbum(name: string, content: string): SpotifyAlbum | null {
    // Get album name and artists from the name of the file
    const fileNameRegex = new RegExp(`(.+) by (.+)`);
    const fileNameMatch = name.match(fileNameRegex);

    // Get album url and image url from the body of content of the file
    const fileContentRegex = new RegExp(`<a href="(.+)"><img src="(.+)" alt="Open in Spotify"></a>`)
    const fileContentMatch = content.match(fileContentRegex);

    // Turn matches into a SpotifyAlbum object
    const albumNameAndArtists: SpotifyAlbum | null = fileNameMatch ? {
        name: fileNameMatch[1],
        artists: fileNameMatch[2].split(", ").map(name => ({ name }))
    } : null
    if (albumNameAndArtists !== null) {
        const albumUrlAndImage: SpotifyAlbum | null = fileContentMatch ? {
            external_urls: { spotify: fileContentMatch[1] },
            images: [
                { url: fileContentMatch[2]}
            ]
        } : null

        if (albumUrlAndImage === null) {
            return albumNameAndArtists;
        } else {
            return { ...albumNameAndArtists, ...albumUrlAndImage };
        }
    }

    return null;
}

/* Get average audio features for the album from array of track audio features */
export function albumNoteAudioFeatures(albumTracksAudioFeatures: SpotifyTrackAudioFeatures[]): string {
    const numTracks = albumTracksAudioFeatures.length;
    let sumAcousticness = 0;
    let sumDanceability = 0;
    let sumEnergy = 0;
    let sumInstrumentalness = 0;
    let sumLiveness = 0;
    let sumLoudness = 0;
    let sumSpeechiness = 0;
    let sumTempo = 0;
    let sumValence = 0;

    // Loop through each track in the response object and add up the audio feature values
    albumTracksAudioFeatures.forEach(track => {
        sumAcousticness += track.acousticness;
        sumDanceability += track.danceability;
        sumEnergy += track.energy;
        sumInstrumentalness += track.instrumentalness;
        sumLiveness += track.liveness;
        sumLoudness += track.loudness;
        sumSpeechiness += track.speechiness;
        sumTempo += track.tempo;
        sumValence += track.valence;
    });

    // Divide by the total number of tracks to get the average values for each audio feature
    const avgAcousticness = sumAcousticness / numTracks;
    const avgDanceability = sumDanceability / numTracks;
    const avgEnergy = sumEnergy / numTracks;
    const avgInstrumentalness = sumInstrumentalness / numTracks;
    const avgLiveness = sumLiveness / numTracks;
    const avgLoudness = sumLoudness / numTracks;
    const avgSpeechiness = sumSpeechiness / numTracks;
    const avgTempo = sumTempo / numTracks;
    const avgValence = sumValence / numTracks;

    // Construct a string containing the averaged values for each audio feature
    let avgString = `Acousticness: ${avgAcousticness.toFixed(2)}\n`;
    avgString += `Danceability: ${avgDanceability.toFixed(2)}\n`;
    avgString += `Energy: ${avgEnergy.toFixed(2)}\n`;
    avgString += `Instrumentalness: ${avgInstrumentalness.toFixed(2)}\n`;
    avgString += `Liveness: ${avgLiveness.toFixed(2)}\n`;
    avgString += `Loudness: ${avgLoudness.toFixed(2)}\n`;
    avgString += `Speechiness: ${avgSpeechiness.toFixed(2)}\n`;
    avgString += `Tempo: ${avgTempo.toFixed(2)}\n`;
    avgString += `Valence: ${avgValence.toFixed(2)}`;

    return `# Average [Audio Features](https://developer.spotify.com/documentation/web-api/reference/get-audio-features)\n${avgString}`;
}