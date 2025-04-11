import MenuScene from './menu.js';
import DialogueScene from './dialogue.js'; // Import the new DialogueScene
import { entities } from './entities.js';
import { getRandomName } from './utils.js'; // Import utility for generating random names

const config = {
    type: Phaser.WEBGL,
    width: window.innerWidth, // Set to window width
    height: window.innerHeight, // Set to window height
    parent: 'game', // ID of the HTML element to attach the game
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    pixelArt: true,
    scene: [MenuScene, DialogueScene, { key: 'MainScene', preload, create, update }],
};

const game = new Phaser.Game(config);

let player;
let balanceMeter = 0; // Balance meter value
let startingX = 1600; // Example starting X position, 9560 comic store
let startingY = 4300; // Example starting Y position, 5841 comic store
let balanceThresholdLeft = -100; // Threshold for falling over to the left
let balanceThresholdRight = 100; // Threshold for falling over to the right
let projectiles; // Group for projectiles
let cursorIcon; // Icon to indicate the mouse cursor position
let score = 0; // Player's score
let comics = 20; // Player starts with 10 comics
let maxComics = 20; // Maximum number of comics
let momentum = 0; // Player's forward momentum
const maxMomentum = 300; // Maximum momentum
const momentumIncrease = 5; // Momentum increase per frame when pedaling
const glideFriction = 5; // Friction applied when gliding
let refillTween; // Tween for the pulsating effect
let cursorTween; // Tween for the cursor's pulsating effect
let canMoveForward = true; // Flag to control forward movement
let balanceIndicator; // Graphics object for the balance indicator
let comicCovers = []; // Array to store comic cover keys
let mouseMoveTimer; // Timer to track mouse movement
let goingBackward; // Flag to indicate if the player is moving backward
const mouseHideDelay = 100; // Delay in milliseconds before hiding the cursor
const worldBaseWidth = 1441; // Width of the world
const worldBaseHeight = 821; // Height of the world
let debugMode = false; // Flag to enable debug mode, set to false by default
let minimap; // Declare minimap globally
let people = []; // Declare people array globally
let minimapPeopleIndicators = []; // Declare minimapPeopleIndicators globally

const globalScale = 10;

let coordinateArray = []; // Array to store coordinates
let lastPlayerPersonCollisionTime = 0; // Track the last collision time globally
let lastInputTime = 0; // Tracks the last time input was detected globally

// Sets the number of comics the player has, ensuring it stays within valid bounds.
// Updates the comic count display and inventory UI.
function setComics(value) {
    comics = Phaser.Math.Clamp(value, 0, maxComics);
    if (this.comicsText) {
        this.comicsText.setText(`Comics: ${comics}`);
    }
    if (this.updateComicInventory) {
        this.updateComicInventory();
    }
}

// Preloads assets such as images for the player, background, and comic covers.
function preload() {
    this.load.image('player', 'assets/player.png'); // Placeholder asset
    this.load.image('background', 'assets/background.png'); // Background image

    // Load textures for collidable objects
    this.load.image('balanceIndicator', 'assets/balanceIndicator.png');

    // Load multiple comic cover images
    this.load.image('comic1', 'assets/comic1.png');
    this.load.image('comic2', 'assets/comic2.png');
    this.load.image('comic3', 'assets/comic3.png');
    this.load.image('comic4', 'assets/comic4.png');

    // Store the keys in the comicCovers array
    comicCovers = ['comic1', 'comic2', 'comic3', 'comic4'];

    this.load.audio('pressStart', 'assets/sounds/mixkit-bonus-earned-in-video-game-2058.wav');
    this.load.audio('runIntoEntityCar', 'assets/sounds/mixkit-explainer-video-game-alert-sweep-236.wav');
    this.load.audio('backgroundMusic', 'assets/sounds/mixkit-game-level-music-689.wav');
    this.load.audio('runIntoEntityBuilding', 'assets/sounds/mixkit-mechanical-crate-pick-up-3154.wav');
    this.load.audio('throwComic', 'assets/sounds/mixkit-player-jumping-in-a-video-game-2043.wav');
    this.load.audio('fallOver', 'assets/sounds/mixkit-player-losing-or-failing-2042.wav');
    this.load.audio('crashIntoPerson', 'assets/sounds/mixkit-video-game-blood-pop-2361.wav');
    this.load.audio('comicReceive', 'assets/sounds/mixkit-video-game-health-recharge-2837.wav');
    this.load.audio('comicPickup', 'assets/sounds/mixkit-video-game-treasure-2066.wav');
    this.load.audio('outOfAmmo', 'assets/sounds/mixkit-video-game-retro-click-237.wav');
    this.load.audio('gameOver', 'assets/sounds/mixkit-winning-a-coin-video-game-2069.wav');
}

