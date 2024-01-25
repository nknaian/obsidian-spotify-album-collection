import { App, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile, TFolder, Vault } from 'obsidian';

import { SpotifyApi, SpotifyAlbum, SpotifyTrackAudioFeatures, SpotifyAlbumURL } from './spotify_api';

import { albumNoteAudioFeatures, albumNoteImageLink, albumNoteTitle } from './album_note_format'

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
			id: 'import-album',
			name: 'Import Album',
			callback: async () => {
				const spotifyApi = new SpotifyApi();
				try {
					await spotifyApi.init(this.settings.spotifyClientId, this.settings.spotifyClientSecret);

					new ImportAlbumModal(this.app, spotifyApi, async (albumResult) => {
						// Set full path for file, with name being "album by artists"
						const filePath = `${this.settings.albumStoragePath}/${albumNoteTitle(albumResult)}.md`;

						// Check if this album file already exists.
						// If it does, then show a notice that it's already imported and open it
						// Otherwise, create the new file, filling it with information
						const file = app.vault.getAbstractFileByPath(filePath);
						if (file instanceof TFile) {
							new Notice(`Album with same name already imported. If this is a different album, please adjust the name of the existing note to differentiate them`);
							this.app.workspace.getLeaf().openFile(file);
						} else {
							// Create file, filling initially with image link and headings
							const newFile = await this.app.vault.create(filePath, `\n${albumNoteImageLink(albumResult)}\n\n`);
							this.app.workspace.getLeaf().openFile(newFile);
	
							// Append average Audio Features for the album
							if (albumResult.id !== undefined) {
								const albumTrackIds: string[] = (await spotifyApi.albumTracks(albumResult.id)).map(track => track.id);
								const albumTracksAudioFeatures: SpotifyTrackAudioFeatures[] = await spotifyApi.tracksAudioFeatures(albumTrackIds);
								this.app.vault.append(newFile, `${albumNoteAudioFeatures(albumTracksAudioFeatures)}\n\n\n`);
							}

							this.app.fileManager.processFrontMatter(newFile, async (fm) => {
								// Wow, this works! Now I want to figure out if there's a way to change the "type"
								// of property from here....ex: if I want to have "discovered date" in the properties...
								const firstArtist = albumResult.artists?.[0];
								if (firstArtist) {
									fm['Artist'] = albumResult ? `[[${firstArtist.name}]]` : '';

									const numArtists = albumResult.artists?.length;
									if (numArtists && numArtists > 1) {
										fm['Extra Artists'] = albumResult.artists?.slice(1).map(artist => artist.name).join(", ");
									}
								}
								fm['Release Date'] = albumResult.release_date;
								fm['Import Date'] = new Date().toISOString().split('T')[0];
							});

						}
					}).open();
				} catch (error) {
					new Notice(error, 10000);
				}
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

class ImportAlbumModal extends Modal {
	spotifyApi: SpotifyApi;
	spotifyUrl: SpotifyAlbumURL;
	albumResult: SpotifyAlbum;
	onSubmit: (albumResult: SpotifyAlbum) => void;

	constructor(app: App, spotifyApi: SpotifyApi, onSubmit: (albumResult: SpotifyAlbum) => void) {
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
				.setButtonText("Import")
				.setCta()
				.onClick(async () => {
					try {
						this.albumResult = await this.spotifyApi.albumFromUrl(this.spotifyUrl);
						this.onSubmit(this.albumResult);
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
		.setDesc('Path to import albums to')
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
