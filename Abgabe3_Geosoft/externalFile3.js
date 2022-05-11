

/**Abfrage der Location des Benutzers*/

var x = document.getElementById("1");

function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(showPosition);
  } else { 
    x.innerHTML = "Geolocation is not supported by this browser.";
  }
}

function showPosition(position) {
  x.innerHTML = "Latitude: " + position.coords.latitude + 
  "<br>Longitude: " + position.coords.longitude;
}

let element = document.getElementById("1");

element.onclick = function()
{ console.log("1")
     alert (showPosition)
}




/** response_1652097618763.json parsen*/

const response_1652097618763 = JSON.parse(response_1652097618763)


/** Requeste Koordinaten der Haltestellen*/

function standort(position) {
  standort = [position.coords.longitude, position.coords.latitude];
  var x = new XMLHttpRequest();

  x.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200){
      let response = JSON.parse(this.responseText);
      showPosition(response);
    }
  };
x.open("GET", "https://rest.busradar.conterra.de/prod/haltestellen", true );
x.send();

}

/**Distanzrechner*/
console.log(response)
console.log(getLocation)


function distance_calculator (lat1, lon1,  lat2, lon2)
{
    
    const R = 6371e3; /**metres */ 
    const φ1 = lat1 * Math.PI/180; /**  φ, λ in radians*/
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;
    
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    const d = R * c; /**  in metres */

    return d
}

/**ForEach-Schleife berechnet Distanz aller Punkte den Orten mit dem Punkt von dem Standort des Benutzers*/
var sortedList = [];
response.forEach(element => { 
    var result = (distance_calculator (element[0], element [1], point[0], point [1]))  ;
    sortedList.push(result);
    sortedList.sort();
});


/**For-Each-Schleife, die durch die Sorted List durchgeht*/
sortedList.forEach(element => {
    document.getElementById("2").innerHTML += element + "<br>";
})













