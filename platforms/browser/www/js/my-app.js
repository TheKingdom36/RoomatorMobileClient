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

/*myApp.onPageInit('index', function (page) {
    var url_string = window.location.href;
    var url = new URL(url_string);
    console.log(url_string);
    var c = url.searchParams.get("register");
    console.log(c);
    if(c != null){
        document.getElementById("messageDisplay").innerHTML = "Successfully logged in";
    }
    
});
*/
var map;
var User;
var currentLocation = {
    "lat": 0,
    "lng": 0
};

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

var LoginFormat = {
    "email": "",
    "password": "",
    "location": {
        "latitude": 0,
        "longitude": 0
    }
};


myApp.onPageInit('about', function (page) {
    // Do something here for "about" page


});

myApp.onPageInit('RoommateList', function (page) {
    FindRoommatesRequest(100, currentLocation.lat, currentLocation.lng);

    map = new google.maps.Map(document.getElementById('map'),
        {
            zoom: 15,
            center: currentLocation
        }
    );

});


var ServerValues = {
    loginEndpoint: "http://127.0.0.1:8081/login",
    registrationEndpoint: "http://127.0.0.1:8081/registration",
    getRoommatesEndpoint: "http://127.0.0.1:8081/getRoommates"

}

function Login() {

    LoginFormat.email = document.getElementById("loginEmail").value;
    LoginFormat.password = document.getElementById("loginPassword").value;
    LoginFormat.location.latitude = currentLocation.lat;
    LoginFormat.location.longitude = currentLocation.lng;

    SendLoginRequest(LoginFormat, LoginCallback);
}

function SendLoginRequest(LoginFormat, LoginCallback) {
    var url = ServerValues.loginEndpoint;
    var http = new XMLHttpRequest();
    // Preparing the request
    http.open("POST", url, true);
    http.setRequestHeader('Content-Type', 'application/json');
    // Sending the request
    http.send(JSON.stringify(LoginFormat));

    // Called when we get a response
    http.onreadystatechange = (e) => {
        // Getting the response in a text format
        var response = http.response;
        // converting the response from a text format to a json format

        try {
            var responseJSON = JSON.parse(response);
            LoginCallback(responseJSON);
        }
        catch (err) {
            console.log(err.message);
        }

    }

}

var LoginCallback = function (JsonObject) {

    if (JsonObject.length >= 1) {
        User = JsonObject;
        mainView.router.loadPage({ url: 'RoommateList.html', ignoreCache: true, reload: true });
    } else {
        document.getElementById("errorDisplay").innerHTML = "Your credentails are wrong";
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

    SendRegisterRequest(RegistrationFormat, RegistrationCallback);

}


function geoCallback(position) {
    console.log("here");
    currentLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
    }

    console.log(currentLocation);
}

function onError(message) {
    console.log("error Message:" + message);
}


function SendRegisterRequest(RegistrationFormat, RegistrationCallback) {
    var url = ServerValues.registrationEndpoint;
    var http = new XMLHttpRequest();
    // Preparing the request
    http.open("POST", url, true);
    http.setRequestHeader('Content-Type', 'application/json');
    // Sending the request

    http.send(JSON.stringify(RegistrationFormat));

    // Called when we get a response
    http.onreadystatechange = (e) => {
        // Getting the response in a text format
        var response = http.response;
        // converting the response from a text format to a json format

        try {
            var responseJSON = JSON.parse(response);

            RegistrationCallback(responseJSON);
        }
        catch (err) {
            console.log("Error" + err.message);
        }



    }
}




var RegistrationCallback = function (JsonObject) {
    if (JsonObject == true) {
        mainView.router.loadPage({ url: 'index.html', ignoreCache: true, reload: true });
    }

}



function FindRoommatesRequest(range, currentlatitude, currentlongitude) {
    var url = ServerValues.getRoommatesEndpoint + "?range=" + range + "&userLatitude=" + currentlatitude + "&userLongitude=" + currentlongitude;
    var http = new XMLHttpRequest();
    var response
    // Preparing the request
    http.open("GET", url, true);
    http.setRequestHeader('Content-Type', 'application/json');

    // Sending the request

    http.send();


    // Called when we get a response
    http.onreadystatechange = (e) => {
        // Getting the response in a text format
        response = http.response;
        // converting the response from a text format to a json format
        var responseJSON = JSON.parse(response);
        console.log(response);
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

    if (Roommates.length > 0) {


        var filteredRoommates = FilterRoommates(Roommates);
        var html = "";
        console.log("Roomates: ");
        console.log(Roommates);
        for (var i = 0; i < filteredRoommates.length; i++) {
            updateMap(filteredRoommates[i].currentLocation.latitude, filteredRoommates[i].currentLocation.longitude);

            html += '<div class="Roommate">'
                + '<p class="RoommateName">' + filteredRoommates[i].username + '</p>'
                + '<p class="RoommateAge">' + filteredRoommates[i].age + '</p>'
                + '<p class="RoommateLatitude">' + filteredRoommates[i].currentLocation.latitude + '</p>'
                + '<p class="RoommateLongitude">' + filteredRoommates[i].currentLocation.longitude + '</p>'
                + '</div>';
        }

        document.getElementById("roommates").innerHTML = html;
    } else {
        console.log("There was no roommates in range");
    }

}

function FilterRoommates(Roommates) {
    var filteredRoommates = [];

    for (var i = 0; i < Roommates.length; i++) {
        console.log(User);
        console.log(Roommates[i].age + " " + User[0].age + " " + User[0].smoker);
        console.log(Roommates[i].smoker == User[0].smoker);
        console.log((Roommates[i].age + 10) >= User[0].age);
        console.log((Roommates[i].age - 10) <= User[0].age)
        if ((Roommates[i].smoker == User[0].smoker) && ((Roommates[i].age + 10) >= User[0].age) && ((Roommates[i].age - 10) <= User[0].age)) {
            console.log("Filtered:" + Roommates[i]);
            filteredRoommates.push(Roommates[i]);
        }
    }

    return filteredRoommates;
}


function updateMap(lat, long) {
    var position = { lat: lat, lng: long };


    var marker = new google.maps.Marker({
        position: position,
        map: map
    });
}





