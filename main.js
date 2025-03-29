const config = {
    type: Phaser.AUTO,
    width: window.innerWidth, // Set width to 100% of the window
    height: window.innerHeight, // Set height to 100% of the window
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    pixelArt: true, // Enable pixel art scaling
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

window.addEventListener('resize', () => {
    game.scale.resize(window.innerWidth, window.innerHeight); // Adjust game size on window resize
});

let player;
let straightLineTimer = 0; // Timer to track straight-line movement
let speedMultiplier = 1; // Speed multiplier, starts at 1a
let collidableObjects; // Group for collidable objects
let balanceMeter = 0; // Balance meter value
let startingX = 100; // Example starting X position, 9560 comic store
let startingY = 100; // Example starting Y position, 5841 comic store
let balanceThresholdLeft = -100; // Threshold for falling over to the left
let balanceThresholdRight = 100; // Threshold for falling over to the right
let hasCargo = true; // Whether the player has cargo
let projectiles; // Group for projectiles
let cursorIcon; // Icon to indicate the mouse cursor position
let score = 0; // Player's score
let comics = 10; // Player starts with 10 comics
let maxComics = 20; // Maximum number of comics
let momentum = 0; // Player's forward momentum
const maxMomentum = 300; // Maximum momentum
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
const mouseHideDelay = 100; // Delay in milliseconds before hiding the cursor
let lastInputTime = 0; // Tracks the last time input was detected
const inputTimeout = 1000; // Timeout in milliseconds to stop momentum

const globalScale = 10;

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
    const background = this.add.image(0, 0, 'background').setOrigin(0, 0);

    // Scale the background
    background.setScale(globalScale);

    // Set world bounds to match the scaled background image size
    const worldWidth = background.width * globalScale;
    const worldHeight = background.height * globalScale;
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

    // Resize the camera bounds to match the world bounds
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);

    // Add the player sprite
    const playerSprite = this.add.sprite(0, 0, 'player').setScale(0.15); // Centered in the container

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
    background.setDisplaySize(worldWidth, worldHeight);

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

    // Create a group for collidable objects
    collidableObjects = this.physics.add.staticGroup();

    const entities = [
        // Buildings
        // { type: "building", coordinateX: 200, coordinateY: 150, width: 100, length: 120, description: "Office building near the intersection" },
        // { type: "building", coordinateX: 500, coordinateY: 160, width: 120, length: 140, description: "Large commercial building with parking area" },
        // { type: "building", coordinateX: 800, coordinateY: 180, width: 110, length: 130, description: "Retail store with glass frontage" },
        // { type: "building", coordinateX: 1100, coordinateY: 200, width: 130, length: 150, description: "Apartment complex with multiple floors" },

        // // Trees
        // { type: "tree", coordinateX: 250, coordinateY: 300, width: 12, length: 12, description: "Large oak tree near sidewalk" },
        // { type: "tree", coordinateX: 600, coordinateY: 320, width: 14, length: 14, description: "Small pine tree providing shade" },
        // { type: "tree", coordinateX: 900, coordinateY: 350, width: 10, length: 10, description: "Maple tree in public space" },
        // { type: "tree", coordinateX: 1150, coordinateY: 400, width: 15, length: 15, description: "Tall tree near office building" },

        // // Cars
        // { type: "car", coordinateX: 300, coordinateY: 220, width: 15, length: 25, description: "Red sedan parked near building" },
        // { type: "car", coordinateX: 520, coordinateY: 230, width: 15, length: 25, description: "White SUV in parking lot" },
        // { type: "car", coordinateX: 830, coordinateY: 250, width: 15, length: 25, description: "Black pickup truck near main road" },
        // { type: "car", coordinateX: 1200, coordinateY: 270, width: 15, length: 25, description: "Silver compact car in public parking" },

        // Roads
        { type: "road", coordinateX: 0, coordinateY: 2977, width: 14437, length: 252, description: "North avenue running east to west" },
        { type: "road", coordinateX: 0, coordinateY: 4500, width: 11552, length: 271, description: "South avenue running east to west" },

        // { type: "road", coordinateX: 700, coordinateY: 100, width: 50, length: 621, description: "North-south cross street through downtown" },
        // { type: "intersection", coordinateX: 500, coordinateY: 500, width: 100, length: 100, description: "Major downtown intersection with pedestrian crossings" },

        // // Grassy Areas
        // { type: "grassy area", coordinateX: 400, coordinateY: 400, width: 200, length: 250, description: "Public park with pathways and benches" },
        // { type: "grassy area", coordinateX: 900, coordinateY: 420, width: 180, length: 200, description: "Green space near the commercial area" }
    ];

    // Dynamically create mapped objects
    entities.forEach(entity => {
        let textureKey;
        switch (entity.type) {
            case "building":
                textureKey = "building";
                break;
            case "tree":
                textureKey = "tree";
                break;
            case "car":
                textureKey = "car";
                break;
            case "road":
            case "intersection":
                textureKey = "road"; // Use a generic road texture
                break;
            case "grassy area":
                textureKey = "grassyArea"; // Use a grassy area texture
                break;
            default:
                console.warn(`Unknown entity type: ${entity.type}`);
                return;
        }

        if (entity.type === "road" || entity.type === "intersection" || entity.type === "grassy area") {
            // Create a tiled sprite for roads, intersections, and grassy areas
            const tiledSprite = this.add.tileSprite(
                entity.coordinateX,
                entity.coordinateY,
                entity.width,
                entity.length,
                textureKey
            );
            tiledSprite.setOrigin(0.5, 0.5); // Center the tiled sprite
            tiledSprite.setDepth(0); // Ensure it renders below other objects
        } else {
            // Create static objects for other types
            const obj = collidableObjects.create(entity.coordinateX, entity.coordinateY, textureKey);
            obj.setDisplaySize(entity.width, entity.length); // Set size
            obj.description = entity.description; // Add description for debugging or interaction
            obj.type = entity.type; // Store the type for collision handling
        }
    });

    // Set the player's depth to ensure it renders above roads, intersections, and grassy areas
    player.setDepth(1);

    // Add collision detection between the player and collidable objects
    this.physics.add.overlap(player, collidableObjects, (player, obj) => {
        if (obj.type === "building" || obj.type === "car") {
            // Hard collision: stop the player and reset balance
            const slowSpeed = 20; // Define the reduced speed
            const angle = player.rotation;
            player.body.setVelocity(
                Math.cos(angle) * slowSpeed,
                Math.sin(angle) * slowSpeed
            );

            // Reduce momentum significantly upon collision
            momentum = Math.max(momentum - 100, 0); // Reduce momentum by 100, but not below 0

            // Reset the balance meter upon collision
            balanceMeter = 50; // Set balance to a fixed value (e.g., 50) to simulate instability

            // Reset the straight-line timer and speed multiplier
            straightLineTimer = 0;
            speedMultiplier = 1;
        } else if (obj.type === "grassy area") {
            // Soft collision: slow the player and affect balance
            momentum *= 0.67; // Reduce momentum by 33%
            balanceMeter *= 0.67; // Reduce balance effect by 33%
        }
        // Roads and intersections do not affect the player
    });

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
    });

    // Throw a projectile on mouse click
    this.input.on('pointerdown', (pointer) => {
        throwProjectile.call(this, pointer.worldX, pointer.worldY); // Bind `this` to the scene
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
}

function update(time, delta) {
    const rotationSpeed = 0.05; // Adjust rotation speed
    const balanceRegenSpeed = 0.5; // Speed at which balance regenerates when stopped
    const backwardSpeed = 100; // Speed for moving backward

    // Check for input and update the last input time
    if (
        this.cursors.up.isDown || this.cursors.down.isDown ||
        this.cursors.left.isDown || this.cursors.right.isDown ||
        this.wasd.up.isDown || this.wasd.down.isDown ||
        this.wasd.left.isDown || this.wasd.right.isDown
    ) {
        lastInputTime = time; // Update the last input time
    }

    // Stop momentum if no input is detected for the timeout duration
    if (time - lastInputTime > inputTimeout) {
        momentum = 0;
    }

    // Handle backward movement independently of momentum
    if (this.cursors.down.isDown || this.wasd.down.isDown) {
        // Reverse left and right controls when moving backward
        if (this.cursors.left.isDown || this.wasd.left.isDown) {
            player.rotation += rotationSpeed; // Right becomes left
            balanceMeter += delta * 0.1; // Shift balance to the right (positive)
        } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
            player.rotation -= rotationSpeed; // Left becomes right
            balanceMeter -= delta * 0.1; // Shift balance to the left (negative)
        }

        // Move backward
        const velocityX = Math.cos(player.rotation) * -backwardSpeed;
        const velocityY = Math.sin(player.rotation) * -backwardSpeed;
        player.body.setVelocity(velocityX, velocityY);
    } else {
        // Handle forward movement and momentum
        if (momentum > 0) {
            if (this.cursors.left.isDown || this.wasd.left.isDown) {
                player.rotation -= rotationSpeed;
                balanceMeter -= delta * 0.1; // Shift balance to the left (negative)
            } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
                player.rotation += rotationSpeed;
                balanceMeter += delta * 0.1; // Shift balance to the right (positive)
            }

            // Apply momentum to the player's velocity
            const velocityX = Math.cos(player.rotation) * momentum;
            const velocityY = Math.sin(player.rotation) * momentum;
            player.body.setVelocity(velocityX, velocityY);
        } else {
            // Stop velocity when no movement keys are pressed
            player.body.setVelocity(0, 0);
        }

        // Adjust momentum based on input
        if (canMoveForward && (this.cursors.up.isDown || this.wasd.up.isDown)) {
            momentum = Math.min(momentum + momentumIncrease, maxMomentum); // Increase momentum when pedaling

            // Correct balance more quickly when going straight and not turning
            if (!(this.cursors.left.isDown || this.wasd.left.isDown || this.cursors.right.isDown || this.wasd.right.isDown)) {
                if (balanceMeter > 0) {
                    balanceMeter = Math.max(balanceMeter - delta * 0.2, 0); // Faster correction toward 0
                } else if (balanceMeter < 0) {
                    balanceMeter = Math.min(balanceMeter + delta * 0.2, 0); // Faster correction toward 0
                }
            }
        } else {
            momentum = Math.max(momentum - glideFriction, 0); // Gradually decrease momentum when gliding
        }
    }

    // Regenerate balance quickly when stopped
    if (momentum === 0 && !(this.cursors.down.isDown || this.wasd.down.isDown)) {
        if (balanceMeter > 0) {
            balanceMeter = Math.max(balanceMeter - delta * balanceRegenSpeed, 0);
        } else if (balanceMeter < 0) {
            balanceMeter = Math.min(balanceMeter + delta * balanceRegenSpeed, 0);
        }
    }

    // Check if the player falls down
    if (balanceMeter >= balanceThresholdRight || balanceMeter <= balanceThresholdLeft) {
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
        const halfwayPoint = distance / 2;

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
