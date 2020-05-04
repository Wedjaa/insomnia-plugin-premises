const Chance = require('chance');
const randomPoint = require('@turf/random').randomPoint;
const booleanPointInPolygon = require('@turf/boolean-point-in-polygon').default;
const States = require('./states.json');
const StateBounds = require('./state-bounds.json');
const chance = new Chance();
const path = require('path');
const {MOD37_36} = require('./iso7064');
let check = new MOD37_36();

const parse = require('csv-parse/lib/sync');

const fs = require('fs');

const loadCsv = (filename) => {
    const options = {
        columns: true,
        skip_empty_lines: true
    };
    return parse(fs.readFileSync(path.join(__dirname, filename), 'utf-8'), options);
};

const capitalize = (word) => {
    return  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
};

const pigs = loadCsv('./pigs.csv');
const farms = loadCsv('./farms.csv');
const adjectives = loadCsv('./adjectives.csv');

const pickRandom = (list) => {
    return list[Math.floor(Math.random() * list.length)];
}


const makeId = (length) => {
    let result = '';
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

const premiseId = () => {
    let base = makeId(2);
    let num = `000${Math.floor(9999 * Math.random())}`.substr(-4);
    return `${num}${base}${check.compute(num + base)}`
}

const randomName = () => {
    const firstName = capitalize(pickRandom(firstNames).name);
    const lastName =  capitalize(pickRandom(surnames).name);
    return `${firstName} ${lastName}`;
}

const randomFarm = () => {
    const adj = capitalize(pickRandom(adjectives)['adjective']);
    const pork = capitalize(pickRandom(pigs)['synonym']);
    const farm = capitalize(pickRandom(farms)['synonym']);
    return `${adj} ${pork} ${farm}`;
}

const makeSafe = (words) => {
    return  words
        .toLowerCase()
        .replace(/\s/g, '.')
        .replace(/[^a-z]/g, '.')
        .replace(/\.+/, '.');
}

const domain = (producer) => {
    const roots = [ 'com', 'pork', 'org', 'net' ];

    return `${makeSafe(producer)}.${pickRandom(roots)}`;
}

const email = (user, producer) => {
    return `${makeSafe(user)}@${domain(producer)}`;
}

const randomLocation = (bounds, shape) => {
    
    const point = randomPoint(1, {bbox: [
        bounds.min_lng, 
        bounds.min_lat, 
        bounds.max_lng, 
        bounds.max_lat
    ]}).features[0];

    const coords = {
        lat: point.geometry.coordinates[1],
        lng: point.geometry.coordinates[0],
    }

    return booleanPointInPolygon(point, shape) ? coords : randomLocation(bounds, shape);
};

const randomPremise = (state, bounds, shape) => {

    const iceName = chance.name();
    const producerName = randomFarm();
    const barns = Math.floor(Math.random() * 50);
    const animals = barns * Math.floor(Math.random() * (250 - 50 + 1)) + 50;
    const present = animals - Math.floor(Math.random() * (animals - 10 + 1)) + 10;
    const location = randomLocation(bounds, shape);
    return {
        usdaPin: premiseId(),
        producer: producerName,
        premName: randomFarm(),
        species: 'swine',
        iceContactName: iceName,
        state,
        zip: chance.zip(),
        city: chance.city(),
        streetAddress: chance.address({short_suffix: true}),
        locationType: pickRandom(["Grower", "Finisher", "Weaner", "Nursery"]),
        latitude: location.lat,
        longitude: location.lng,
        iceContactPhone: chance.phone(),
        iceContactEmail: email(iceName, producerName),
        siteCapacityNumberBarns: barns,
        siteCapacityNumberAnimals: animals,
        numberOfAnimalsOnSite: present
    }

}

module.exports.templateTags = [{
    name: 'premises',
    displayName: 'Random Premises',
    description: 'Generate random premises',
    args: [
        {
            displayName: 'Number Of Premises',
            description: 'Number Of Premises to Generate',
            type: 'number',
            defaultValue: 10
        }, 
        {
            displayName: 'State',
            description: 'State To Create Premises For',
            type: 'enum',
            defaultValue: 'IA',
            options: Object.keys(States).map(stateCode =>({
                displayName: States[stateCode].name,
                value: stateCode,
            })),
        }
    ],
    async run (context, number, state) {
        const stateBounds = States[state.toUpperCase()]
        const stateShape = StateBounds.features.find(feature => feature.properties.STUSPS === state);

        return JSON.stringify([...Array(number).keys()].map( idx => randomPremise(state, stateBounds, stateShape)), undefined, 4);
    }
}];
