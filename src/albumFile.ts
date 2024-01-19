import { Album } from './album';
import { Vault, TFile } from 'obsidian';

export class AlbumFile {
    vault: Vault;
    album: Album
    title: string;
    path: string;
    imgLink: string;
    file: TFile | null;

    constructor(vault: Vault, storagePath: string);
	constructor(vault: Vault, storagePath: string, album?: Album) {
		this.vault = vault;

        if (album === undefined) {
            // Create album object based on file contents.
            // Port concepts from albumNoteToSpotifyAlbum() to do this...
        } else {
            this.album = album;
        }

        this.title = `${this.album.name} by ${this.album.artists.join(", ")}.md`;
        this.path = `${storagePath}/${this.title}`;
        this.imgLink = `<a href="${this.album.url}"><img src="${this.album.image_url}" alt="Open Album Url"></a>`
        
        const file = this.vault.getAbstractFileByPath(this.path);
        if (file instanceof TFile) {
            this.file = file;
        } else {
            this.file = null;
        }
    
    }

    /**
     * Create a file for the album, with image link at the top, and a heading for notes below
     */
    async create(): Promise<TFile> {
		return this.vault.create(this.path, `\n${this.imgLink}\n\n# Notes:\n\n\n`);
    }
    // +get(vault, TFile): album | null
}