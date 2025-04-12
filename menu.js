export default class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    preload() {
        this.load.image('menuBackground', 'assets/menuBackground.png'); // Load the menu background image
        this.load.audio('pressStart', 'assets/sounds/mixkit-bonus-earned-in-video-game-2058.wav');
        this.load.audio('select', 'assets/sounds/mixkit-player-jumping-in-a-video-game-2043.wav');
    }

    create() {
        // Add the background image
        this.add.image(0, 0, 'menuBackground').setOrigin(0, 0).setDisplaySize(this.scale.width, this.scale.height);

        // Add the game title with a slanted or off-balance effect
        const titleText = this.add.text(this.scale.width / 2, this.scale.height / 2 - 20, 'Crazy Courier', {
            font: '32px PressStart2P',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Create a gradient fill with more vertical space
        const gradient = titleText.context.createLinearGradient(0, -10, 0, 200);
        gradient.addColorStop(0, '#db4161');
        gradient.addColorStop(0.1, '#794100');
        gradient.addColorStop(0.15, '#495900');
        gradient.addColorStop(0.2, '#51a200');
        gradient.addColorStop(0.3, '#cbf382');
        gradient.addColorStop(0.7, '#cbf382');
        gradient.addColorStop(0.8, '#51a200');
        gradient.addColorStop(0.85, '#495900');
        gradient.addColorStop(0.9, '#794100');
        gradient.addColorStop(1, '#db4161');

        // Apply the gradient to the text
        titleText.setFill(gradient);
        titleText.setStroke('#DEDEDE', 12); // Add a black outline with a thickness of 12

        // Apply a slanted effect by rotating the text slightly
        titleText.setAngle(-6); // Rotate the text by -6 degrees

        // Add menu options with drop shadows
        const startText = this.add.text(this.scale.width / 2, this.scale.height / 2 + 60, 'Start', {
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

        // Add interactivity to menu options
        startText.setInteractive().on('pointerdown', () => {
            this.sound.play('pressStart'); // Play pressStart sound
            this.scene.start('DialogueScene'); // Transition to the dialogue screen
        });

        // Add an Instructions button
        const instructionsText = this.add.text(this.scale.width / 2, this.scale.height / 2 + 120, 'Instructions', {
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

        // Add interactivity to the Instructions button
        instructionsText.setInteractive().on('pointerdown', () => {
            this.sound.play('select'); // Play pressStart sound
            this.scene.start('InstructionsScene'); // Transition to the instructions screen
        });
    }
}
