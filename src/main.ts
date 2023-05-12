import { App, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile } from 'obsidian';

import { SpotifyApi, SpotifyAlbum, SpotifyAlbumURL } from './spotify_api';

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
				new ImportAlbumModal(this.app, this.settings, async (albumResult) => {
					// Set full path for file, with name being "album by artists"
					const filePath = `${this.settings.albumImportPath}/${albumResult?.name} by ${albumResult?.artists.map(artist => artist.name).join(", ")}.md`;

					// Check if this album file already exists.
					// If it does, then show a notice that it's already imported and open it
					// Otherwise, create the new file, filling with API data, and then open it
					const file = app.vault.getAbstractFileByPath(filePath);
					if (file instanceof TFile) {
						new Notice(`Album already imported`);
						this.app.workspace.getLeaf().openFile(file);
					} else {
						const newFile = await this.app.vault.create(filePath, `[Open in Spotify](${albumResult.external_urls.spotify})\n\n![album image](${albumResult.images[0].url})\n\n# Review\n`);
						this.app.workspace.getLeaf().openFile(newFile);
					}
				}).open();
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
	settings: AlbumCollectionSettings;
	spotifyUrl: SpotifyAlbumURL;
	albumResult: SpotifyAlbum;
	onSubmit: (albumResult: SpotifyAlbum) => void;

	constructor(app: App, settings: AlbumCollectionSettings, onSubmit: (albumResult: SpotifyAlbum) => void) {
		super(app);
		this.settings = settings;
		this.onSubmit = onSubmit;
	}

	async onOpen() {
		const {contentEl} = this;

		// Initialize spotify api token
		const spotifyApi = new SpotifyApi();
		try {
			await spotifyApi.init(this.settings.spotifyClientId, this.settings.spotifyClientSecret);
		} catch (error) {
			new Notice(error, 10000);
			this.close();
		}

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
						this.albumResult = await spotifyApi.albumFromUrl(this.spotifyUrl);
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
