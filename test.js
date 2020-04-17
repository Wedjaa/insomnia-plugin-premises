const randomPoint = require('@turf/random').randomPoint;
const booleanPointInPolygon = require('@turf/boolean-point-in-polygon').default;

const States = require('./states.json');
const StateBounds = require('./state-bounds.json');


const state = "IA";

const stateBounds = States[state.toUpperCase()]
const stateShape = StateBounds.features.find(feature => feature.properties.STUSPS === state);

console.log(stateBounds)

const point = randomPoint(1, {bbox: [stateBounds.min_lng, stateBounds.min_lat, stateBounds.max_lng, stateBounds.max_lat]}).features[0];

console.log(booleanPointInPolygon(point, stateShape))