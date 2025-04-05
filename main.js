import MenuScene from './menu.js';
import { entities } from './entities.js';

const config = {
    type: Phaser.WEBGL,
    width: 600, // Set fixed width
    height: 450, // Set fixed height
    parent: 'game', // ID of the HTML element to attach the game
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    pixelArt: true,
    scene: [MenuScene, { key: 'MainScene', preload, create, update }],
    scale: {
        mode: Phaser.Scale.NONE, // Disable automatic resizing
        autoCenter: Phaser.Scale.CENTER_BOTH // Center the game canvas
    },
    render: {
        powerPreference: 'high-performance',
        antialias: false,
        failIfMajorPerformanceCaveat: true,
        transparent: true // Allow transparency for layering
    }
};

const game = new Phaser.Game(config);

let player;
let straightLineTimer = 0; // Timer to track straight-line movement
let collidableObjects; // Group for collidable objects
let balanceMeter = 0; // Balance meter value
let startingX = 709; // Example starting X position, 9560 comic store
let startingY = 4703; // Example starting Y position, 5841 comic store
let balanceThresholdLeft = -100; // Threshold for falling over to the left
let balanceThresholdRight = 100; // Threshold for falling over to the right
let hasCargo = true; // Whether the player has cargo
let projectiles; // Group for projectiles
let cursorIcon; // Icon to indicate the mouse cursor position
let score = 0; // Player's score
let comics = 10; // Player starts with 10 comics
let maxComics = 20; // Maximum number of comics
let momentum = 0; // Player's forward momentum
const maxMomentum = 500; // Maximum momentum
const momentumIncrease = 5; // Momentum increase per frame when pedaling
const momentumDecrease = 15; // Momentum decrease per frame when braking
const glideFriction = 5; // Friction applied when gliding
const turnMomentumPenalty = 5; // Momentum penalty when turning
let refillZone; // The refill zone object
let refillTween; // Tween for the pulsating effect
let cursorTween; // Tween for the cursor's pulsating effect
let canMoveForward = true; // Flag to control forward movement
let balanceIndicator; // Graphics object for the balance indicator
let balanceGradientTexture; // Texture for the balance gradient
let comicCovers = []; // Array to store comic cover keys
let mouseMoveTimer; // Timer to track mouse movement
let goingBackward; // Flag to indicate if the player is moving backward
const mouseHideDelay = 100; // Delay in milliseconds before hiding the cursor
let lastInputTime = 0; // Tracks the last time input was detected
const inputTimeout = 1000; // Timeout in milliseconds to stop momentum
const worldBaseWidth = 1441; // Width of the world
const worldBaseHeight = 821; // Height of the world
let debugMode = true; // Flag to enable debug mode

const globalScale = 10;

let coordinateArray = []; // Array to store coordinates

function setComics(value) {
    comics = value;
    if (this.comicsText) {
        this.comicsText.setText(`Comics: ${comics}`); // Update the comic count display
    }
}

function preload() {
    this.load.image('player', 'assets/player.png'); // Placeholder asset
    this.load.image('background', 'assets/background.png'); // Background image

    // Load textures for collidable objects
    this.load.image('building', 'assets/building.png');
    this.load.image('tree', 'assets/tree.png');
    this.load.image('car', 'assets/car.png');
    this.load.image('balanceIndicator', 'assets/balanceIndicator.png');
    this.load.image('road', 'assets/road.png');
    this.load.image('grassyArea', 'assets/grassyArea.png');

    // Load multiple comic cover images
    this.load.image('comic1', 'assets/comic1.png');
    this.load.image('comic2', 'assets/comic2.png');
    this.load.image('comic3', 'assets/comic3.png');
    this.load.image('comic4', 'assets/comic4.png');

    // Store the keys in the comicCovers array
    comicCovers = ['comic1', 'comic2', 'comic3', 'comic4'];
}

