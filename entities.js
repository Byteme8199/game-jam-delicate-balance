export const entities = [

    // Roads
    {
        type: "road",
        vertices: [
            { x: 0, y: 2977 },
            { x: 2089, y: 2951 },
            { x: 2089, y: 3229 },
            { x: 0, y: 3229 }
        ],
        description: "North avenue running east to west"
    },
    {
        type: "road",
        vertices: [
            { x: 2109, y: 0 },
            { x: 2282, y: 0 },            
            { x: 2305, y: 1565 },
            { x: 2300, y: 2823 },            
            { x: 2160, y: 2823 },
            { x: 2140, y: 1565 },
        ],
        description: "North avenue running north to south"
    },
    {
        type: "road",
        vertices: [
            { x: 2160, y: 3289 },
            { x: 2320, y: 3290 },    
            { x: 2332, y: 3891 },
            { x: 2370, y: 4807 },
            { x: 2385, y: 5611 },
            { x: 2225, y: 5611 },
            { x: 2206, y: 4807 },
            { x: 2197, y: 4203 },
        ],
        description: "North avenue running north to south"
    },
    
    
    // Buildings
    {
        type: "building",
        vertices: [
            { x: 1646, y: 3418 },
            { x: 2026, y: 3428 },
            { x: 2054, y: 3602 },
            { x: 2049, y: 3809 },
            { x: 1746, y: 3819 },
            { x: 1746, y: 3710 },
            { x: 1646, y: 3710 }
        ],
        description: "Building A"
    },

    // Stationary Cars
    {
        type: "car",
        vertices: [
            { x: 1724, y: 3834 },
            { x: 1833, y: 3843 },
            { x: 1831, y: 3890 },
            { x: 1740, y: 3882 },
            { x: 1722, y: 3869 }
        ],
        description: "Gray car parked on the road mext to a building"
    },

    {
        type: "car",
        vertices: [
            { x: 1600, y: 3719 },
            { x: 1730, y: 3720 },
            { x: 1730, y: 3778 },
            { x: 1628, y: 3777 },
            { x: 1599, y: 3768 }
        ],
        description: "White Van parked on the road mext to a building"
    },
];
