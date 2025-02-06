import { Notice } from 'obsidian';
import { SpotifyAlbum, SpotifyTrack, } from './spotify_api'


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
