export default class DialogueScene extends Phaser.Scene {
    constructor() {
        super({ key: 'DialogueScene' });
    }

    preload() {
        this.load.image('kylePixel', 'assets/kyle_pixel.png'); // Load the character image
        this.load.image('kyleBackground', 'assets/galactic_quest_background.jpg'); // Load the background
        this.load.audio('pressStart', 'assets/sounds/mixkit-bonus-earned-in-video-game-2058.wav');
    }

    create() {
        // Add the background image with reduced opacity
        this.add.image(0, 0, 'kyleBackground')
            .setOrigin(0, 0) // Align to the top-left corner
            .setDisplaySize(this.cameras.main.width, this.cameras.main.height) // Scale to fit the screen
            .setAlpha(0.75); // Set opacity to 75% (reduced by 0.25)

        // Add the character image anchored to the bottom right
        const characterImage = this.add.image(this.cameras.main.width, this.cameras.main.height, 'kylePixel')
            .setScale(1.25) // Scale the image to fit the screen
            .setOrigin(1, 1); // Align to the bottom right corner

        // Add a text bubble for dialogue
        const bubbleWidth = this.scale.width * 0.45;
        const bubbleHeight = 210;
        const bubbleX = this.scale.width * 0.1;
        const bubbleY = this.scale.height - bubbleHeight - 200;

        const bubble = this.add.graphics();
        bubble.fillStyle(0xffffff, 1); // White background for the bubble
        bubble.lineStyle(4, 0x000000, 1); // Black border
        bubble.fillRoundedRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight, 20); // Rounded rectangle
        bubble.strokeRoundedRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight, 20);

        // Add a tail to the bubble
        bubble.beginPath();
        bubble.moveTo(bubbleX + bubbleWidth * 0.8, bubbleY + bubbleHeight);
        bubble.lineTo(bubbleX + bubbleWidth * 0.8 + 20, bubbleY + bubbleHeight + 20);
        bubble.lineTo(bubbleX + bubbleWidth * 0.8 - 20, bubbleY + bubbleHeight);
        bubble.closePath();
        bubble.fillPath();
        bubble.strokePath();

        // Add dialogue text inside the bubble with increased line height
        const dialogueText = this.add.text(
            bubbleX + 20, 
            bubbleY + 20, 
            "Get these free comics to the denizens of Lawrenceville!\n\nTime is of the essence!", 
            {
                font: '16px PressStart2P',
                fill: '#000000', // Black text color
                wordWrap: { width: bubbleWidth - 30 },
                lineSpacing: 10 // Add more line height
            }
        );

        // Add a "Continue" button at the bottom of the screen
        const continueButton = this.add.text(
            this.scale.width / 2, 
            this.cameras.main.height - 40, 
            'Continue', 
            {
                font: '20px PressStart2P',
                fill: '#ffffff',
                shadow: {
                    offsetX: 2,
                    offsetY: 2,
                    color: '#000000',
                    blur: 0,
                    stroke: true,
                    fill: true
                }
            }
        ).setOrigin(0.5);

        // Add interactivity to the continue button
        continueButton.setInteractive().on('pointerdown', () => {
            this.sound.play('pressStart'); // Play pressStart sound
            this.scene.start('MainScene'); // Start the main game
        });
    }
}
