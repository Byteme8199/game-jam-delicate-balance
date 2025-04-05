export default class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    preload() {
        this.load.image('menuBackground', 'assets/menuBackground.png'); // Load the menu background image
    }

    create() {
        // Add the background image
        this.add.image(0, 0, 'menuBackground').setOrigin(0, 0).setDisplaySize(this.scale.width, this.scale.height);

        // Add menu options
        const startText = this.add.text(this.scale.width / 2, this.scale.height / 2 - 50, 'Start', {
            font: '32px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);

        const highScoreText = this.add.text(this.scale.width / 2, this.scale.height / 2, 'High Score', {
            font: '32px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);

        const creditsText = this.add.text(this.scale.width / 2, this.scale.height / 2 + 50, 'Credits', {
            font: '32px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Add interactivity to menu options
        startText.setInteractive().on('pointerdown', () => {
            this.scene.start('MainScene'); // Start the main game
        });

        highScoreText.setInteractive().on('pointerdown', () => {
            console.log('High Score clicked'); // Placeholder for high score functionality
        });

        creditsText.setInteractive().on('pointerdown', () => {
            console.log('Credits clicked'); // Placeholder for credits functionality
        });
    }
}