// Initializes the game world, player, UI elements, and entities.
// Sets up input handling, minimap, and collision detection.
function create() {
    // Add the background image and set it to cover the entire map
    this.mapContainer = this.add.container(0, 0);

    // Add the background image (not transparent)
    this.background = this.add.image(0, 0, 'background').setOrigin(0, 0);
    this.background.setScale(globalScale);
    this.mapContainer.add(this.background);

    // Set world bounds to match the scaled background image size
    const worldWidth = worldBaseWidth * globalScale;
    const worldHeight = worldBaseHeight * globalScale;
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

    // Resize the camera bounds to match the world bounds
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);

    // Add the player sprite
    const playerSprite = this.add.sprite(0, 0, 'player'); // Centered in the container

    // Add the balance indicator image
    const balanceIndicatorImage = this.add.image(-50, 0, 'balanceIndicator'); // Positioned behind the player
    balanceIndicatorImage.setOrigin(0.5, 0.5); // Center the image
    balanceIndicatorImage.setAngle(90); // Rotate the balance indicator image by 90 degrees

    // Create the balance indicator graphics for the marker
    balanceIndicator = this.add.graphics();
    balanceIndicator.setDepth(2); // Ensure it is rendered above the balance indicator image

    // Create a container to group the player, balance indicator image, and marker
    player = this.add.container(startingX, startingY, [playerSprite, balanceIndicatorImage, balanceIndicator]);
    this.physics.world.enable(player); // Enable physics for the container
    player.setSize(playerSprite.displayWidth, playerSprite.displayHeight); // Set the container's size for collisions
    player.body.setCollideWorldBounds(true); // Prevent the container from leaving the world bounds

    // Store references for later use
    player.sprite = playerSprite;
    player.balanceIndicatorImage = balanceIndicatorImage;

    // Make the camera follow the container
    this.cameras.main.startFollow(player);

    // Ensure the background does not tile or wrap
    // background.setDisplaySize(worldWidth, worldHeight);

    // Create the cursors object for keyboard input
    this.cursors = this.input.keyboard.createCursorKeys();

    // Add WASD keys for movementd
    this.wasd = {
        up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    };

    // Add a key listener for the spacebar
    this.spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Add a key listener for the ENTER key to toggle debugMode
    this.input.keyboard.on('keydown-ENTER', () => {
        debugMode = !debugMode; // Toggle debugMode
        console.log(`Debug mode: ${debugMode ? 'ON' : 'OFF'}`); // Log the current state
        this.textContainer.setVisible(debugMode);
        this.scoreText.setVisible(true); // Always show the score text
    });

    // Dynamically create mapped objects
    entities.forEach(entity => {
        if (entity.vertices) {
            const entityGraphics = this.add.graphics();
            entityGraphics.beginPath();

            // Move to the first vertex
            const firstVertex = entity.vertices[0];
            entityGraphics.moveTo(firstVertex.x, firstVertex.y);

            // Draw lines to the remaining vertices
            entity.vertices.forEach(vertex => {
                entityGraphics.lineTo(vertex.x, vertex.y);
            });

            // Close the path and fill the shape
            entityGraphics.closePath();
            entityGraphics.fillStyle(0x808080, 1); // Gray color for entities
            entityGraphics.fillPath();
            this.mapContainer.add(entityGraphics);

            // Add red dots on each vertex
            const dots = [];
            entity.vertices.forEach(vertex => {
                const dot = this.add.circle(vertex.x, vertex.y, 5, 0xff0000); // Red dot with radius 5
                dot.setDepth(2); // Ensure the dot is above the entity
                this.mapContainer.add(dot);
                dots.push(dot);
            });

            // Store the graphics and dots for toggling visibility
            entity.graphics = entityGraphics;
            entity.dots = dots;

            // Store the entity for manual collision handling
            entity.polygon = new Phaser.Geom.Polygon(entity.vertices.map(v => [v.x, v.y]).flat());
        }
    });

    // Set the player's depth to ensure it renders above roads, intersections, and grassy areas
    player.setDepth(1);

    // Create a container for all the top-left text
    const textContainer = this.add.container(10, 10).setScrollFactor(0);

    // Add text to display the balance meter (for debugging or UI purposes)
    this.balanceText = this.add.text(0, 0, 'Balance: 0', {
        font: '16px Arial',
        fill: '#ffffff'
    });
    textContainer.add(this.balanceText);

    // Add text to display the player's coordinates
    this.coordsText = this.add.text(0, 20, 'X: 0, Y: 0', {
        font: '16px Arial',
        fill: '#ffffff'
    });
    textContainer.add(this.coordsText);

    // Create a circular minimap camera
    const minimapRadius = 60; // Reduced radius by 20% (previously 75)
    minimap = this.cameras.add(
        this.cameras.main.width - minimapRadius * 2 - 10, // X position (top-right corner)
         10, // Y position
        minimapRadius * 2, // Width
        minimapRadius * 2 // Height
    );

    // Set the minimap to follow the player and show the entire world
    minimap.setBounds(0, 0, this.physics.world.bounds.width, this.physics.world.bounds.height);
    minimap.startFollow(player);

    // Apply a zoom level to the minimap to make it smaller
    minimap.setZoom(0.03);

    // Add a circular mask to the minimap
    const minimapMask = this.add.graphics();
    minimapMask.fillStyle(0xffffff, 1);
    minimapMask.fillCircle(
        minimap.x + minimapRadius, // Center X
        minimap.y + minimapRadius, // Center Y
        minimapRadius // Radius
    );
    minimap.setMask(new Phaser.Display.Masks.GeometryMask(this, minimapMask));

    // Add text to display the player's score
    this.scoreText = this.add.text(
        minimap.x + minimap.width / 2, // Centered horizontally under the minimap
        minimap.y + minimap.height + 10, // Positioned 10px below the minimap
        'Score: 0', 
        {
            font: '16px Arial',
            fill: '#ffffff'
        }
    ).setOrigin(0.5, 0); // Centered horizontally and aligned to the top
    this.scoreText.setScrollFactor(0); // Ensure it stays fixed relative to the minimap

    // Add text to display the player's comic count
    this.comicsText = this.add.text(0, 60, `Comics: ${comics}`, {
        font: '16px Arial',
        fill: '#ffffff'
    });
    textContainer.add(this.comicsText);

    // Add text to display debug information for the hovered object
    this.hoveredObjectText = this.add.text(0, 80, 'Hovered Object: None', {
        font: '16px Arial',
        fill: '#ffffff'
    });
    textContainer.add(this.hoveredObjectText);

    // Add text to display the cursor's coordinates
    this.cursorCoordsText = this.add.text(0, 100, 'Cursor: X: 0, Y: 0', {
        font: '16px Arial',
        fill: '#ffffff'
    });
    textContainer.add(this.cursorCoordsText);

    // Add text to display the backward movement status
    this.backwardText = this.add.text(0, 140, 'Going Backward: No', {
        font: '16px Arial',
        fill: '#ffffff'
    });
    textContainer.add(this.backwardText);

    this.vertexDebugText = this.add.text(0, 120, 'Vertex: None', {
        font: '16px Arial',
        fill: '#ff0000'
    });
    textContainer.add(this.vertexDebugText);

    // Store the text container for toggling visibility later
    this.textContainer = textContainer;
    this.textContainer.setVisible(debugMode); // Show/hide other debug text
    this.scoreText.setVisible(true); // Always show the score text

    // Bind the setComics function to the scene
    this.setComics = setComics.bind(this);

    // Create a group for projectiles
    projectiles = this.physics.add.group();

    // Ensure projectiles is initialized before accessing its children
    if (!projectiles) {
        console.error("Projectiles group is not initialized.");
        return;
    }

    // Create a cursor as a small empty circle with a red border
    cursorIcon = this.add.graphics();
    cursorIcon.lineStyle(2, 0xff0000, 0.8); // Thin red border with 80% opacity
    cursorIcon.strokeCircle(0, 0, 10); // Circle with radius 10
    cursorIcon.setVisible(false); // Initially hidden

    // Add a tween for the default pulsating effect
    cursorTween = this.tweens.add({
        targets: cursorIcon,
        scale: { from: 1, to: 1.2 }, // Pulsate between normal size and 1.2x size
        duration: 800, // Duration of the pulsation
        yoyo: true, // Reverse the tween to create a pulsating effect
        repeat: -1, // Repeat indefinitely
        ease: 'Sine.easeInOut'
    });

    // Enable mouse input and track movement
    this.input.on('pointermove', (pointer) => {
        cursorIcon.setPosition(pointer.worldX, pointer.worldY).setVisible(true);

        // Update the cursor coordinates text
        this.cursorCoordsText.setText(`Cursor: X: ${Math.floor(pointer.worldX)}, Y: ${Math.floor(pointer.worldY)}`);

        // Reset the mouse movement timer
        if (mouseMoveTimer) {
            clearTimeout(mouseMoveTimer);
        }
        mouseMoveTimer = setTimeout(() => {
            cursorIcon.setVisible(false); // Hide the cursor after inactivity
        }, mouseHideDelay);

        // Check if the cursor is over an object
        const hoveredObject = entities.find(entity => {
            if (entity.polygon) {
                return Phaser.Geom.Polygon.Contains(entity.polygon, pointer.worldX, pointer.worldY);
            }
            return false;
        });

        if (hoveredObject) {
            // Update the debug text with the hovered object's details
            this.hoveredObjectText.setText(`Hovered Object: ${hoveredObject.type}\nDescription: ${hoveredObject.description}`);
        } else {
            // Reset the debug text if no object is hovered
            this.hoveredObjectText.setText('Hovered Object: None');
        }

        // Check if the cursor is over an object that needs comics
        const hoveredComicObject = entities.find(entity => {
            if (entity.polygon && entity.needsComic) {
                return Phaser.Geom.Polygon.Contains(entity.polygon, pointer.worldX, pointer.worldY);
            }
            return false;
        });

        if (hoveredComicObject) {
            // Change cursor to green, make it bigger, and pulse faster
            cursorIcon.clear();
            cursorIcon.lineStyle(2, 0x00ff00, 0.8); // Green border with 80% opacity
            cursorIcon.strokeCircle(0, 0, 12); // Slightly larger circle

            // Update the tween for faster pulsation
            cursorTween.stop();
            cursorTween = this.tweens.add({
                targets: cursorIcon,
                scale: { from: 1, to: 1.3 }, // Pulsate between normal size and 1.3x size
                duration: 400, // Faster pulsation
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        } else {
            // Reset cursor to red, normal size, and default pulsation
            cursorIcon.clear();
            cursorIcon.lineStyle(2, 0xff0000, 0.8); // Red border with 80% opacity
            cursorIcon.strokeCircle(0, 0, 10); // Default circle size

            // Update the tween for default pulsation
            cursorTween.stop();
            cursorTween = this.tweens.add({
                targets: cursorIcon,
                scale: { from: 1, to: 1.2 }, // Pulsate between normal size and 1.2x size
                duration: 800, // Default pulsation speed
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        // Check if the cursor is near any vertex
        let vertexFound = false;
        entities.forEach(entity => {
            if (entity.vertices) {
                entity.vertices.forEach(vertex => {
                    const distance = Phaser.Math.Distance.Between(pointer.worldX, pointer.worldY, vertex.x, vertex.y);
                    if (distance <= 10) { // If the cursor is within 10 pixels of the vertex
                        this.vertexDebugText.setText(`Vertex: X: ${vertex.x}, Y: ${vertex.y}`);
                        vertexFound = true;
                    }
                });
            }
        });

        if (!vertexFound) {
            this.vertexDebugText.setText('Vertex: None');
        }
    });

    // Copy cursor coordinates to clipboard on mouse click
    this.input.on('pointerdown', (pointer) => {
        const coordinates = `{ x: ${Math.floor(pointer.worldX)}, y: ${Math.floor(pointer.worldY)} }`;

        if (this.input.keyboard.checkDown(this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ALT))) {
            // Add coordinates to the array if ALT is pressed
            coordinateArray.push(coordinates);
            console.log(`Added to array: ${coordinates}`);
        } else {
            // Throw a projectile on mouse click
            throwProjectile.call(this, pointer.worldX, pointer.worldY); // Bind `this` to the scene
        }
    });

    // Copy the array to the clipboard when ALT is released
    this.input.keyboard.on('keyup-ALT', () => {
        if (coordinateArray.length > 0) {
            const arrayString = '{ type: "", vertices: [' + coordinateArray.join() + '] },';
            const textarea = document.createElement('textarea');
            textarea.value = arrayString;
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand('copy');
                console.log(`Copied array to clipboard:\n${arrayString}`);
            } catch (err) {
                console.error('Failed to copy array to clipboard', err);
            }
            document.body.removeChild(textarea);

            // Clear the array after copying
            coordinateArray = [];
        }
    });

    // Add the refill zone as an entity
    const refillZoneEntity = {
        type: 'refillZone',
        x: 9560,
        y: 5841,
        radius: 30
    };
    entities.push(refillZoneEntity);

    // Create the refill zone graphics
    const refillZoneGraphics = this.add.circle(refillZoneEntity.x, refillZoneEntity.y, refillZoneEntity.radius, 0x00ff00, 1);
    this.physics.add.existing(refillZoneGraphics, true); // Make it a static physics object
    refillZoneEntity.graphics = refillZoneGraphics;

    // Add a pulsating effect to the refill zone
    refillZoneEntity.tween = this.tweens.add({
        targets: refillZoneGraphics,
        scale: { from: 1, to: 1.2 }, // Pulsate between normal size and 1.2x size
        duration: 800, // Duration of the pulsation
        yoyo: true, // Reverse the tween to create a pulsating effect
        repeat: -1, // Repeat indefinitely
        ease: 'Sine.easeInOut'
    });

    // Bind the fallDown function to the scene
    this.fallDown = fallDown.bind(this);

    // Ensure textContainer exists before ignoring it in the minimap
    if (this.textContainer) {
        minimap.ignore(this.textContainer);
    }

    // Ignore the normal character sprite. Replace with a large yellow arrow that rotates with the player
    if (player) {
        minimap.ignore(player);

        const arrow = this.add.graphics();
        arrow.fillStyle(0xffff00, 1); // Yellow color
        arrow.lineStyle(2, 0x000000, 1); // Black outline
        arrow.beginPath();
        arrow.moveTo(0, -8); // Point of the arrow
        arrow.lineTo(-6, 8); // Left side of the arrow
        arrow.lineTo(6, 8); // Right side of the arrow
        arrow.lineTo(0, -8); // Back to the point
        arrow.closePath();
        arrow.fillPath();
        arrow.strokePath();

        // Add the arrow to a container for minimap-specific elements
        const minimapArrow = this.add.container(player.x, player.y, [arrow]);
        minimapArrow.setScale(30); // Scale the arrow for visibility in the minimap
        minimapArrow.setDepth(1); // Ensure it appears above other minimap elements

        // Update the arrow's position and rotation to match the player
        this.events.on('update', () => {
            minimapArrow.setPosition(player.x, player.y);
            minimapArrow.setRotation(player.rotation + Math.PI / 2); // Rotate the arrow to point in the direction of the player
        });

        // Ignore the arrow in the main camera but show it in the minimap
        this.cameras.main.ignore(minimapArrow);
    }

    // Add a circular border around the minimap for better visibility
    const minimapBorder = this.add.graphics();
    minimapBorder.lineStyle(2, 0xffffff, 1); // White border
    minimapBorder.strokeCircle(
        minimap.x + minimapRadius, // Center X
        minimap.y + minimapRadius, // Center Y
        minimapRadius // Radius
    );
    minimapBorder.setScrollFactor(0); // Ensure the border stays fixed on the screen

    // Add a graphics object to visualize the player's collision shape
    const playerCollisionGraphics = this.add.graphics();
    playerCollisionGraphics.setDepth(2); // Ensure it renders above other objects

    // Store the graphics object for later updates
    player.collisionGraphics = playerCollisionGraphics;

    // Define the player's collision shape as a thin diamond
    player.collisionShape = [
        { x: 0, y: -player.body.height / 4 }, // Top (narrower height)
        { x: player.body.width / 1.5, y: 0 },    // Right (narrower width)
        { x: 0, y: player.body.height / 4 }, // Bottom (narrower height)
        { x: -player.body.width / 1.5, y: 0 }    // Left (narrower width)
    ];

    // Disable the right-click browser menu
    this.input.mouse.disableContextMenu();

    // Add a timer for the game
    this.timeLeft = 180; // 3 minutes (180 seconds)
    this.time.addEvent({
        delay: 1000, // Decrease time every second
        callback: () => {
            this.timeLeft--;
            if (this.timeLeft <= 0) {
                this.endGame(false); // End the game when the timer reaches zero
            }
        },
        loop: true
    });

    // Add a function to end the game
    this.endGame = (won) => {
        this.scene.pause(); // Pause the game
        backgroundMusic.stop(); // Stop the background music
        this.sound.play('gameOver'); // Play gameOver sound
        const message = won ? 'You Win!' : 'Time\'s Up!';
        const finalScore = `Final Score: ${score}`;

        // Display the end game message
        this.add.text(this.scale.width / 2, this.scale.height / 2 - 40, message, {
            font: '32px PressStart2P',
            fill: won ? '#FFFFFF' : '#F0F0F0',
            shadow: {
                offsetX: 2,
                offsetY: 2,
                color: '#000000',
                blur: 0,
                stroke: true,
                fill: true
            }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(100); // Ensure the text is on the top layer

        // Display the final score
        this.add.text(this.scale.width / 2, this.scale.height / 2 + 10, finalScore, {
            font: '20px PressStart2P',
            fill: '#FFFFFF',
            shadow: {
                offsetX: 1,
                offsetY: 1,
                color: '#000000',
                blur: 0,
                stroke: true,
                fill: true
            }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(100);

        // Add a "Restart" button
        const restartButton = this.add.text(this.scale.width / 2, this.scale.height / 2 + 60, 'Restart', {
            font: '20px PressStart2P',
            fill: '#FFFFFF',
            shadow: {
                offsetX: 2,
                offsetY: 2,
                color: '#000000',
                blur: 0,
                stroke: true,
                fill: true
            }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(100);

        // Add interactivity to the restart button
        restartButton.setInteractive().on('pointerdown', () => {
            this.sound.play('pressStart'); // Play pressStart sound
            console.log('Restart')
            // Reset all variables to their initial defaults
            score = 0;
            comics = 10;
            momentum = 0;
            balanceMeter = 0;
            this.timeLeft = 180;

            // Clear all active tweens and timers to prevent freezing
            this.tweens.killAll();
            this.time.removeAllEvents();

            // Transition to the dialogue screen
            this.scene.stop('MainScene');
            this.scene.start('DialogueScene');
        });
    };

    // Add a destination point
    this.currentDestination = this.add.circle(
        Phaser.Math.Between(100, this.physics.world.bounds.width - 100), // Random X position within world bounds
        Phaser.Math.Between(100, this.physics.world.bounds.height - 100), // Random Y position within world bounds
        20, 
        0xff0000, 
        1
    ); // Red circle for the destination
    this.physics.add.existing(this.currentDestination, true); // Make it a static physics object

    // Add a pulsating effect to the destination point
    this.tweens.add({
        targets: this.currentDestination,
        scale: { from: 1, to: 1.5 }, // Pulsate between normal size and 1.5x size
        duration: 800, // Duration of the pulsation
        yoyo: true, // Reverse the tween to create a pulsating effect
        repeat: -1, // Repeat indefinitely
        ease: 'Sine.easeInOut'
    });

    // Add a minimap indicator for the destination
    const destinationIndicator = this.add.graphics();
    destinationIndicator.fillStyle(0xff0000, 1); // Red color
    destinationIndicator.fillCircle(0, 0, 5); // Small circle for the minimap indicator
    const minimapDestination = this.add.container(this.currentDestination.x, this.currentDestination.y, [destinationIndicator]);
    minimapDestination.setDepth(1); // Ensure it appears above other minimap elements
    minimapDestination.setScale(30); // Scale the indicator for visibility in the minimap

    // Update the minimap indicator's position to match the destination
    this.events.on('update', () => {
        const destinationX = this.currentDestination.x;
        const destinationY = this.currentDestination.y;

        const minimapBounds = minimap.worldView;
        const isInsideMinimap = minimapBounds.contains(destinationX, destinationY);

        if (isInsideMinimap) {
            // If the destination is within the minimap bounds, position it normally
            minimapDestination.setPosition(destinationX, destinationY);
        } else {
            // If the destination is outside the minimap bounds, position it closer to the inner edge
            const angle = Phaser.Math.Angle.Between(
                minimapBounds.centerX,
                minimapBounds.centerY,
                destinationX,
                destinationY
            );

            const offset = 250; // Offset to keep the indicator closer to the inner edge
            const halfWidth = minimapBounds.width / 2 - offset;
            const halfHeight = minimapBounds.height / 2 - offset;

            const edgeX = minimapBounds.centerX + Math.cos(angle) * halfWidth;
            const edgeY = minimapBounds.centerY + Math.sin(angle) * halfHeight;

            minimapDestination.setPosition(edgeX, edgeY);
        }
    });

    // Ignore the minimap indicator in the main camera but show it in the minimap
    this.cameras.main.ignore(minimapDestination);

    // Add a main map indicator for the destination
    const mainMapIndicator = this.add.graphics();
    mainMapIndicator.fillStyle(0xff0000, 1); // Red color
    mainMapIndicator.fillCircle(0, 0, 15); // Increased size for better visibility
    const mainMapDestination = this.add.container(this.currentDestination.x, this.currentDestination.y, [mainMapIndicator]);
    mainMapDestination.setDepth(1); // Ensure it appears above other elements

    // Update the main map indicator's position to stick to the visible camera bounds
    this.events.on('update', () => {
        const destinationX = this.currentDestination.x;
        const destinationY = this.currentDestination.y;

        const cameraBounds = this.cameras.main.worldView;

        // Check if the destination is within the visible camera bounds
        const isInsideCamera = cameraBounds.contains(destinationX, destinationY);

        if (isInsideCamera) {
            // If the destination is within the camera bounds, position it normally
            mainMapDestination.setPosition(destinationX, destinationY);
        } else {
            // If the destination is outside the camera bounds, position it on the closest edge
            const dx = destinationX - cameraBounds.centerX;
            const dy = destinationY - cameraBounds.centerY;

            // Calculate the scale factor to bring the point to the edge of the rectangular camera
            const scaleX = cameraBounds.width / 2 / Math.abs(dx);
            const scaleY = cameraBounds.height / 2 / Math.abs(dy);
            const scale = Math.min(scaleX, scaleY) * 0.9; // Reduce by 10% to move closer to the player

            // Calculate the clamped position
            const clampedX = cameraBounds.centerX + dx * scale;
            const clampedY = cameraBounds.centerY + dy * scale;

            mainMapDestination.setPosition(clampedX, clampedY);
        }
    });

    // Add a segmented progress bar for the timer
    const progressBarWidth = this.cameras.main.width * 0.8; // 80% of the camera width
    const progressBarHeight = 20; // Height of each segment
    const segmentCount = 30; // Number of segments
    const segmentSpacing = 2; // Spacing between segments
    const segmentWidth = (progressBarWidth - (segmentCount - 1) * segmentSpacing) / segmentCount;

    this.timerSegments = [];
    const progressBarX = this.cameras.main.width * 0.1; // Centered horizontally (10% offset on each side)
    const progressBarY = this.cameras.main.height * 0.95 - progressBarHeight; // 5% offset from the bottom

    for (let i = 0; i < segmentCount; i++) {
        const segment = this.add.rectangle(
            progressBarX + i * (segmentWidth + segmentSpacing),
            progressBarY,
            segmentWidth,
            progressBarHeight,
            0x00ff00 // Green color for active segments
        )
        .setOrigin(0, 0.5)
        .setScrollFactor(0) // Ensure the progress bar stays fixed relative to the camera
        .setDepth(2); // Set depth to ensure it appears in front of the comic inventory
        this.timerSegments.push(segment);

        // Ignore the timer segment in the minimap
        minimap.ignore(segment);
    }

    // Initialize the timer
    this.timeLeft = 180; // 3 minutes (180 seconds)
    this.timePerSegment = this.timeLeft / segmentCount; // Time each segment represents

    this.time.addEvent({
        delay: 1000, // Decrease time every second
        callback: () => {
            this.timeLeft--;
            const activeSegments = Math.ceil(this.timeLeft / this.timePerSegment);

            // Update the progress bar segments
            this.timerSegments.forEach((segment, index) => {
                if (index < activeSegments) {
                    segment.setFillStyle(0x00ff00); // Green for active segments
                } else {
                    segment.setFillStyle(0xff0000); // Red for empty segments
                }
            });

            if (this.timeLeft <= 0) {
                this.endGame(false); // End the game when the timer reaches zero
            }
        },
        loop: true
    });

    // Dynamically create 100 "People" objects
    people = []; // Initialize the global people array
    minimapPeopleIndicators = []; // Initialize the array in the create function

    for (let i = 0; i < 100; i++) {
        let person;
        let isColliding;

        // Ensure the person is not generated inside another collidable object
        do {
            const x = Phaser.Math.Between(100, this.physics.world.bounds.width - 100);
            const y = Phaser.Math.Between(100, this.physics.world.bounds.height - 100);

            person = {
                name: getRandomName(), // Assign a random human name
                x,
                y,
                destination: {
                    x: Phaser.Math.Between(100, this.physics.world.bounds.width - 100),
                    y: Phaser.Math.Between(100, this.physics.world.bounds.height - 100)
                },
                hasComic: false // Track if the person has been given a comic
            };

            // Check for collision with existing entities
            isColliding = entities.some(entity => {
                if (entity.polygon) {
                    return checkCirclePolygonCollision({ x: person.x, y: person.y, radius: 20 }, entity.polygon);
                }
                return false;
            });
        } while (isColliding);

        // Add the person to the entities list
        entities.push({
            type: 'person',
            vertices: [{ x: person.x - 10, y: person.y - 10 }, { x: person.x + 10, y: person.y - 10 }, { x: person.x + 10, y: person.y + 10 }, { x: person.x - 10, y: person.y + 10 }],
            name: person.name,
            destination: person.destination
        });
        
        // Create the graphics for the person in the main camera
        const bodyWidth = Phaser.Math.Between(15, 25); // Random width for the body
        const bodyHeight = Phaser.Math.Between(25, 35); // Random height for the body
        const headRadius = Phaser.Math.Between(8, 12); // Random radius for the head

        

        const body = this.add.ellipse(0, 0, bodyWidth, bodyHeight, 0x00ff00); // Oval for the body
        const head = this.add.circle(0, -bodyHeight / 2 - headRadius / 2, headRadius, null); // Circle for the head
        // 
        // // Generate a random human skin color
        const skinColors = [
            0xffcc99, // Light skin tone
            0xf1c27d, // Medium-light skin tone
            0xe0ac69, // Medium skin tone
            0xc68642, // Medium-dark skin tone
            0x8d5524  // Dark skin tone
        ];
        const randomSkinColor = Phaser.Utils.Array.GetRandom(skinColors);
        head.setFillStyle(randomSkinColor); // Apply the random skin color

        // Adjust the head position to be in the middle of the body
        head.setPosition(0, 0); // Center the head within the body

        const personContainer = this.add.container(person.x, person.y, [body, head]);
        this.physics.world.enable(personContainer); // Enable physics for the person
        personContainer.body.setCollideWorldBounds(true); // Prevent the person from leaving the world bounds
        personContainer.name = person.name; // Attach the name to the container for easy lookup
        personContainer.hasComic = false; // Track if the person has been given a comic
        people.push(personContainer); // Add the person container to the global people array

        // Add a circle to represent the person on the minimap
        const minimapIndicator = this.add.graphics();
        minimapIndicator.fillStyle(0x00ff00, 1); // Green for people who need comics
        minimapIndicator.lineStyle(2, 0x000000, 1); // Thin black border
        minimapIndicator.fillCircle(0, 0, 5); // Circle with radius 5
        minimapIndicator.strokeCircle(0, 0, 5); // Add the border
        minimapIndicator.setPosition(person.x, person.y);
        minimapIndicator.setScale(15); // Scale up the minimap indicator for better visibility
        minimapPeopleIndicators.push(minimapIndicator); // Add to the global array

        // Ignore the minimap indicator in the main camera but show it in the minimap
        this.cameras.main.ignore(minimapIndicator);
    }

    // Update people movement toward their destinations
    this.time.addEvent({
        delay: 50, // Update every 50ms
        callback: () => {
            people.forEach((person, index) => {
                // Find the corresponding entity in the entities list
                const entity = entities.find(e => e.type === 'person' && e.name === person.name);
                if (entity && entity.destination) {
                    const target = entity.destination;
                    const angle = Phaser.Math.Angle.Between(person.x, person.y, target.x, target.y);
                    const speed = 20; // Movement speed

                    // Ensure person.body exists before setting velocity
                    if (person.body) {
                        person.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
                    }

                    // Stop moving if the person reaches the destination
                    if (Phaser.Math.Distance.Between(person.x, person.y, target.x, target.y) < 5) {
                        if (person.body) {
                            person.body.setVelocity(0, 0);
                        }
                    }

                    // Update the minimap indicator's position to match the person's position
                    minimapPeopleIndicators[index].setPosition(person.x, person.y);
                }
            });
        },
        loop: true
    });

    // Create a container for the comic inventory
    const inventoryContainer = this.add.container(this.cameras.main.width / 2, this.cameras.main.height - 60).setScrollFactor(0);

    // Add a background for the inventory
    const inventoryBackground = this.add.graphics();
    inventoryBackground.fillStyle(0x000000, 0.5); // Semi-transparent black
    inventoryBackground.fillRect(-this.cameras.main.width / 2, -20, this.cameras.main.width, 80); // Full width
    inventoryContainer.add(inventoryBackground);

    // Create an array to store the comic inventory sprites
    this.comicInventorySprites = [];

    // Populate the inventory with up to 20 comics in a rounded arc
    const totalWidth = this.cameras.main.width - 180; // Leave some padding on the sides
    const comicSpacing = totalWidth / (maxComics - 1); // Spacing between comics
    const baseHeight = 20; // Base height from the bottom of the screen
    const arcHeight = 10; // Maximum height of the arc

    for (let i = 0; i < maxComics; i++) {
        const x = -totalWidth / 2 + i * comicSpacing; // Position comics evenly across the width
        const normalizedPosition = (i - (maxComics - 1) / 2) / ((maxComics - 1) / 2); // Normalize position to [-1, 1]
        const y = -baseHeight + Math.pow(normalizedPosition, 2) * arcHeight; // Create a parabolic arc

        const angle = normalizedPosition * 20; // Smoothly adjust the angle based on position
        const comicKey = Phaser.Utils.Array.GetRandom(comicCovers); // Randomly select a comic cover
        const comicSprite = this.add.image(x, y, comicKey).setScale(0.8).setAngle(angle); // Scale to 1 and apply angle
        inventoryContainer.add(comicSprite);
        this.comicInventorySprites.push(comicSprite);
    }

    // Ensure the inventoryContainer is shown on the minimap
    minimap.ignore(inventoryContainer, false);

    // Update the inventory display when comics are used
    this.updateComicInventory = () => {
        this.comicInventorySprites.forEach((sprite, index) => {
            sprite.setVisible(index < comics); // Show comics from right to left
        });
    };

    // Initial update of the inventory
    this.updateComicInventory();

    // Add background music and play it in a loop
    const backgroundMusic = this.sound.add('backgroundMusic', { loop: true });
    backgroundMusic.play();

    // Gradually increase the playback rate of the background music as the timer decreases
    const initialPlaybackRate = 1; // Normal speed
    const maxPlaybackRate = 1.5; // 150% speed
    const speedIncreaseThreshold = 0.2; // 20% of the total time

    this.time.addEvent({
        delay: 100, // Check every 100ms
        callback: () => {
            const remainingTimeRatio = this.timeLeft / 180; // Calculate remaining time as a ratio
            if (remainingTimeRatio <= speedIncreaseThreshold) {
                const newRate = Phaser.Math.Interpolation.Linear(
                    [initialPlaybackRate, maxPlaybackRate],
                    1 - remainingTimeRatio / speedIncreaseThreshold
                );
                backgroundMusic.setRate(newRate); // Gradually increase playback rate
            }
        },
        loop: true
    });

    // Add a mute button
    const muteButton = this.add.text(
        this.cameras.main.width - 52, // Position near the top-right corner
        this.cameras.main.height - 52,
        'Mute',
        {
            font: '12px Arial',
            fill: '#ffffff',
            backgroundColor: '#000000',
            padding: { left: 5, right: 5, top: 2, bottom: 2 }
        }
    )
    .setScrollFactor(0) // Ensure it stays fixed on the screen
    .setInteractive()
    .on('pointerdown', () => {
        this.sound.mute = !this.sound.mute; // Toggle mute
        muteButton.setText(this.sound.mute ? 'Unmute' : 'Mute'); // Update button text
    });
}

// Updates the game state every frame, including player movement, balance, and collisions.
// Handles interactions with entities and updates the UI.
function update(time, delta) {

    // Set transparency for all objects except the background
    this.mapContainer.iterate(child => {
        if (child !== this.background) {
            if(debugMode) {
                child.setAlpha(0.6); // Apply transparency to all children except the background
            } else {
                child.setAlpha(0);  //Full opacity in debug mode 
            }
        }
    });

    const rotationSpeed = 0.05; // Adjust rotation speed
    const balanceRegenSpeed = 0.5; // Speed at which balance regenerates when stopped
    const baseBackwardSpeed = 100; // Base speed for moving backward

    const backwardSpeed = baseBackwardSpeed;

    // Check for input and update the last input time
    if (
        this.cursors.up.isDown || this.cursors.down.isDown ||
        this.cursors.left.isDown || this.cursors.right.isDown ||
        this.wasd.up.isDown || this.wasd.down.isDown ||
        this.wasd.left.isDown || this.wasd.right.isDown
    ) {
        lastInputTime = time; // Update the last input time
    }

    // Prevent movement if the player is off balance or in the fall down state
    const isOffBalance = balanceMeter >= balanceThresholdRight || balanceMeter <= balanceThresholdLeft;
    if (!canMoveForward || isOffBalance) {
        player.body.setVelocity(0, 0); // Stop movement
        momentum = 0; // Reset momentum when off balance
    } else {
        const forwardPressed = this.cursors.up.isDown || this.wasd.up.isDown;
        const backwardPressed = this.cursors.down.isDown || this.wasd.down.isDown;

        if(goingBackward) {
            // Reverse left and right controls when moving backward
            if (this.cursors.left.isDown || this.wasd.left.isDown) {
                player.rotation += rotationSpeed; // Right becomes left
                balanceMeter += delta * 0.1; // Shift balance to the right (positive)
            } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
                player.rotation -= rotationSpeed; // Left becomes right
                balanceMeter -= delta * 0.1; // Shift balance to the left (negative)
            }
        } else {
            // Allow turning while moving
            if (this.cursors.left.isDown || this.wasd.left.isDown) {
                player.rotation -= rotationSpeed;
                balanceMeter -= delta * 0.1; // Shift balance to the left (negative)
            } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
                player.rotation += rotationSpeed;
                balanceMeter += delta * 0.1; // Shift balance to the right (positive)
            }
        }        

        // Handle backward movement independently of momentum
        if (backwardPressed && !forwardPressed) {
            // Reset forward momentum when moving backward
            momentum = 0;

            // Move backward
            const velocityX = Math.cos(player.rotation) * -backwardSpeed;
            const velocityY = Math.sin(player.rotation) * -backwardSpeed;
            player.body.setVelocity(velocityX, velocityY);

            goingBackward = true; // Set a flag to indicate backward movement
        } else if (forwardPressed && !backwardPressed) {

            // Apply momentum to the player's velocity
            const velocityX = Math.cos(player.rotation) * momentum;
            const velocityY = Math.sin(player.rotation) * momentum;
            player.body.setVelocity(velocityX, velocityY);

            // Adjust momentum based on input
            momentum = Math.min(momentum + momentumIncrease, maxMomentum); // Increase momentum when pedaling

            // Correct balance more quickly when going straight and not turning
            if (!(this.cursors.left.isDown || this.wasd.left.isDown || this.cursors.right.isDown || this.wasd.right.isDown)) {
                if (balanceMeter > 0) {
                    balanceMeter = Math.max(balanceMeter - delta * 0.2, 0); // Faster correction toward 0
                } else if (balanceMeter < 0) {
                    balanceMeter = Math.min(balanceMeter + delta * 0.2, 0); // Faster correction toward 0
                }
            }

            goingBackward = false; // Set a flag to indicate forward movement
        } else {
            // Glide and slowly reduce momentum when no movement keys are pressed
            if (momentum > 0) {
                momentum = Math.max(momentum - glideFriction, 0); // Reduce momentum gradually
                const velocityX = Math.cos(player.rotation) * momentum;
                const velocityY = Math.sin(player.rotation) * momentum;
                player.body.setVelocity(velocityX, velocityY);
            } else {
                player.body.setVelocity(0, 0); // Stop completely when momentum reaches 0
            }
        }
    }

    // Update backward movement text
    this.backwardText.setText(`Going Backward: ${goingBackward ? 'Yes' : 'No'}`);

    // Regenerate balance quickly when stopped
    if (momentum === 0 && !(this.cursors.down.isDown || this.wasd.down.isDown)) {
        if (balanceMeter > 0) {
            balanceMeter = Math.max(balanceMeter - delta * balanceRegenSpeed, 0);
        } else if (balanceMeter < 0) {
            balanceMeter = Math.min(balanceMeter + delta * balanceRegenSpeed, 0);
        }
    }

    // Check if the player falls down
    if (isOffBalance) {
        this.fallDown(); // Call fallDown with the correct context
    }

    // Update the balance indicator
    updateBalanceIndicator.call(this);

    // Update the balance meter text
    this.balanceText.setText(`Balance: ${Math.floor(balanceMeter)}`);

    // Update the player's coordinates text
    this.coordsText.setText(`X: ${Math.floor(player.x)}, Y: ${Math.floor(player.y)}`);

    // Update the cursor icon position
    if (cursorIcon.visible) {
        cursorIcon.setPosition(this.input.activePointer.worldX, this.input.activePointer.worldY);
    }

    // Update the refill zone's pulsating effect
    const refillZoneEntity = entities.find(entity => entity.type === 'refillZone');
    if (refillZoneEntity && comics < maxComics) {
        if (!refillTween) {
            // Start the pulsating effect if it isn't already active
            refillTween = this.tweens.add({
                targets: refillZoneEntity.graphics,
                scale: { from: 1, to: 1.2 }, // Pulsate between normal size and 1.2x size
                duration: 800, // Duration of the pulsation
                yoyo: true, // Reverse the tween to create a pulsating effect
                repeat: -1, // Repeat indefinitely
                ease: 'Sine.easeInOut'
            });
        }
    } else if (refillTween) {
        // Stop the pulsating effect when comics are full
        refillTween.stop();
        refillTween = null;
        refillZoneEntity.graphics.setScale(1); // Reset the scale to normal
    }

    // Check if the spacebar is pressed to shoot a projectile
    if (Phaser.Input.Keyboard.JustDown(this.spacebar)) {
        const targetX = player.x + Math.cos(player.rotation) * 100; // Target in front of the player
        const targetY = player.y + Math.sin(player.rotation) * 100;
        throwProjectile.call(this, targetX, targetY);
    }

    let isCollidingWithTree = false;

    // Handle manual collision detection with entities
    entities.forEach(entity => {
        if (entity.polygon) {
            // Check collision between the player's collision shape and the entity
            const rotatedShape = getRotatedCollisionShape(player, player.x, player.y);
            if (checkPolygonCollision(rotatedShape, entity.polygon)) {
                handleEntityCollision.call(this, entity);
                if (entity.type === "tree") {
                    isCollidingWithTree = true;
                }
            }

            // Check collision between projectiles and the entity
            projectiles.getChildren().forEach(projectile => {
                const projectileBounds = new Phaser.Geom.Rectangle(
                    projectile.x - projectile.displayWidth / 2,
                    projectile.y - projectile.displayHeight / 2,
                    projectile.displayWidth,
                    projectile.displayHeight
                );

                if (checkRectanglePolygonCollision(projectileBounds, entity.polygon) && entity.type !== 'road' && entity.type !== 'tree') {
                    console.log(`Projectile collided with: ${entity.type}, Description: ${entity.description}`);
                    projectile.destroy(); // Destroy the projectile
                }
            });

            // check collision between people and the entity
            people.forEach(person => {
                const personBounds = new Phaser.Geom.Ellipse(
                    person.x, // Center X
                    person.y, // Center Y
                    20,       // Width of the person
                    30        // Height of the person
                );

                if (checkEllipsePolygonCollision(personBounds, entity.polygon)) {
                    // console.log(`Person collided with: ${entity.type}, Description: ${entity.description}`);
                    // Handle person collision with the entity, move them away from the entity so they can continue moving towards their destination..  People shouldn't collide on trees or roads though
                    if (entity.type !== 'tree' && entity.type !== 'road') {
                        const searchRadius = 200; // Radius to search for unoccupied space
                        const stepAngle = Math.PI / 16; // Angle step for radial search

                        let safeX = person.x;
                        let safeY = person.y;

                        for (let r = 0; r <= searchRadius; r += 5) { // Increment radius in steps of 5
                            for (let theta = 0; theta < 2 * Math.PI; theta += stepAngle) {
                                const testX = person.x + r * Math.cos(theta);
                                const testY = person.y + r * Math.sin(theta);

                                // Check if the test position collides with any entity, ignoring trees and roads
                                const isColliding = entities.some(ent => {
                                    if (ent.polygon && ent.type !== 'tree' && ent.type !== 'road') {
                                        const testBounds = new Phaser.Geom.Ellipse(testX, testY, 20, 30);
                                        return checkEllipsePolygonCollision(testBounds, ent.polygon);
                                    }
                                    return false;
                                });

                                if (!isColliding) {
                                    safeX = testX;
                                    safeY = testY;
                                    break;
                                }
                            }
                            if (safeX !== person.x || safeY !== person.y) {
                                break; // Exit the loop if a safe position is found
                            }
                        }

                        // Move the person to the nearest unoccupied space
                        person.setPosition(safeX, safeY);
                    }
                }
            });
        }
    });

    // Reset tint if not colliding with any tree
    if (!isCollidingWithTree) {
        player.sprite.clearTint();
    }

    // Update the player's collision shape visualization
    if (player.collisionGraphics) {
        player.collisionGraphics.clear();
        // player.collisionGraphics.lineStyle(2, 0xff0000, 1); // Red outline

        // Draw the thin diamond shape, rotated with the player
        player.collisionGraphics.beginPath();
        const shape = player.collisionShape;
        const cosAngle = Math.cos(player.rotation);
        const sinAngle = Math.sin(player.rotation);

        const rotatedPoints = shape.map(point => ({
            x: player.x + point.x * cosAngle - point.y * sinAngle,
            y: player.y + point.x * sinAngle + point.y * cosAngle
        }));

        player.collisionGraphics.moveTo(rotatedPoints[0].x, rotatedPoints[0].y);
        for (let i = 1; i < rotatedPoints.length; i++) {
            player.collisionGraphics.lineTo(rotatedPoints[i].x, rotatedPoints[i].y);
        }
        player.collisionGraphics.setVisible(true); // Make the collision graphics invisible to the player
        player.collisionGraphics.closePath();
        player.collisionGraphics.strokePath();
    }

    // Update vertex debug text
    let vertexFound = false;
    entities.forEach(entity => {
        if (entity.vertices) {
            entity.vertices.forEach(vertex => {
                const distance = Phaser.Math.Distance.Between(
                    this.input.activePointer.worldX,
                    this.input.activePointer.worldY,
                    vertex.x,
                    vertex.y
                );
                if (distance <= 10) { // If the cursor is within 10 pixels of the vertex
                    this.vertexDebugText.setText(`Vertex: X: ${vertex.x}, Y: ${vertex.y}`);
                    vertexFound = true;
                }
            });
        }
    });

    if (!vertexFound) {
        this.vertexDebugText.setText('Vertex: None');
    }

    // Debug mode: Show collision boundaries for People, Player, Projectiles, and Entities
    if (debugMode) {
        // Show collision boundaries for People
        people.forEach(person => {
            if (!person.debugGraphics) {
                person.debugGraphics = this.add.graphics();
                person.debugGraphics.setDepth(2); // Ensure it renders above other objects
            }
            person.debugGraphics.clear();
            person.debugGraphics.lineStyle(2, 0x00ff00, 1); // Green outline
            person.debugGraphics.strokeEllipse(
                person.x,
                person.y,
                person.width || 20, // Default width if not set
                person.height || 30 // Default height if not set
            );
        });

        // Show collision boundaries for Player
        if (player.collisionGraphics) {
            player.collisionGraphics.clear();
            player.collisionGraphics.lineStyle(2, 0xff0000, 1); // Red outline

            // Draw the thin diamond shape, rotated with the player
            const rotatedShape = getRotatedCollisionShape(player, player.x, player.y);
            player.collisionGraphics.strokePoints(rotatedShape, true);
        }

        // Show collision boundaries for Projectiles
        projectiles.getChildren().forEach(projectile => {
            if (!projectile.debugGraphics) {
                projectile.debugGraphics = this.add.graphics();
                projectile.debugGraphics.setDepth(2); // Ensure it renders above other objects
            }
            projectile.debugGraphics.clear();
            projectile.debugGraphics.lineStyle(2, 0x0000ff, 1); // Blue outline
            projectile.debugGraphics.strokeRect(
                projectile.x - projectile.displayWidth / 2,
                projectile.y - projectile.displayHeight / 2,
                projectile.displayWidth,
                projectile.displayHeight
            );
        });

        // Show collision boundaries for Entities
        entities.forEach(entity => {
            if (entity.polygon) {
                if (!entity.debugGraphics) {
                    entity.debugGraphics = this.add.graphics();
                    entity.debugGraphics.setDepth(2); // Ensure it renders above other objects
                }
                entity.debugGraphics.clear();

                // Set line color based on entity type
                let lineColor;
                switch (entity.type) {
                    case 'car':
                        lineColor = 0xc0c0c0; // Silver
                        break;
                    case 'tree':
                        lineColor = 0x00ff00; // Green
                        break;
                    case 'road':
                        lineColor = 0x000000; // Black
                        break;
                    case 'building':
                        lineColor = 0xffffff; // White
                        break;
                    default:
                        lineColor = 0xffff00; // Default yellow
                }

                entity.debugGraphics.lineStyle(2, lineColor, 1); // Set line style
                entity.debugGraphics.strokePoints(entity.polygon.points, true);
            }
        });

    } else {
        // Hide debug graphics when debug mode is disabled
        people.forEach(person => person.debugGraphics?.clear());
        player.collisionGraphics?.clear();
        projectiles.getChildren().forEach(projectile => projectile.debugGraphics?.clear());
        entities.forEach(entity => entity.debugGraphics?.clear());
    }

    // Handle manual collision detection between projectiles and people
    projectiles.getChildren().forEach(projectile => {
        people.forEach(person => {
            const projectileBounds = new Phaser.Geom.Rectangle(
                projectile.x - projectile.displayWidth / 2,
                projectile.y - projectile.displayHeight / 2,
                projectile.displayWidth,
                projectile.displayHeight
            );

            const personBounds = new Phaser.Geom.Ellipse(
                person.x, // Center X
                person.y, // Center Y
                20,       // Width of the person
                30        // Height of the person
            );

            // Check if any point of the player's rotated shape intersects with the person's bounds
            const corners = [
                { x: projectileBounds.x, y: projectileBounds.y },
                { x: projectileBounds.x + projectileBounds.width, y: projectileBounds.y },
                { x: projectileBounds.x, y: projectileBounds.y + projectileBounds.height },
                { x: projectileBounds.x + projectileBounds.width, y: projectileBounds.y + projectileBounds.height }
            ];
            const isColliding = corners.some(corner =>
                Phaser.Geom.Ellipse.ContainsPoint(personBounds, corner)
            );

            if (isColliding) {
                if (!person.hasComic) {
                    // Change the person's body color to gray
                    const body = person.list.find(child => child instanceof Phaser.GameObjects.Ellipse);
                    if (body) {
                        body.setFillStyle(0x808080); // Gray color
                    }
                    person.hasComic = true; // Mark the person as having received a comic
                    this.sound.play('comicReceive'); // Play comicReceive sound
                    score += 10; // Award points to the player
                    this.scoreText.setText(`Score: ${score}`); // Update the score display

                    // Update the minimap indicator to gray
                    const personIndex = people.indexOf(person);
                    if (personIndex !== -1) {
                        const minimapIndicator = minimapPeopleIndicators[personIndex];
                        minimapIndicator.clear();
                        minimapIndicator.fillStyle(0x808080, 1); // Gray for people who have received comics
                        minimapIndicator.lineStyle(2, 0x000000, 1); // Thin black border
                        minimapIndicator.fillCircle(0, 0, 5);
                        minimapIndicator.strokeCircle(0, 0, 5);
                    }
                }

                projectile.destroy(); // Destroy the projectile after collision
            }
        });
    });

    // Handle manual collision detection between player and people
    people.forEach(person => {
        const playerShape = getRotatedCollisionShape(player, player.x, player.y);
        const personBounds = new Phaser.Geom.Ellipse(
            person.x, // Center X
            person.y, // Center Y
            20,       // Width of the person
            30        // Height of the person
        );

        // Check if any point of the player's rotated shape intersects with the person's bounds
        const isColliding = playerShape.some(point =>
            Phaser.Geom.Ellipse.ContainsPoint(personBounds, point)
        );

        if (isColliding) {
            const currentTime = this.time.now; // Get the current time
            if (currentTime - lastPlayerPersonCollisionTime >= 3000) { // Check if 3 seconds have passed
                lastPlayerPersonCollisionTime = currentTime; // Update the last collision time
                console.log(`Player collided with person: ${person.name}`);
                this.fallDown(); // Make the player fall down
            }
        }
    });

    // Handle manual collision detection between player and refill zone
    if (refillZoneEntity) {
        const refillZoneBounds = new Phaser.Geom.Circle(refillZoneEntity.x, refillZoneEntity.y, refillZoneEntity.radius);
        const playerBounds = new Phaser.Geom.Rectangle(
            player.x - player.body.width / 2,
            player.y - player.body.height / 2,
            player.body.width,
            player.body.height
        );

        if (Phaser.Geom.Intersects.CircleToRectangle(refillZoneBounds, playerBounds)) {
            if (comics < maxComics) {
                this.sound.play('comicPickup'); // Play comicPickup sound
                comics = maxComics; // Refill comics
                this.comicsText.setText(`Comics: ${comics}`); // Update the comic count display
                this.updateComicInventory(); // Refresh the comics display
            }
        }
    }

    // Handle manual collision detection between player and currentDestination
    if (this.currentDestination) {
        const destinationBounds = new Phaser.Geom.Circle(
            this.currentDestination.x,
            this.currentDestination.y,
            this.currentDestination.radius
        );
        const playerBounds = new Phaser.Geom.Rectangle(
            player.x - player.body.width / 2,
            player.y - player.body.height / 2,
            player.body.width,
            player.body.height
        );

        if (Phaser.Geom.Intersects.CircleToRectangle(destinationBounds, playerBounds)) {
            const deliveryTime = 180 - this.timeLeft; // Calculate the time taken to deliver
            const scoreIncrease = Math.max(50 - deliveryTime, 10); // Score increases more for faster deliveries, minimum 10 points
            score += scoreIncrease; // Update the score
            this.scoreText.setText(`Score: ${score}`); // Update the score display

            // Increase the timer by 30 seconds
            this.timeLeft = Math.min(this.timeLeft + 30, 180); // Cap the timer at 180 seconds
            const activeSegments = Math.ceil(this.timeLeft / this.timePerSegment);

            // Update the progress bar segments
            this.timerSegments.forEach((segment, index) => {
                if (index < activeSegments) {
                    segment.setFillStyle(0x00ff00); // Green for active segments
                } else {
                    segment.setFillStyle(0xff0000); // Red for empty segments
                }
            });

            console.log('Comic delivered!'); // Placeholder for delivery logic

            // Play a sound to celebrate the achievement
            this.sound.play('comicReceive'); // Play the sound for successfully delivering a comic

            // Move the destination to a new random position
            this.currentDestination.setPosition(
                Phaser.Math.Between(100, this.physics.world.bounds.width - 100),
                Phaser.Math.Between(100, this.physics.world.bounds.height - 100)
            );
        }
    }
}

// Updates the balance indicator graphics based on the player's balance meter.
// Displays a marker to show the player's current balance state.
function updateBalanceIndicator() {
    const barWidth = 25; // Width of the balance bar (matches the width of the balanceIndicator.png)
    const barHeight = 7; // Height of the balance bar
    const maxBalance = 100; // Maximum absolute value of balance
    const normalizedBalance = Phaser.Math.Clamp(balanceMeter / maxBalance, -1, 1); // Normalize balance to [-1, 1]

    // Clear the previous graphics
    balanceIndicator.clear();

    // Get the position and rotation of the balanceIndicatorImage
    const indicatorX = player.balanceIndicatorImage.x;
    const indicatorY = player.balanceIndicatorImage.y + barWidth / 2;
    const angle = player.balanceIndicatorImage.rotation; // Rotation of the balanceIndicatorImage

    // Calculate the marker's position based on the normalized balance
    const markerOffsetX = (normalizedBalance - 0.5) * barWidth; // Map [-1, 1] to [-barWidth/2, barWidth/2]
    const markerX = indicatorX + Math.cos(angle) * markerOffsetX / 2;
    const markerY = indicatorY + Math.sin(angle) * markerOffsetX;

    // Draw the thick black line aligned with the balanceIndicatorImage
    const lineLength = 2; // Length of the line
    balanceIndicator.lineStyle(4, 0x000000, 1); // Black color, thickness of 4
    balanceIndicator.beginPath();
    balanceIndicator.moveTo(
        markerX - lineLength * Math.cos(angle),
        markerY - lineLength * Math.sin(angle)
    );
    balanceIndicator.lineTo(
        markerX + lineLength * Math.cos(angle),
        markerY + lineLength * Math.sin(angle)
    );
    balanceIndicator.strokePath();
}

// Throws a projectile (comic) in the direction of the target.
// Reduces the player's comic count, updates the inventory, and handles collision logic.
function throwProjectile(targetX, targetY) {
    if (comics <= 0) {
        this.sound.play('outOfAmmo'); // Play out of ammo sound
        return; // Do nothing if the player has no comics left
    }

    this.sound.play('throwComic'); // Play throwComic sound
    this.setComics(comics - 1); // Reduce the comic count and update the display
    this.updateComicInventory(); // Update the inventory display

    // Randomly select a comic cover
    const randomComic = Phaser.Utils.Array.GetRandom(comicCovers);

    // Create a new projectile at the player's position with the selected comic cover
    const projectile = projectiles.create(player.x, player.y, randomComic);
    projectile.setScale(0.5); // Make the projectile 5x bigger
    projectile.setCollideWorldBounds(true);
    projectile.body.onWorldBounds = true;

    // Add the player's forward velocity to the projectile's velocity
    const playerVelocity = new Phaser.Math.Vector2(player.body.velocity.x, player.body.velocity.y);
    const projectileSpeed = 300; // Base speed of the projectile
    const inheritedVelocityFactor = 0.8; // Factor of the player's velocity to inherit

    const velocity = new Phaser.Math.Vector2(targetX - player.x, targetY - player.y)
        .normalize()
        .scale(projectileSpeed)
        .add(playerVelocity.scale(inheritedVelocityFactor));
    projectile.setVelocity(velocity.x, velocity.y);

    // Add spinning to the projectile
    const spinSpeed = Phaser.Math.Between(-300, 300); // Random spin speed between -300 and 300 degrees per second
    projectile.setAngularVelocity(spinSpeed);

    // Handle "perfect" throw logic

    // Animate the projectile to "arc" by scaling up and back down
    const distance = Phaser.Math.Distance.Between(player.x, player.y, targetX, targetY);
    const halfwayPoint = distance / projectileSpeed * 1000;

    projectile.setScale(0.5); // Start at normal size
    this.tweens.add({
        targets: projectile,
        scale: 1.0, // Scale up to 2x size
        duration: halfwayPoint / projectileSpeed * 1000, // Time to halfway point
        yoyo: true, // Scale back down after halfway
        ease: 'Quad.easeInOut'
    });

    // Reward the player with points and make the target object flash
    // this.physics.add.collider(projectile, targetX, targetY, (proj, obj) => {
    //     proj.destroy(); // Destroy the projectile

    //     if (obj.needsComic) {
    //         score += 10; // Reward points for a perfect throw
    //         this.scoreText.setText(`Score: ${score}`); // Update score display

    //         // Make the target object flash
    //         this.tweens.add({
    //             targets: obj,
    //             alpha: 0,
    //             duration: 100,
    //             yoyo: true,
    //             repeat: 3
    //         });

    //         obj.needsComic = false; // Mark the object as no longer needing a comic
    //     } else {
    //         score -= 1; // Deduct a point for hitting an object that doesn't need a comic
    //         this.scoreText.setText(`Score: ${score}`); // Update score display
    //     }
    // });

    // Destroy the projectile if it goes out of bounds or after 3 seconds
    this.time.delayedCall(3000, () => {
        if (projectile.active) {
            projectile.destroy();
        }
    });
}

// Handles the player falling down due to imbalance or collision.
// Resets momentum, balance, and temporarily disables movement.
function fallDown() {
    this.sound.play('fallOver'); // Play fallOver sound
    // Reset momentum and speed
    momentum = 0;
    player.body.setVelocity(0, 0);

    // Reset balance
    balanceMeter = 0;

    // Lose a comic on falling over
    if (comics > 0) {
        this.setComics(comics - 1); // Reduce the comic count and update the display
    }

    // Disable forward movement for 1 second
    canMoveForward = false;
    this.time.delayedCall(1000, () => {
        canMoveForward = true; // Re-enable forward movement after 1 second
    });

    // Make the player blink by toggling its visibility
    const blinkInterval = 100; // Interval for blinking in milliseconds
    let blinkCount = 0;
    const maxBlinks = 10; // Total number of blinks (1 second / 100ms = 10 blinks)

    const blinkTimer = this.time.addEvent({
        delay: blinkInterval,
        callback: () => {
            player.sprite.setVisible(!player.sprite.visible); // Toggle visibility
            blinkCount++;
            if (blinkCount >= maxBlinks) {
                blinkTimer.remove(); // Stop blinking after maxBlinks
                player.sprite.setVisible(true); // Ensure the player is visible at the end
            }
        },
        loop: true
    });
}

// Handles collisions between the player and entities.
// Adjusts the player's position and resets balance if necessary.
function handleEntityCollision(entity) {
    if (entity.type === "tree") {
        // Check how much of the player is inside the tree polygon
        const playerBounds = player.sprite.getBounds(); // Use only the playerSprite graphic for bounds

        const corners = [
            { x: playerBounds.left, y: playerBounds.top },
            { x: playerBounds.right, y: playerBounds.top },
            { x: playerBounds.left, y: playerBounds.bottom },
            { x: playerBounds.right, y: playerBounds.bottom }
        ];

        // Count the number of corners inside the tree polygon
        const cornersInside = corners.filter(corner =>
            Phaser.Geom.Polygon.Contains(entity.polygon, corner.x, corner.y)
        ).length;

        // Calculate the percentage of the player under the tree
        const percentageUnderTree = cornersInside / corners.length;

        // Apply a shadow tint based on the percentage
        const shadowTint = Phaser.Display.Color.Interpolate.ColorWithColor(
            { r: 255, g: 255, b: 255 }, // Normal color (no shadow)
            { r: 0, g: 0, b: 0 },       // Full shadow color
            1,                          // Range max
            percentageUnderTree          // Current percentage
        );

        player.sprite.setTint(
            Phaser.Display.Color.GetColor(shadowTint.r, shadowTint.g, shadowTint.b)
        );
    } else if (entity.type === "car") {
        this.sound.play('runIntoEntityCar'); // Play car collision sound
    } else if (entity.type === "building") {
        this.sound.play('runIntoEntityBuilding'); // Play building collision sound
    } else if (entity.type === "person") {
        this.sound.play('crashIntoPerson'); // Play person collision sound
    }

    // Ensure tint is cleared when no collision occurs
    if (!entity || entity.type !== "tree") {
        player.sprite.clearTint();
    }

    if (entity.type !== "road" && entity.type !== "tree") {
        // Stop the player completely
        player.body.setVelocity(0, 0); // Stop the player's movement
        momentum = 0; // Reset momentum to 0 to stop movement

        // Adjust the player's position based on the direction of movement
        const adjustDistance = 10; // Distance to move the player away from the object
        const angle = player.rotation;

        // Determine the adjustment direction based on whether the player is going backward
        const adjustmentFactor = goingBackward ? 1 : -1;

        // Calculate the adjusted position
        const adjustedX = player.x + Math.cos(angle) * adjustDistance * adjustmentFactor;
        const adjustedY = player.y + Math.sin(angle) * adjustDistance * adjustmentFactor;

        // Check for the nearest unoccupied space within a radius, ignoring trees and roads
        let safeX = adjustedX;
        let safeY = adjustedY;
        const searchRadius = 200; // Radius to search for unoccupied space
        const stepAngle = Math.PI / 16; // Angle step for radial search

        for (let r = 0; r <= searchRadius; r += 5) { // Increment radius in steps of 5
            for (let theta = 0; theta < 2 * Math.PI; theta += stepAngle) {
            const testX = adjustedX + r * Math.cos(theta);
            const testY = adjustedY + r * Math.sin(theta);

            // Check if the test position collides with any entity, ignoring trees and roads
            const isColliding = entities.some(ent => {
                if (ent.polygon && ent.type !== 'tree' && ent.type !== 'road') {
                const rotatedShape = getRotatedCollisionShape(player, testX, testY);
                return checkPolygonCollision(rotatedShape, ent.polygon);
                }
                return false;
            });

            if (!isColliding) {
                safeX = testX;
                safeY = testY;
                break;
            }
            }
            if (safeX !== adjustedX || safeY !== adjustedY) {
            break; // Exit the loop if a safe position is found
            }
        }

        // Move the player to the nearest unoccupied space
        player.setPosition(safeX, safeY);

        // Reset the balance meter upon collision
        balanceMeter = 0; // Set balance to a fixed value to simulate instability
    }
}

// Returns the player's collision shape rotated to match their current orientation.
// Used for collision detection with entities.
function getRotatedCollisionShape(player, x, y) {
    const cosAngle = Math.cos(player.rotation);
    const sinAngle = Math.sin(player.rotation);

    return player.collisionShape.map(point => ({
        x: x + point.x * cosAngle - point.y * sinAngle,
        y: y + point.x * sinAngle + point.y * cosAngle
    }));
}

// Checks for collisions between two polygons.
// Returns true if any point or edge of one polygon intersects with the other.
function checkPolygonCollision(polygon1, polygon2) {
    // Check if any point of polygon1 is inside polygon2
    for (const point of polygon1) {
        if (Phaser.Geom.Polygon.Contains(polygon2, point.x, point.y)) {
            return true;
        }
    }

    // Check if any edge of polygon1 intersects with any edge of polygon2
    for (let i = 0; i < polygon1.length; i++) {
        const p1 = polygon1[i];
        const p2 = polygon1[(i + 1) % polygon1.length];

        for (let j = 0; j < polygon2.points.length; j++) {
            const q1 = polygon2.points[j];
            const q2 = polygon2.points[(j + 1) % polygon2.points.length];

            if (Phaser.Geom.Intersects.LineToLine(
                new Phaser.Geom.Line(p1.x, p1.y, p2.x, p2.y),
                new Phaser.Geom.Line(q1.x, q1.y, q2.x, q2.y)
            )) {
                return true;
            }
        }
    }

    return false; // No collision detected
}

// Checks if a circle intersects with a polygon.
// Returns true if the circle's center is inside the polygon or if any edge intersects.
function checkCirclePolygonCollision(circle, polygon) {
    // Check if the circle's center is inside the polygon
    if (Phaser.Geom.Polygon.Contains(polygon, circle.x, circle.y)) {
        return true;
    }

    // Check if any edge of the polygon intersects with the circle
    const points = polygon.points;
    for (let i = 0; i < points.length; i++) {
        const p1 = points[i];
        const p2 = points[(i + 1) % points.length];
        if (Phaser.Geom.Intersects.LineToCircle(new Phaser.Geom.Line(p1.x, p1.y, p2.x, p2.y), circle)) {
            return true;
        }
    }

    return false; // No intersection detected
}

// Checks for collisions between a rectangle and a polygon.
// Returns true if any corner of the rectangle is inside the polygon or if any edge intersects.
function checkRectanglePolygonCollision(rect, polygon) {
    // Check if any corner of the rectangle is inside the polygon
    const rectCorners = [
        { x: rect.x, y: rect.y },
        { x: rect.x + rect.width, y: rect.y },
        { x: rect.x, y: rect.y + rect.height },
        { x: rect.x + rect.width, y: rect.y + rect.height }
    ];

    for (const corner of rectCorners) {
        if (Phaser.Geom.Polygon.Contains(polygon, corner.x, corner.y)) {
            return true;
        }
    }

    // Check if any edge of the polygon intersects with the rectangle
    const polygonPoints = polygon.points;
    for (let i = 0; i < polygonPoints.length; i++) {
        const p1 = polygonPoints[i];
        const p2 = polygonPoints[(i + 1) % polygonPoints.length];

        if (
            Phaser.Geom.Intersects.LineToRectangle(
                new Phaser.Geom.Line(p1.x, p1.y, p2.x, p2.y),
                rect
            )
        ) {
            return true;
        }
    }

    return false; // No collision detected
}

// Custom function to check if a line intersects with an ellipse
function checkLineToEllipse(line, ellipse) {
    const rx = ellipse.width / 2; // Horizontal radius
    const ry = ellipse.height / 2; // Vertical radius
    const cx = ellipse.x; // Center X
    const cy = ellipse.y; // Center Y

    // Translate the line to the ellipse's local space
    const x1 = line.x1 - cx;
    const y1 = line.y1 - cy;
    const x2 = line.x2 - cx;
    const y2 = line.y2 - cy;

    // Scale the line to match the ellipse's radii
    const scaledX1 = x1 / rx;
    const scaledY1 = y1 / ry;
    const scaledX2 = x2 / rx;
    const scaledY2 = y2 / ry;

    // Check for intersection with a unit circle
    const dx = scaledX2 - scaledX1;
    const dy = scaledY2 - scaledY1;
    const a = dx * dx + dy * dy;
    const b = 2 * (scaledX1 * dx + scaledY1 * dy);
    const c = scaledX1 * scaledX1 + scaledY1 * scaledY1 - 1;

    const discriminant = b * b - 4 * a * c;

    // If the discriminant is negative, there is no intersection
    if (discriminant < 0) {
        return false;
    }

    // Otherwise, check if the intersection points are within the line segment
    const t1 = (-b - Math.sqrt(discriminant)) / (2 * a);
    const t2 = (-b + Math.sqrt(discriminant)) / (2 * a);

    return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1);
}

// Checks for collisions between an ellipse and a polygon.
function checkEllipsePolygonCollision(ellipse, polygon) {
    // Check if the ellipse's center is inside the polygon
    if (Phaser.Geom.Polygon.Contains(polygon, ellipse.x, ellipse.y)) {
        return true;
    }

    // Check if any edge of the polygon intersects with the ellipse
    const points = polygon.points;
    for (let i = 0; i < points.length; i++) {
        const p1 = points[i];
        const p2 = points[(i + 1) % points.length];
        if (checkLineToEllipse(new Phaser.Geom.Line(p1.x, p1.y, p2.x, p2.y), ellipse)) {
            return true;
        }
    }

    return false; // No intersection detected
}