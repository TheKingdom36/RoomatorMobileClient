// Initialize app
var myApp = new Framework7();


// If we need to use custom DOM library, let's save it to $$ variable:
var $$ = Dom7;

// Add view
var mainView = myApp.addView('.view-main', {
    // Because we want to use dynamic navbar, we need to enable it for this view:
    dynamicNavbar: true
});



// Handle Cordova Device Ready Event
$$(document).on('deviceready', function () {
    console.log("Device is ready!");
    navigator.geolocation.getCurrentPosition(geoCallback, onError);
});

//Google map object
var map;
//Current user details
var User;
//html silder
var distanceSilder;
//current value of the distnace silder
var silderValue;
//Current location of the user
var currentLocation = {
    "lat": 0,
    "lng": 0
};
//Format of registration request
var RegistrationFormat = {
    "userPubInfo": {
        "username": "",
        "email": "",
        "firstname": "",
        "lastname": "",
        "isSmoker": true,
        "age": 0,
        "currentLocation": {
            "latitude": 0.0,
            "longitude": 0.0
        }

    },
    "userPriInfo": {
        "password": ""
    }

};
//Format of login request
var LoginFormat = {
    "email": "",
    "password": "",
    "location": {
        "latitude": 0,
        "longitude": 0
    }
};

//Server endpoints
var ServerValues = {
    loginEndpoint: "http://127.0.0.1:8081/login",
    registrationEndpoint: "http://127.0.0.1:8081/registration",
    getRoommatesEndpoint: "http://127.0.0.1:8081/getRoommates"
};

//Run when the roommateList page is loaded
myApp.onPageInit('RoommateList', function (page) {
    ClearErrorDisplay();

    //Creates a new map 
    map = new google.maps.Map(document.getElementById('map'),
        {
            zoom: 13,
            center: currentLocation
        }
    );
    //Adds current location
    addMarkerToMap(currentLocation.lat, currentLocation.lng, "red");

    //set distance Silder
    distanceSilder = document.getElementById("distanceSilder");
    //set silder value
    silderValue = document.getElementById("silderValue");
    silderValue.innerHTML = distanceSilder.value; // Display the default slider value

    // Update the current slider value (each time you drag the slider handle)
    distanceSilder.oninput = function () {
        silderValue.innerHTML = this.value;
    };
  
    FindRoommates();
});

//Run when the registration page is loaded
myApp.onPageInit('registration', function (page) {
    ClearErrorDisplay();
});

//Run when the login page is loaded
myApp.onPageInit('login', function (page) {
    ClearErrorDisplay();
    console.log("login page");
});

//Run when the index page is loaded
myApp.onPageInit('index', function (page) {
    ClearErrorDisplay();
    console.log("Index page");
});



function SendPostRequest(url,content,successCallback){
    var url = url;
    var http = new XMLHttpRequest();
    // Preparing the request
    http.open("POST", url, true);
    http.setRequestHeader('Content-Type', 'application/json');
    // Sending the request
    http.send(JSON.stringify(content));

    // Called when we get a response
    http.onreadystatechange = (e) => {
        // Getting the response in a text format
        var response = http.response;
        // converting the response from a text format to a json format
        console.log(response);

        try {
            var responseJSON = JSON.parse(response);
            successCallback(responseJSON);
        }
        catch (err) {
            console.log("Post Request Error " + err.message);
        }

    }
}



function Login() {

    LoginFormat.email = document.getElementById("loginEmail").value;
    LoginFormat.password = document.getElementById("loginPassword").value;
    LoginFormat.location.latitude = currentLocation.lat;
    LoginFormat.location.longitude = currentLocation.lng;

    SendPostRequest(ServerValues.loginEndpoint,LoginFormat, LoginCallback,LoginErrorCallback);
}

function LoginErrorCallback(){
    ShowErrorMessage("Login was unsuccessful");
}


var LoginCallback = function (JsonObject) {

    if (JsonObject.length >= 1) {
        User = JsonObject[0];
        mainView.router.loadPage({ url: 'RoommateList.html', ignoreCache: true, reload: true });
    } else {
        ShowErrorMessage("Your profile could not be found. Check your email and password");
    }
}


