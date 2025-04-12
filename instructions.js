export default class InstructionsScene extends Phaser.Scene {
    constructor() {
        super({ key: 'InstructionsScene' });
    }

    preload() {
        this.load.image('menuBackground', 'assets/menuBackground.png'); // Reuse the menu background
        this.load.audio('pressStart', 'assets/sounds/mixkit-bonus-earned-in-video-game-2058.wav');
        this.load.audio('select', 'assets/sounds/mixkit-player-jumping-in-a-video-game-2043.wav');
    }

    create() {
        // Add the background image
        this.add.image(0, 0, 'menuBackground').setOrigin(0, 0).setDisplaySize(this.scale.width, this.scale.height);

        // Add instructions text
        const instructionsText = this.add.text(this.scale.width / 2, this.scale.height / 2 - 150, 'Instructions', {
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

        const detailsText = this.add.text(this.scale.width / 2, this.scale.height / 2 - 100, 
            'Use direction buttons to move.\nBalance your character to avoid falling.', {
            font: '14px PressStart2P',
            fill: '#ffffff',
            align: 'center',
            shadow: {
                offsetX: 2,
                offsetY: 2,
                color: '#000000',
                blur: 0,
                stroke: true,
                fill: true
            }
        }).setOrigin(0.5);

        // Adjust graphics for WASD and Arrow keys to align like a keyboard
        const wasdKeys = this.add.text(this.scale.width / 2 - 100, this.scale.height / 2 - 40, ' W \nA S D', {
            font: '20px PressStart2P',
            fill: '#ffffff',
            align: 'center',
            shadow: {
                offsetX: 2,
                offsetY: 2,
                color: '#000000',
                blur: 0,
                stroke: true,
                fill: true
            }
        }).setOrigin(0.5);

        const arrowKeys = this.add.text(this.scale.width / 2 + 100, this.scale.height / 2 - 40, '  ↑\n← ↓ →', {
            font: '20px PressStart2P',
            fill: '#ffffff',
            align: 'center',
            shadow: {
                offsetX: 2,
                offsetY: 2,
                color: '#000000',
                blur: 0,
                stroke: true,
                fill: true
            }
        }).setOrigin(0.5);

        // Add information about destinations and refill zones
        const additionalInfo = this.add.text(this.scale.width / 2, this.scale.height / 2 + 20, 
            'Deliver comics for score and extra time.\nRefill comics at the refill zone.', {
            font: '14px PressStart2P',
            fill: '#ffffff',
            align: 'center',
            shadow: {
                offsetX: 2,
                offsetY: 2,
                color: '#000000',
                blur: 0,
                stroke: true,
                fill: true
            }
        }).setOrigin(0.5);

        // Add information about aiming and throwing
        const aimingInfo = this.add.text(this.scale.width / 2, this.scale.height / 2 + 70, 
            'Aim with mouse / throw with click.', {
            font: '14px PressStart2P',
            fill: '#ffffff',
            align: 'center',
            shadow: {
                offsetX: 2,
                offsetY: 2,
                color: '#000000',
                blur: 0,
                stroke: true,
                fill: true
            }
        }).setOrigin(0.5);

        // Add a Back button
        const backButton = this.add.text(this.scale.width / 2, this.scale.height / 2 + 100, 'Back', {
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

        // Move the Back button to the bottom
        backButton.setPosition(this.scale.width / 2, this.scale.height - 50);

        // Add interactivity to the Back button
        backButton.setInteractive().on('pointerdown', () => {
            this.sound.play('select'); // Play pressStart sound
            this.scene.start('MenuScene'); // Return to the main menu
        });
    }
}