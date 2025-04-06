const names = [
    'Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Hank', 'Ivy', 'Jack',
    'Karen', 'Leo', 'Mona', 'Nate', 'Olivia', 'Paul', 'Quinn', 'Rose', 'Steve', 'Tina',
    'Uma', 'Victor', 'Wendy', 'Xander', 'Yara', 'Zane', 'Aaron', 'Bella', 'Caleb', 'Daisy',
    'Ethan', 'Fiona', 'Gavin', 'Holly', 'Isaac', 'Jenna', 'Kyle', 'Luna', 'Mason', 'Nora',
    'Oscar', 'Penny', 'Ruby', 'Sam', 'Tara', 'Ulysses', 'Violet', 'Will', 'Xenia', 'Yvonne',
    'Zach', 'Amber', 'Blake', 'Cleo', 'Derek', 'Ella', 'Felix', 'Gina', 'Harry', 'Iris',
    'Jason', 'Kara', 'Liam', 'Mila', 'Noah', 'Owen', 'Paige', 'Riley', 'Sophia', 'Tyler',
    'Ursula', 'Wes', 'Ximena', 'Yvette', 'Zoe', 'Adam', 'Brooke', 'Carter', 'Delilah', 'Eli',
    'Faith', 'George', 'Hannah', 'Ian', 'Jade', 'Kurt', 'Layla', 'Miles', 'Nina', 'Oliver',
    'Piper', 'Quentin', 'Reese', 'Seth', 'Tessa', 'Uriel', 'Vera', 'Wyatt', 'Yasmin', 'Zion',
    'Ava', 'Ben', 'Chloe', 'Dean', 'Eleanor', 'Finn', 'Gabriel', 'Hazel', 'Isla', 'Jake',
    'Kaitlyn', 'Logan', 'Maddie', 'Nathan', 'Omar', 'Phoebe', 'Ryan', 'Scarlett', 'Travis',
    'Vince', 'Willa', 'Xavier', 'Zeke', 'Alex', 'Brandon', 'Cynthia', 'Dylan', 'Emily',
    'Franklin', 'Georgia', 'Harper', 'Jasmine', 'Kevin', 'Lila', 'Megan', 'Nolan', 'Ophelia',
    'Patrick', 'Rafael', 'Samantha', 'Thomas', 'Vanessa', 'Wesley', 'Yolanda', 'Zara',
    'Aiden', 'Brianna', 'Connor', 'Daphne', 'Elliot', 'Felicity', 'Graham', 'Hailey',
    'Isabella', 'James', 'Kendall', 'Landon', 'Mia', 'Noelle', 'Parker', 'Quinton', 'Reagan',
    'Sebastian', 'Talia', 'Victoria', 'William', 'Zoey'
];

export function getRandomName() {
    return names[Phaser.Math.Between(0, names.length - 1)];
}