function Register() {
    RegistrationFormat.userPubInfo.username = document.getElementById("regUsername").value;
    RegistrationFormat.userPubInfo.email = document.getElementById("regEmail").value;
    RegistrationFormat.userPubInfo.firstname = document.getElementById("regFirstname").value;
    RegistrationFormat.userPubInfo.lastname = document.getElementById("regLastname").value;
    RegistrationFormat.userPubInfo.isSmoker = document.getElementById("regSmoker").value;
    RegistrationFormat.userPubInfo.age = document.getElementById("regAge").value;
    RegistrationFormat.userPubInfo.currentLocation.latitude = currentLocation.lat;
    RegistrationFormat.userPubInfo.currentLocation.longitude = currentLocation.lng;
    RegistrationFormat.userPriInfo.password = document.getElementById("regPassword").value;

    SendPostRequest(ServerValues.registrationEndpoint,RegistrationFormat, RegistrationCallback);
}

var RegistrationCallback = function (JsonObject) {
    if (JsonObject == true) {
        mainView.router.loadPage({ url: 'index.html', ignoreCache: true, reload: true });
    } else {
        ShowErrorMessage("Registration Failed! Check your details");
    }
}

function geoCallback(position) {
    currentLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
    }
}

function onError(message) {
    
    console.log("error Message:" + message);
}

function FindRoommates() {
    map = new google.maps.Map(document.getElementById('map'),
        {
            zoom: 13,
            center: currentLocation
        }
    );

    addMarkerToMap(currentLocation.lat,currentLocation.lng,"red");
    FindRoommatesRequest(distanceSilder.value, currentLocation.lat, currentLocation.lng);
}


function FindRoommatesRequest(range, currentlatitude, currentlongitude) {
    var url = ServerValues.getRoommatesEndpoint + "?range=" + range + "&userLatitude=" + currentlatitude + "&userLongitude=" + currentlongitude;
    var http = new XMLHttpRequest();
    // Preparing the request
    http.open("GET", url, true);
    http.setRequestHeader('Content-Type', 'application/json');

    // Sending the request
    http.send();


    // Called when we get a response
    http.onreadystatechange = (e) => {

        // Getting the response in a text format
        var response = http.response;

        try {
            var responseJSON = JSON.parse(response);
            PopulateHtmlWithRoommates(responseJSON);
        }
        catch (err) {
            console.log("Error:" + err.message)
        }


    }


}

function PopulateHtmlWithRoommates(Roommates) {
    var filteredRoommates = FilterRoommates(Roommates);
    document.getElementById("roommates").innerHTML="";
    if (filteredRoommates.length > 0) {
        
        var html = "";
    
        for (var i = 0; i < filteredRoommates.length; i++) {
            addMarkerToMap(filteredRoommates[i].currentLocation.latitude, filteredRoommates[i].currentLocation.longitude, "green");

            html += '<div class="Roommate">'
                + '<p>' + (i+1) + '.</p>'
                + '<table>'
                + '<tr>'
                + ' <td>Name</td>'
                + '<td>' + filteredRoommates[i].username + '</td>'

                + '</tr>'
                + '<tr>'
                + '<td>Age</td>'
                + '<td>' + filteredRoommates[i].age + '</td>'

                + '</tr>'
                + '<tr>'
                + ' <td>Latitude</td>'
                + '<td>' + filteredRoommates[i].currentLocation.latitude + '</td>'

                + '</tr>'
                + '<tr>'
                + '<td>Longitude</td>'
                + '<td>' + filteredRoommates[i].currentLocation.longitude + '</td>'

                + '</tr>'
                + '</table>'
                + '</div>';

        }
        
        document.getElementById("roommates").innerHTML = html;
    } else {
        ShowErrorMessage("There was no roommates in range");
    }

}

function FilterRoommates(Roommates) {
    var filteredRoommates = [];

    for (var i = 0; i < Roommates.length; i++) {
        if ((Roommates[i].username != User.username) && (Roommates[i].smoker == User.smoker) && ((Roommates[i].age + 10) >= User.age) && ((Roommates[i].age - 10) <= User.age)) {
            filteredRoommates.push(Roommates[i]);
        }
    }

    return filteredRoommates;
}


function addMarkerToMap(lat, long, color) {
    var position = { lat: lat, lng: long };
    var marker = new google.maps.Marker({
        position: position,
        map: map,
        icon: 'http://maps.google.com/mapfiles/ms/icons/' + color + '-dot.png'
    });
}

function ShowErrorMessage(message) {
    document.getElementById("ErrorPopUp").style.visibility = "visible";
    document.getElementById("ErrorPopUpMessage").innerHTML = message;
}

function ClearErrorDisplay() {
    document.getElementById("ErrorPopUp").style.visibility = "hidden";
    document.getElementById("ErrorPopUpMessage").innerHTML = "";
}

function BackToIndex() {
    mainView.router.loadPage({ url: 'index.html', ignoreCache: true, reload: true });
}








