export default class InstructionsScene extends Phaser.Scene {
    constructor() {
        super({ key: 'InstructionsScene' });
    }

    preload() {
        this.load.image('menuBackground', 'assets/menuBackground.png'); // Reuse the menu background
    }

    create() {
        // Add the background image
        this.add.image(0, 0, 'menuBackground').setOrigin(0, 0).setDisplaySize(this.scale.width, this.scale.height);

        // Add instructions text
        const instructionsText = this.add.text(this.scale.width / 2, this.scale.height / 2 - 50, 'Instructions', {
            font: '32px PressStart2P',
            fill: '#ffffff'
        }).setOrigin(0.5);

        const detailsText = this.add.text(this.scale.width / 2, this.scale.height / 2, 
            'Use arrow keys or WASD to move.\nBalance your character to avoid falling.\nDeliver comics to people to earn points.', {
            font: '16px PressStart2P',
            fill: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        // Adjust graphics for WASD and Arrow keys to align like a keyboard
        const wasdKeys = this.add.text(this.scale.width / 2 - 150, this.scale.height / 2 + 50, ' W \nA S D', {
            font: '20px PressStart2P',
            fill: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        const arrowKeys = this.add.text(this.scale.width / 2 + 150, this.scale.height / 2 + 50, '  ↑\n← ↓ →', {
            font: '20px PressStart2P',
            fill: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        // Add information about destinations and refill zones
        const additionalInfo = this.add.text(this.scale.width / 2, this.scale.height / 2 + 150, 
            'Bring comics to destinations for extra score and time.\nRefill comics at the refill zone.', {
            font: '16px PressStart2P',
            fill: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        // Add information about aiming and throwing
        const aimingInfo = this.add.text(this.scale.width / 2, this.scale.height / 2 + 200, 
            'Aim with the mouse pointer and throw with a click.\nOr throw in front of you with the spacebar.', {
            font: '16px PressStart2P',
            fill: '#ffffff',
            align: 'center'
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
            this.scene.start('MenuScene'); // Return to the main menu
        });
    }
}