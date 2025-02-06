import { Notice } from 'obsidian';
import { SpotifyAlbum, SpotifyTrack, SpotifyTrackAudioFeatures } from './spotify_api'


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

export function albumNoteContent(tracks: SpotifyTrack[], cover_image: string, spotify_url: string): string {
    const album_link_md = `[![Open in Spotify](${cover_image})](${spotify_url})`
    const track_list = tracks?.map(track => `- ${track.name}`).join('\n');

    return `\n${album_link_md}\n\n## Track List\n${track_list}\n## Notes\n`
}

/* Get average audio features for the album from array of track audio features and return
   an text representation, utilizing progress bars to represent 0-1 values
   AUDIO FEATURES ENDPOINT HAS BEEN DEPCREIATED
*/
export function albumNoteAudioFeatures(albumTracksAudioFeatures: SpotifyTrackAudioFeatures[]): { [key: string]: number }  {
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
    const result: { [key: string]: number } = {
        acousticness: Number((sumAcousticness / numTracks).toFixed(2)),
        danceability: Number((sumDanceability / numTracks).toFixed(2)),
        energy: Number((sumEnergy / numTracks).toFixed(2)),
        instrumentalness: Number((sumInstrumentalness / numTracks).toFixed(2)),
        liveness: Number((sumLiveness / numTracks).toFixed(2)),
        speechiness: Number((sumSpeechiness / numTracks).toFixed(2)),
        valence: Number((sumValence / numTracks).toFixed(2)),
        loudness_dB: Number((sumLoudness / numTracks).toFixed(2)),
        tempo_bpm: Number((sumTempo / numTracks).toFixed(0))
    };

    return result;
}

/* Get total length of album in minutes from track lengths
*/
export function albumNoteAlbumLengthMins(spotifyTracks: SpotifyTrack[]): number {
    let length_min = 0;
    
    spotifyTracks.forEach(track => {
        length_min += (track.duration_ms / 60000);
    });

    return Number(length_min.toFixed(0));
}