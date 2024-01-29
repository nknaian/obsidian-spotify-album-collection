import { Notice } from 'obsidian';
import { SpotifyAlbum, SpotifyTrackAudioFeatures } from './spotify_api'


export function albumNoteTitle(album: SpotifyAlbum): string {
    // Replace any excluded characters in the album name with hyphens
    const OBSIDIAN_TITLE_EXCLUDED_CHARS = /[\\/*?"<>:|]/g;
    const albumName = album.name?.replace(OBSIDIAN_TITLE_EXCLUDED_CHARS, "-");

    if (albumName == undefined) {
        new Notice(`Unable to get album name from Spotify API`);
        return "";
    } else {
        return albumName;
    }
}

export function albumNoteImageLink(album: SpotifyAlbum): string {
    let imageUrl = undefined
    if (album.images !== undefined) {
        imageUrl = album.images[0].url;
    }

    return `<a href="${album.external_urls?.spotify}"><img src="${imageUrl}" alt="Open in Spotify"></a>`
}

/* Get average audio features for the album from array of track audio features and return
   an text representation, utilizing progress bars to represent 0-1 values
*/
export function albumNoteAudioFeatures(albumTracksAudioFeatures: SpotifyTrackAudioFeatures[]): { [key: string]: string }  {
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
    const result: { [key: string]: string } = {
        acousticness: (sumAcousticness / numTracks).toFixed(2),
        danceability: (sumDanceability / numTracks).toFixed(2),
        energy: (sumEnergy / numTracks).toFixed(2),
        instrumentalness: (sumInstrumentalness / numTracks).toFixed(2),
        liveness: (sumLiveness / numTracks).toFixed(2),
        speechiness: (sumSpeechiness / numTracks).toFixed(2),
        valence: (sumValence / numTracks).toFixed(2),
        loudness_dB: (sumLoudness / numTracks).toFixed(2),
        tempo_bpm: (sumTempo / numTracks).toFixed(0)
    };

    return result;
}

/* Get total length of album in minutes from track lengths
*/
export function albumNoteAlbumLengthMins(albumTracksAudioFeatures: SpotifyTrackAudioFeatures[]): string {
    let length_min = 0;
    
    albumTracksAudioFeatures.forEach(track => {
        length_min += (track.duration_ms / 60000);
    });

    return length_min.toFixed(0);
}