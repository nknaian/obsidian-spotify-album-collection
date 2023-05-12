import { App, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile } from 'obsidian';

import { SpotifyApi, SpotifyAlbum, SpotifyTrackAudioFeatures, SpotifyAlbumURL } from './spotify_api';

import { albumNoteAudioFeatures, albumNoteImage, albumNoteTitle, albumNoteUrl } from './album_note_format'

interface AlbumCollectionSettings {
	spotifyClientId: string;
	spotifyClientSecret: string;
	albumImportPath: string;
}

const DEFAULT_SETTINGS: AlbumCollectionSettings = {
	spotifyClientId: 'your-client-id',
	spotifyClientSecret: 'your-client-secret',
	albumImportPath: ''
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
						const filePath = `${this.settings.albumImportPath}/${albumNoteTitle(albumResult)}.md`;

						// Check if this album file already exists.
						// If it does, then show a notice that it's already imported and open it
						// Otherwise, create the new file, filling it with information
						const file = app.vault.getAbstractFileByPath(filePath);
						if (file instanceof TFile) {
							new Notice(`Album already imported`);
							this.app.workspace.getLeaf().openFile(file);
						} else {
							// Create file, filling initially with url, image and headings
							const newFile = await this.app.vault.create(filePath, `\n${albumNoteUrl(albumResult)}\n${albumNoteImage(albumResult)}\n\n# Notes:\n\n\n`);
							this.app.workspace.getLeaf().openFile(newFile);
	
							// Append average Audio Features for the album
							const albumTrackIds: string[] = (await spotifyApi.albumTracks(albumResult.id)).map(track => track.id);
							const albumTracksAudioFeatures: SpotifyTrackAudioFeatures[] = await spotifyApi.tracksAudioFeatures(albumTrackIds);
							this.app.vault.append(newFile, `# Audio Features:\n${albumNoteAudioFeatures(albumTracksAudioFeatures)}`);
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
				.setButtonText("Submit")
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
		.setName('Album Import Location')
		.setDesc('Path in vault to store imported albums')
		.addText(text => text
			.setPlaceholder('Enter path')
			.setValue(this.plugin.settings.albumImportPath)
			.onChange(async (value) => {
				console.log('Album Import Location set to: ' + value);
				this.plugin.settings.albumImportPath = value;
				await this.plugin.saveSettings();
			}));
	}
}
