# Project Requirements Document

## Project Title: Delicate Balance

### Overview
This project is a PhaserJS-based game designed for a game jam. The theme is "Delicate Balance," and the gameplay will involve managing resources and maintaining equilibrium in a dynamic environment.

### Objectives
1. Create an engaging and visually appealing game.
2. Implement mechanics that reflect the theme of balance.
3. Ensure the game is playable on desktop computers with a mouse and keyboard.  Mobile compatibility is probably not necessary right now.

### Features
- Multiple game scenes (e.g., Main Menu, Gameplay, Game Over).
- Resource management mechanics.
- Dynamic difficulty adjustment.
- High score tracking.

### Technical Requirements
- Use PhaserJS 3.x.
- Codebase written in JavaScript (ES6+).
- Responsive design for cross-platform compatibility.
- Organized folder structure for assets and code.

### Milestones
1. Set up the project structure and initial configurations.
2. Develop core gameplay mechanics.
3. Add assets and animations.
4. Implement UI and menus.
5. Test and debug.
6. Submit the game for the game jam.

### Team Roles
- Developer: Responsible for coding and implementing game mechanics.
- Designer: Creates game assets and animations.
- Tester: Ensures the game is bug-free and runs smoothly.

### Tools and Resources
- PhaserJS documentation: https://phaser.io/docs
- Asset creation tools: Photoshop, Illustrator, etc.
- Version control: Git

### Timeline
- Week 1: Project setup and initial development.
- Week 2: Core mechanics and asset integration.
- Week 3: UI, testing, and final submission.


### Feature Requests
FR0001 - Add 20 dynamically created car entities that are being driven throughout town. On creation they are given another location destination to be driving towards that can be correctly 'path'ed to with the available roads.  They can only drive on 'road' entities.  They should slow down before hitting person entities.  If the player hits a moving car, make the player fall over.  If we can make the cars follow basic traffic law and patterns, even better.

FR0002 - Implement power-ups that when moved over change the gameplay.  For instance, a temporary speed boost, 10 seconds of infinite ammo (comics), ghost mode (no collision detection for the player), Micro Machine mode, where you shrink but go really fast.  Stuff like that.  These pickups should be placed in randomized locations for every play through

FR0003 - Create 'People' Spawners throughout town.  These will be randomly selected buildings that 'spawn' newly created people entities, which should make the world seem more alive.

FR0004 - Create additional comic book refill stations at every 'intersection' road entity.