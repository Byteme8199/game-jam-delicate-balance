export default class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(data) {
        this.finalScore = data.score || 0; // Retrieve the score passed from the main game
    }

    preload() {
        this.load.image('menuBackground', 'assets/menuBackground.png'); // Reuse the menu background
    }

    create() {
        // Add the background image
        this.add.image(0, 0, 'menuBackground').setOrigin(0, 0).setDisplaySize(this.scale.width, this.scale.height);

        // Add Game Over text
        const gameOverText = this.add.text(this.scale.width / 2, this.scale.height / 2 - 100, 'Game Over', {
            font: '48px PressStart2P',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Display the final score
        const scoreText = this.add.text(this.scale.width / 2, this.scale.height / 2, `Your Score: ${this.finalScore}`, {
            font: '24px PressStart2P',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Add a Restart button
        const restartButton = this.add.text(this.scale.width / 2, this.scale.height / 2 + 100, 'Restart', {
            font: '24px PressStart2P',
            fill: '#ffffff',
            shadow: {
                offsetX: 2,
                offsetY: 2,
                color: '#000000',
                blur: 0,
                stroke: true,
                fill: true
            }
        }).setOrigin(0.5);

        // Add interactivity to the Restart button
        restartButton.setInteractive().on('pointerdown', () => {
            this.scene.start('MainScene'); // Restart the main game
        });

        // Add a Back to Menu button
        const menuButton = this.add.text(this.scale.width / 2, this.scale.height / 2 + 150, 'Back to Menu', {
            font: '24px PressStart2P',
            fill: '#ffffff',
            shadow: {
                offsetX: 2,
                offsetY: 2,
                color: '#000000',
                blur: 0,
                stroke: true,
                fill: true
            }
        }).setOrigin(0.5);

        // Add interactivity to the Menu button
        menuButton.setInteractive().on('pointerdown', () => {
            this.scene.start('MenuScene'); // Return to the main menu
        });
    }
}