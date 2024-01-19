import { App, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile, TFolder, Vault } from 'obsidian';

import { SpotifyApi, SpotifyAlbum, SpotifyTrackAudioFeatures, SpotifyAlbumURL } from './spotify_api';

import { AlbumFile }from './albumFile'

import { albumNoteAudioFeatures, albumNoteImageLink, albumNoteTitle, albumNoteToSpotifyAlbum } from './album_note_format'

interface AlbumCollectionSettings {
	spotifyClientId: string;
	spotifyClientSecret: string;
	albumStoragePath: string;
}

const DEFAULT_SETTINGS: AlbumCollectionSettings = {
	spotifyClientId: 'your-client-id',
	spotifyClientSecret: 'your-client-secret',
	albumStoragePath: ''
}

export default class AlbumCollectionPlugin extends Plugin {
	settings: AlbumCollectionSettings;

	async onload() {
		await this.loadSettings();

		// Add command to import an album
		this.addCommand({
			id: 'import-spotify-album',
			name: 'Import Spotify Album',
			callback: async () => {
				const spotifyApi = new SpotifyApi();
				try {
					await spotifyApi.init(this.settings.spotifyClientId, this.settings.spotifyClientSecret);

					new ImportSpotifyAlbumModal(this.app, spotifyApi, async (spotifyAlbum) => {
						// Create album from spotifyAlbum
						const album = null;

						// Initialize object for managing creation of album file
						const albumFile = new AlbumFile(this.app.vault, this.settings.albumStoragePath, album);

						// Check if this album file already exists.
						// If it does, then show a notice that it's already imported and open it
						// Otherwise, create the new file, filling it with information
						if (albumFile.file !== null) {
							new Notice(`Album already imported`);
							this.app.workspace.getLeaf().openFile(albumFile.file);
						} else {
							// Create file, filling initially with image link and headings
							const newFile = await this.app.vault.create(filePath, `\n${albumNoteImageLink(spotifyAlbum)}\n\n# Notes:\n\n\n`);
							this.app.workspace.getLeaf().openFile(newFile);
	
							// Append average Audio Features for the album
							if (spotifyAlbum.id !== undefined) {
								const albumTrackIds: string[] = (await spotifyApi.albumTracks(spotifyAlbum.id)).map(track => track.id);
								const albumTracksAudioFeatures: SpotifyTrackAudioFeatures[] = await spotifyApi.tracksAudioFeatures(albumTrackIds);
								this.app.vault.append(newFile, albumNoteAudioFeatures(albumTracksAudioFeatures));
							}

						}
					}).open();
				} catch (error) {
					new Notice(error, 10000);
				}
			}
		});

		// Add album collection visualization code block processing
		this.registerMarkdownCodeBlockProcessor("albumcollection", async (source, el, ctx) => {
			const storageFolder = this.app.vault.getAbstractFileByPath(this.settings.albumStoragePath);

			const albumGrid = el.createDiv();
			albumGrid.classList.add("album__grid");

			if (storageFolder instanceof TFolder) {
				Vault.recurseChildren(storageFolder, async (file: TFile) => {
					if (file instanceof TFile) {
						// Get the contents of each file
						const fileContents = await this.app.vault.cachedRead(file);
						const spotifyAlbum = albumNoteToSpotifyAlbum(file.name, fileContents);
						if (spotifyAlbum !== null) {
							const albumLink = albumGrid.createEl("a");
							albumLink.title = albumNoteTitle(spotifyAlbum);
							albumLink.href = spotifyAlbum.external_urls !== undefined ? spotifyAlbum.external_urls?.spotify : "";
							
							const albumImg = albumLink.createEl("img");
							albumImg.src = spotifyAlbum.images !== undefined ? spotifyAlbum.images[0].url : "";
							albumImg.alt = "Open in Spotify";
							albumImg.classList.add("album__grid__img")
						}
					}
				});
			}
		});

		// Add settings tab
		this.addSettingTab(new AlbumCollectionSettingTab(this.app, this));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class ImportSpotifyAlbumModal extends Modal {
	spotifyApi: SpotifyApi;
	spotifyUrl: SpotifyAlbumURL;
	spotifyAlbum: SpotifyAlbum;
	onSubmit: (spotifyAlbum: SpotifyAlbum) => void;

	constructor(app: App, spotifyApi: SpotifyApi, onSubmit: (spotifyAlbum: SpotifyAlbum) => void) {
		super(app);
		this.spotifyApi = spotifyApi;
		this.onSubmit = onSubmit;
	}

	async onOpen() {
		const {contentEl} = this;

		contentEl.createEl("h2", { text: "Import Spotify Album" });

		new Setting(contentEl)
			.setName("Album Url")
			.addText((text) =>
				text.onChange((value) => {
					this.spotifyUrl = value as SpotifyAlbumURL;
			}));
	
		new Setting(contentEl)
			.addButton((btn) => btn
				.setButtonText("Submit")
				.setCta()
				.onClick(async () => {
					try {
						this.spotifyAlbum = await this.spotifyApi.albumFromUrl(this.spotifyUrl);
						this.onSubmit(this.spotifyAlbum);
						this.close();
					} catch (error) {
						new Notice(error, 10000);
					}
				}));
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class AlbumCollectionSettingTab extends PluginSettingTab {
	plugin: AlbumCollectionPlugin;

	constructor(app: App, plugin: AlbumCollectionPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Spotify API Settings'});

		const description = containerEl.createEl('small', {text: 'You must create your own developer application first. See '});
		const spotifyApLink = containerEl.createEl('a');
		spotifyApLink.href = 'https://developer.spotify.com/documentation/web-api/concepts/apps';
		spotifyApLink.innerText = 'Spotify API guide for creating a developer app'
		description.append(spotifyApLink);

		new Setting(containerEl)
			.setName('Spotify API Client ID')
			.setDesc('The client ID for your spotify developer application')
			.addText(text => text
				.setPlaceholder('Enter your id')
				.setValue(this.plugin.settings.spotifyClientId)
				.onChange(async (value) => {
					console.log('Spotify Client ID set to: ' + value);
					this.plugin.settings.spotifyClientId = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Spotify API Client Secret')
			.setDesc('The client Secret for your spotify developer application')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.spotifyClientSecret)
				.onChange(async (value) => {
					console.log('Spotify Client Secret set to: ' + value);
					this.plugin.settings.spotifyClientSecret = value;
					await this.plugin.saveSettings();
				}));
		
		containerEl.createEl('h2', {text: 'Storage Settings'});

		new Setting(containerEl)
		.setName('Album Storage Location')
		.setDesc('Path in vault import and search for albums')
		.addText(text => text
			.setPlaceholder('Enter path')
			.setValue(this.plugin.settings.albumStoragePath)
			.onChange(async (value) => {
				console.log('Album Storage Location set to: ' + value);
				this.plugin.settings.albumStoragePath = value;
				await this.plugin.saveSettings();
			}));
	}
}
