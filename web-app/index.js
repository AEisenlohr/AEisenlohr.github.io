var name = 'PizzaSquat';
var communityMirrorServiceUUID = '13333333-3333-3333-3333-333333333337';
var characteristics = { 
  idrequest: '13333333-3333-3333-3333-333333330001',
  username: '13333333-3333-3333-3333-333333330002',
  password: '13333333-3333-3333-3333-333333330003' 
};
var PizzaBakeResult = {
  HALF_BAKED: 0,
  BAKED:      1,
  CRISPY:     2,
  BURNT:      3,
  ON_FIRE:    4
};
var crustSelectEl = document.getElementById('crust-type');
var toppingsEls = document.querySelectorAll('[name=toppings]');
var ovenTempEl = document.getElementById('oven-temperature');
var crustTypeEl = document.getElementById('crust-type');
var outputEl = document.getElementById('output');

function swap16(val) {
  // le to be
  return ((val & 0xFF) << 8)
    | ((val >> 8) & 0xFF);
}

// store characteristics after retrieval
var cachedCharacteristics = {};

// current bluetooth connection obj
var communityMirrorServer = null;

// connect to bluetooth peripheral
var readyOven = function() {
  return navigator.bluetooth.requestDevice({
    filters: [{ services: [ communityMirrorServiceUUID ], name: name }]

  }).then(function(device) {
    return device.gatt.connect();

  }).then(function(server) {
    communityMirrorServer = server;
    return server.getPrimaryService(communityMirrorServiceUUID);

  }).then(function(service) {
    return Promise.all(Object.values(characteristics).map((uuid)=>service.getCharacteristic(uuid)));

  }).then(function(characteristicObjs) {
    Object.keys(characteristics).forEach((name, i)=> {
      cachedCharacteristics[name] = characteristicObjs[i];
    });

  }).catch(function(err) {
    alert('communitymirror (bluetooth) error');
    throw err;
  });
};

// characteristic setup
var readyCrust = function(crustType) {
  var crust = new Uint8Array(1);
  crust[0] = crustType;

  var pizzaCrustCharacteristic = cachedCharacteristics['idrequest'];
  if(pizzaCrustCharacteristic == null) throw new Error('oven not ready!');
  return pizzaCrustCharacteristic.writeValue(crust).catch(function(err) {
    alert('crust error');
    throw err;
  });
};

var readyToppings = function(toppings) {
  var toppingsBuff = new Uint8Array(2);
  toppingsBuff[0] = toppings.concat(0).reduce((a, b)=>a | b);

  var pizzaToppingsCharacteristic = cachedCharacteristics['username'];
  if(pizzaToppingsCharacteristic == null) throw new Error('oven not ready');
  return pizzaToppingsCharacteristic.writeValue(toppingsBuff).catch(function(err) {
    alert('toppings error');
    throw err;
  });
};

var bakePizza = function(temperature) {
  var pizzaBakeCharacteristic = cachedCharacteristics['password'];
  if(pizzaBakeCharacteristic == null) throw new Error('oven not ready!');

  var tempBuff = new Uint16Array([swap16(temperature)]);
  return pizzaBakeCharacteristic.writeValue(tempBuff).then(function() {
    result = pizzaBakeCharacteristic.value.getUint8();
    log('The result is ' + (
      result == PizzaBakeResult.HALF_BAKED ? 'half baked.' :
      result == PizzaBakeResult.BAKED ? 'baked.' :
      result == PizzaBakeResult.CRISPY ? 'crispy.' :
      result == PizzaBakeResult.BURNT ? 'burnt.' :
      result == PizzaBakeResult.ON_FIRE ? 'on fire!' : 'unknown?'));

    return result;

  }).catch(function(err) {
    alert('bake error');
    throw err;
  });
};

// get values from dom
var getCrustType = function() {
  return Number(crustSelectEl.value);
};

var getToppings = function() {
  var toppings = [];
  [].slice.call(toppingsEls).forEach(function(el) {
    if(el.checked) toppings.push(Number(el.value));
  });
  return toppings;
};

var getOvenTemperature = function() {
  return ovenTempEl.value;
};

// button listeners
var onStartButtonClick = function(e) {
  if(communityMirrorServer != null && communityMirrorServer.connected) {
    alert('Already connected...');
    return;
  }
  readyOven().then(function() {
    alert('Connection successful!');
  });
};

var onBakeButtonClick = function(e) {
  if(communityMirrorServer == null || !communityMirrorServer.connected) {
    alert('Not connected!');
    return;
  }
  readyCrust(getCrustType())
  .then(() => readyToppings(getToppings()))
  .then(() => bakePizza(getOvenTemperature()))
};

var log = function(text) {
  outputEl.textContent = text;
}

document.addEventListener('DOMContentLoaded', function() {
  if(navigator.bluetooth) {
    outputEl.textContent = 'ready.';
  }
});