function create() {
    // Add the background image and set it to cover the entire map
    const mapContainer = this.add.container(0, 0);

    // Add the background image (not transparent)
    const background = this.add.image(0, 0, 'background').setOrigin(0, 0);
    background.setScale(globalScale);
    mapContainer.add(background);

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

    // Add a key listener for the Tilde key to toggle debugMode
    this.input.keyboard.on('keydown-`', () => {
        debugMode = !debugMode; // Toggle debugMode
    });

    // Create a group for collidable objects
    collidableObjects = this.physics.add.staticGroup();

    // Add a debug text for displaying vertex coordinates
    const vertexDebugText = this.add.text(10, 130, 'Vertex: None', {
        font: '16px Arial',
        fill: '#ff0000'
    }).setScrollFactor(0); // Ensure the text stays fixed on the screen

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
            

            // Add red dots on each vertex
            if(debugMode) {
                // Add the entity graphics to the map container
                entityGraphics.fillStyle(0x808080, 1); // Gray color for entities for now
                entityGraphics.fillPath();
                mapContainer.add(entityGraphics);
                entity.vertices.forEach(vertex => {
                    const dot = this.add.circle(vertex.x, vertex.y, 5, 0xff0000); // Red dot with radius 5
                    dot.setDepth(2); // Ensure the dot is above the entity
                    mapContainer.add(dot);
                });
            }

            // Store the entity for manual collision handling
            entity.polygon = new Phaser.Geom.Polygon(entity.vertices.map(v => [v.x, v.y]).flat());
        }
    });

    // Set transparency for all objects except the background
    mapContainer.iterate(child => {
        if (child !== background) {
            child.setAlpha(0.6); // Apply transparency to all children except the background
        }
    });

    // Set the player's depth to ensure it renders above roads, intersections, and grassy areas
    player.setDepth(1);

    // Add text to display the balance meter (for debugging or UI purposes)
    this.balanceText = this.add.text(10, 10, 'Balance: 0', {
        font: '16px Arial',
        fill: '#ffffff'
    }).setScrollFactor(0); // Ensure the text stays fixed on the screen

    // Add text to display the player's coordinates
    this.coordsText = this.add.text(10, 30, 'X: 0, Y: 0', {
        font: '16px Arial',
        fill: '#ffffff'
    }).setScrollFactor(0); // Ensure the text stays fixed on the screen

    // Add text to display the player's score
    this.scoreText = this.add.text(10, 50, 'Score: 0', {
        font: '16px Arial',
        fill: '#ffffff'
    }).setScrollFactor(0); // Ensure the text stays fixed on the screen

    // Add text to display the player's comic count
    this.comicsText = this.add.text(10, 70, `Comics: ${comics}`, {
        font: '16px Arial',
        fill: '#ffffff'
    }).setScrollFactor(0); // Ensure the text stays fixed on the screen

    // Add text to display debug information for the hovered object
    this.hoveredObjectText = this.add.text(10, 90, 'Hovered Object: None', {
        font: '16px Arial',
        fill: '#ffffff'
    }).setScrollFactor(0); // Ensure the text stays fixed on the screen

    // Add text to display the cursor's coordinates
    this.cursorCoordsText = this.add.text(10, 110, 'Cursor: X: 0, Y: 0', {
        font: '16px Arial',
        fill: '#ffffff'
    }).setScrollFactor(0); // Ensure the text stays fixed on the screen

    // Add text to display the backward movement status
    this.backwardText = this.add.text(10, 150, 'Going Backward: No', {
        font: '16px Arial',
        fill: '#ffffff'
    }).setScrollFactor(0); // Ensure the text stays fixed on the screen

    // Bind the setComics function to the scene
    this.setComics = setComics.bind(this);

    // Create a group for projectiles
    projectiles = this.physics.add.group();

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
        const hoveredObject = collidableObjects.getChildren().find(obj => {
            const bounds = obj.getBounds();
            return bounds.contains(pointer.worldX, pointer.worldY);
        });

        if (hoveredObject) {
            // Update the debug text with the hovered object's details
            this.hoveredObjectText.setText(`Hovered Object: ${hoveredObject.type}\nDescription: ${hoveredObject.description}`);
        } else {
            // Reset the debug text if no object is hovered
            this.hoveredObjectText.setText('Hovered Object: None');
        }

        // Check if the cursor is over an object that needs comics
        const hoveredComicObject = collidableObjects.getChildren().find(obj => {
            const bounds = obj.getBounds();
            return bounds.contains(pointer.worldX, pointer.worldY) && obj.needsComic;
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
                        vertexDebugText.setText(`Vertex: X: ${vertex.x}, Y: ${vertex.y}`);
                        vertexFound = true;
                    }
                });
            }
        });

        if (!vertexFound) {
            vertexDebugText.setText('Vertex: None');
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

    // Create the refill zone as a circle
    refillZone = this.add.circle(300, 300, 50, 0x00ff00, 1); // Green circle with full opacity
    this.physics.add.existing(refillZone, true); // Make it a static physics object

    // Add collision detection between the player and the refill zone
    this.physics.add.overlap(player, refillZone, () => {
        if (comics < maxComics) {
            comics = maxComics; // Refill comics
            this.comicsText.setText(`Comics: ${comics}`); // Update the comic count display
        }
    });

    // Bind the fallDown function to the scene
    this.fallDown = fallDown.bind(this);

    // Create a minimap camera
    const minimapWidth = 200; // Width of the minimap
    const minimapHeight = 150; // Height of the minimap
    const minimap = this.cameras.add(
        this.cameras.main.width - minimapWidth - 10, // X position (top-right corner)
        10, // Y position
        minimapWidth, // Width
        minimapHeight // Height
    );

    // Set the minimap to follow the player and show the entire world
    minimap.setBounds(0, 0, this.physics.world.bounds.width, this.physics.world.bounds.height);
    minimap.startFollow(player);

    // Apply a zoom level to the minimap to make it smaller
    minimap.setZoom(0.05);

    // Add a border around the minimap for better visibility
    const minimapBorder = this.add.graphics();
    minimapBorder.lineStyle(2, 0xffffff, 1); // White border
    minimapBorder.strokeRect(
        this.cameras.main.width - minimapWidth - 10, // X position
        10, // Y position
        minimapWidth, // Width
        minimapHeight // Height
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
}

function update(time, delta) {
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
    if (comics < maxComics) {
        if (!refillTween) {
            // Start the pulsating effect if it isn't already active
            refillTween = this.tweens.add({
                targets: refillZone,
                scale: { from: 1, to: 1.2 }, // Pulsate between normal size and 1.2x size
                duration: 800, // Duration of the pulsation
                yoyo: true, // Reverse the tween to create a pulsating effect
                repeat: -1, // Repeat indefinitely
                ease: 'Sine.easeInOut'
            });
        }
    } else {
        if (refillTween) {
            // Stop the pulsating effect when comics are full
            refillTween.stop();
            refillTween = null;
            refillZone.setScale(1); // Reset the scale to normal
        }
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

                if (checkRectanglePolygonCollision(projectileBounds, entity.polygon) && entity.type !== 'road') {
                    console.log(`Projectile collided with: ${entity.type}, Description: ${entity.description}`);
                    projectile.destroy(); // Destroy the projectile
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
        player.collisionGraphics.setVisible(false); // Make the collision graphics invisible to the player
        player.collisionGraphics.closePath();
        player.collisionGraphics.strokePath();
    }
}

// Custom function to check collision between a rectangle and a polygon
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

function throwProjectile(targetX, targetY) {
    if (comics <= 0) return; // Do nothing if the player has no comics left

    this.setComics(comics - 1); // Reduce the comic count and update the display

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
    const targetObject = collidableObjects.getChildren().find(obj => {
        const bounds = obj.getBounds();
        return bounds.contains(targetX, targetY);
    });

    if (targetObject) {
        const targetBounds = targetObject.getBounds();
        const targetCenter = new Phaser.Math.Vector2(targetBounds.centerX, targetBounds.centerY);

        // Animate the projectile to "arc" by scaling up and back down
        const distance = Phaser.Math.Distance.Between(player.x, player.y, targetCenter.x, targetCenter.y);
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
        this.physics.add.collider(projectile, targetObject, (proj, obj) => {
            proj.destroy(); // Destroy the projectile

            if (obj.needsComic) {
                score += 10; // Reward points for a perfect throw
                this.scoreText.setText(`Score: ${score}`); // Update score display

                // Make the target object flash
                this.tweens.add({
                    targets: obj,
                    alpha: 0,
                    duration: 100,
                    yoyo: true,
                    repeat: 3
                });

                obj.needsComic = false; // Mark the object as no longer needing a comic
            } else {
                score -= 1; // Deduct a point for hitting an object that doesn't need a comic
                this.scoreText.setText(`Score: ${score}`); // Update score display
            }
        });
    } else {
        // Destroy the projectile on collision with any object
        this.physics.add.collider(projectile, collidableObjects, (proj, obj) => {
            proj.destroy(); // Destroy the projectile
        });
    }

    // Destroy the projectile if it goes out of bounds or after 3 seconds
    this.time.delayedCall(3000, () => {
        if (projectile.active) {
            projectile.destroy();
        }
    });
}

function fallDown() {
    // Reset momentum and speed
    momentum = 0;
    player.body.setVelocity(0, 0);

    // Reset balance
    balanceMeter = 0;

    // Lose all comics
    this.setComics(0); // Reset comics and update the display

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
    } else {
        // Reset the player's sprite to its original appearance
        player.sprite.clearTint();
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

        // Check for the nearest unoccupied space within a radius
        let safeX = adjustedX;
        let safeY = adjustedY;
        const searchRadius = 200; // Radius to search for unoccupied space
        const stepAngle = Math.PI / 16; // Angle step for radial search

        for (let r = 0; r <= searchRadius; r += 5) { // Increment radius in steps of 5
            for (let theta = 0; theta < 2 * Math.PI; theta += stepAngle) {
                const testX = adjustedX + r * Math.cos(theta);
                const testY = adjustedY + r * Math.sin(theta);

                // Check if the test position collides with any entity
                const isColliding = entities.some(ent => {
                    if (ent.polygon) {
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

        // Reset the straight-line timer
        straightLineTimer = 0;
    }
}

function getRotatedCollisionShape(player, x, y) {
    const cosAngle = Math.cos(player.rotation);
    const sinAngle = Math.sin(player.rotation);

    return player.collisionShape.map(point => ({
        x: x + point.x * cosAngle - point.y * sinAngle,
        y: y + point.x * sinAngle + point.y * cosAngle
    }));
}

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