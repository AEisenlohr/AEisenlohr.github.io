var name = 'PizzaSquat';
var communityMirrorServiceUUID = '13333333-3333-3333-3333-333333333337';
var characteristics = { 
  idrequest: '13333333-3333-3333-3333-333333330001',
  username: '13333333-3333-3333-3333-333333330002',
  password: '13333333-3333-3333-3333-333333330003' 
};

var toppingsEls = document.getElementById('register');
var username = document.getElementById('username');
var password = document.getElementById('password');
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
var readyCM = function() {
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
var readyIDReq = function(toppings) {
  var iDReq = new Uint8Array(1);

  var idRequestCharacteristic = cachedCharacteristics['idrequest'];
  if(idRequestCharacteristic == null) throw new Error('idrequestcharacteristic not found');
  return idRequestCharacteristic.writeValue(iDReq).catch(function(err) {
    alert('idrequest error');
    throw err;
  });
};

var readyUsername = function(username) {
  var usernameCharacteristic = cachedCharacteristics['username'];
  if(usernameCharacteristic == null) throw new Error('cant find usernamecharacterisitic!');

  var tempBuff = new Uint16Array([swap16('Alex')]);
  return usernameCharacteristic.writeValue(tempBuff);
};

var readyPassword = function(password) {
  var usernameCharacteristic = cachedCharacteristics['password'];
  if(usernameCharacteristic == null) throw new Error('cant find passwordcharacterisitic');

  var tempBuff = new Uint16Array([swap16('testpassword')]);
  return usernameCharacteristic.writeValue(tempBuff);
};
// get values from dom
var getIDReq = function() {
  if (toppingsEls.checked) return 2
  else return 1
};

var getUsername = function() {
  enc = new TextEncoder();
  return enc.encode(username.textContent);
};

var getPassword = function() {
  enc = new TextEncoder();
  return enc.encode(password.textContent);
};

// button listeners
var onStartButtonClick = function(e) {
  if(communityMirrorServer != null && communityMirrorServer.connected) {
    alert('Already connected...');
    return;
  }
  readyCM().then(function() {
    alert('Connection successful!');
  });
};

var onLoginButtonClick = function(e) {
  if(communityMirrorServer == null || !communityMirrorServer.connected) {
    alert('Not connected!');
    return;
  }

  readyIDReq(getIDReq())
      .then(() => readyUsername(getUsername()))
      .then(() => readyPassword(getPassword()))
};

var log = function(text) {
  outputEl.textContent = text;
}

document.addEventListener('DOMContentLoaded', function() {
  if(navigator.bluetooth) {
    outputEl.textContent = 'ready.';
  }
});
