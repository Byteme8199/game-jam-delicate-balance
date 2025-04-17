export default class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(data) {
        this.isCheater = data.cheater || false; // Check if the player is a cheater
        this.finalScore = data.score || 0; // Retrieve the score passed from the main game
    }

    preload() {
        this.load.image('kyles_wife_Pixel', 'assets/kyles_wife_pixel.png'); // Load the character image
        this.load.image('kyleBackground', 'assets/galactic_quest_background.jpg'); // Load the background
        this.load.audio('pressStart', 'assets/sounds/mixkit-bonus-earned-in-video-game-2058.wav');
        this.load.audio('fallOver', 'assets/sounds/mixkit-player-losing-or-failing-2042.wav');
    }

    create() {
        // Add the background image
        this.sound.play('fallOver'); // Play fallOver sound
        this.add.image(0, 0, 'kyleBackground').setOrigin(0, 0).setDisplaySize(this.scale.width, this.scale.height);

        // Add the character image anchored to the bottom right
        const characterImage = this.add.image(this.cameras.main.width, this.cameras.main.height, 'kyles_wife_Pixel')
        .setScale(1.25) // Scale the image to fit the screen
        .setOrigin(1, 1); // Align to the bottom right corner

        // Add a text bubble for dialogue
        const bubbleWidth = this.scale.width * 0.45;
        const bubbleHeight = 210;
        const bubbleX = this.scale.width * 0.1;
        const bubbleY = this.scale.height / 2 - bubbleHeight ;

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
            "That's too bad, want to try again?\n\nYou can do better than that!", 
            {
                font: '16px PressStart2P',
                fill: '#000000', // Black text color
                wordWrap: { width: bubbleWidth - 30 },
                lineSpacing: 10 // Add more line height
            }
        );


        // Add Game Over text
        if(this.isCheater) {
            // If the player is a cheater, display a different message
            const cheaterText = this.add.text(this.scale.width / 2, this.scale.height / 2 + 70, 'Cheater!', {
                font: '30px PressStart2P',
                fill: '#ff0000', // Red color for cheater text
                shadow: {
                    offsetX: 2,
                    offsetY: 2,
                    color: '#000000',
                    blur: 0,
                    stroke: true,
                    fill: true
                }
            }).setOrigin(0.5);
        } else {
            const gameOverText = this.add.text(this.scale.width / 2, this.scale.height / 2 + 70, 'Game Over', {
                font: '30px PressStart2P',
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
        }

        // Display the final score
        const scoreText = this.add.text(this.scale.width / 2, this.scale.height / 2 + 100, `Your Score: ${this.finalScore}`, {
            font: '14px PressStart2P',
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

        // Add a Back to Menu button
        const menuButton = this.add.text(this.scale.width / 2, this.scale.height / 2 + 150, 'Try Again', {
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
            this.sound.play('pressStart'); // Play pressStart sound
            // just reload the page so everything resets properly
            window.location.reload(); // Reload the game
            //this.scene.start('MenuScene'); // Return to the main menu            
        });
    }
}