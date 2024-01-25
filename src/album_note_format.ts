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


    // <ul>
    // <!-- https://developer.spotify.com/documentation/web-api/reference/get-audio-features-->
    // <li><i>Danceability:</i> <progress id="numeric-value" min="0" max="1" value="0.2">70%</progress></li>
    // <li> Loudness: <i>-9.35 dB</i></li>
    // <li>Energy: <progress id="numeric-value" min="0" max="1" value="0.62">70%</progress></li>
    // <li>Tempo: <i>121.78 BPM</i></li>
    // </ul>

    // Construct a string containing the averaged values for each audio feature
    let text = "| [Audio Feature](https://developer.spotify.com/documentation/web-api/reference/get-audio-features) | Average Value |\n";
    text += "| ---- | ---- |\n"
    text += `| Acousticness | <progress min="0" max="1" value="${avgAcousticness.toFixed(2)}"></progress> |\n`;
    text += `| Danceability | <progress min="0" max="1" value="${avgDanceability.toFixed(2)}"></progress> |\n`;
    text += `| Energy | <progress min="0" max="1" value="${avgEnergy.toFixed(2)}"></progress> |\n`;
    text += `| Instrumentalness | <progress min="0" max="1" value="${avgInstrumentalness.toFixed(2)}"></progress> |\n`;
    text += `| Liveness | <progress min="0" max="1" value="${avgLiveness.toFixed(2)}"></progress> |\n`;
    text += `| Speechiness | <progress min="0" max="1" value="${avgSpeechiness.toFixed(2)}"></progress> |\n`;
    text += `| Valence | <progress min="0" max="1" value="${avgValence.toFixed(2)}"></progress> |\n`;
    text += `| Loudness | ${avgLoudness.toFixed(2)} dB |\n`;
    text += `| Tempo | ${avgTempo.toFixed(0)} BPM |`;

    return text;
}