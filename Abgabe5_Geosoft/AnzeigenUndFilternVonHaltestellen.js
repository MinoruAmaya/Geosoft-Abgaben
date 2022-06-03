//Aus der Beispiellösung von Abgabe 2

/**
* @function main the main function
*/
function main(point, pointcloud) {
    //sortiere Daten nach distanz und mach damit eine Tabelle auf der HTML
    let results = sortByDistance(point, pois);
    drawTable(results);
  }

/**
 * @function drawTable
 * @desc inserts the calculated data into the table that's displayed on the page
 * @param {*} results array of JSON with contains
 */
 function drawTable(results) {
    var table = document.getElementById("resultTable");
    //creates the Table with the direction an distances
    for (var j = 0; j < results.length; j++) {
      var newRow = table.insertRow(j + 1);
      var cel1 = newRow.insertCell(0);
      var cel2 = newRow.insertCell(1);
      var cel3 = newRow.insertCell(2);
      cel1.innerHTML = results[j].coordinates;
      cel2.innerHTML = results[j].name;
      cel3.innerHTML = results[j].distance;
    }
  }


  //Hier sollen die Bushaltestellen in der Map erscheinen

function showBusStopsOnMap(busStops)
{
  fetch("https://rest.busradar.conterra.de/prod/haltestellen")
  .then(response => response.json()) // return a promise as a result
  .then(data => { // get the data in the promise result
  console.log("TEST", data)
  data.features.forEach(element => {
    const coords = element.geometry.coordinates;
    console.log(coords)
  
  });
  new L.marker([coords[1],coords[0]]).addTo(map);
  })
  .catch(error => console.log(error))

}
showBusStopsOnMap(busStops)


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
  
  // AB HIER HABE ICH DIE BEISPIELLÖSUNG 03 VON Felix Niebl, Noel Schnierer GENOMMEN, DA MEINE LÖSUNG NICHT FUNKTIONIERT HAT
  
  
  /**
  * @function calculateResults Rechnet die Distanzen vom Standort und der Bushaltestellen
  */
  function calculateResults(point, busStops) {
    let results = sortByDistance(point, busStops);
  
    //get the departures of the nearest stop for the next 5 minutes.
    busAPI.departures(
      results[0].id, 300
    );
    DocumentInterface.updateDepartureHeader(results[0].name);
  
    //display the resulting geoJSON on the page
    DocumentInterface.displayGeojsonOnPage(
      GeoCalculator.formatStringifiedGeoJSON(
        JSON.stringify(busStops, null, "\t")
      ));
  
    DocumentInterface.clearTable('resultTable2');
    DocumentInterface.drawBusStopTable(results);
  }
  
  /**
  * @function sortByDistance
  * @desc takes a point and an array of points and sorts them by distance ascending
  * @param point array of [lon, lat] coordinates
  * @param pointArray array of points to compare to
  * @returns Array with JSON Objects, which contain coordinate and distance
  */
  function sortByDistance(point, pointArray) {
    let output = [];
  
    for (let i = 0; i < pointArray.features.length; i++) {
      let distance = GeoCalculator.twoPointDistance(point, pointArray.features[i].geometry.coordinates);
      let j = 0;
      //Searches for the Place
      while (j < output.length && distance > output[j].distance) {
        j++;
      }
      let newPoint = {
        index : i,
        coordinates: pointArray.features[i].geometry.coordinates,
        distance: Math.round(distance*100)/100,
  
        name : pointArray.features[i].properties.lbez,
        id: pointArray.features[i].properties.nr,
  
      };
      output.splice(j, 0, newPoint);
    }
  
    return output;
  }
  
  
  
  
  
  //declaration of global variables
  var busStops = [];
  var point;
  var departureList;
  
  
  /**
  * @function onLoad function that is executed when the page is loaded
  */
  async function onLoad() {
    busAPI.haltestellen();
  }
  
  /** Class for communicating with the BusAPI
  * 
  */
  class BusAPI{
    constructor(){
      this.x = new XMLHttpRequest();
      this.x.onerror = this.errorcallback;
      this.API_URL = "https://rest.busradar.conterra.de/prod";
    }
  
    /**
     * errorcallback
     * @desc load-callback method for this object's XHR-object
     */
    errorcallback(e){
      console.dir(e);
      alert("error. check web console.");
    }
  
    /**
     * haltestellen
     * @public
     * @desc method to retrieve bus-stop data from busAPI.
     * due to the nature of the class definition it will result in callback
     * functions being called as soon as a respnse from the resource server hits.
     * @see loadcallback
     * @see statechangecallback
     */
    haltestellen(){
      this.x.onload = this.busStopListLoadcallback;
      this.x.onreadystatechange = this.busStopListStatechangecallback;
      let resource = this.API_URL+"/haltestellen";
      this.x.open("GET", resource, true);
      this.x.send();
  
      return(true);
    }
  
    /**
     * departures
     * @public
     * @desc method to retrieve upcoming departues from a given bus stop.
     * functions simlar to haltestellen. is called once nearest bus stop is known.
     * callback functions will do further work.
     * @param busStopNr the number of the bus stop as returned by the api.
     * @param time seconds from now during which departures are to be shown. defaults to 300 (5 minutes)
     * @see haltestellen
     * @see statechangecallback
     */
    departures(busStopNr, time){
      this.x.onload = this.departureLoadcallback;
      this.x.onreadystatechange = this.departureStatechangecallback;
  
      let resource = this.API_URL+`/haltestellen/${busStopNr}/abfahrten?sekunden=`;
      resource += time || 300;
  
      this.x.open("GET", resource, true);
      this.x.send();
  
      DocumentInterface.clearTable("nextDeparturesTable");
  
      return(true);
    }
  
    /**
     * busStopListloadcallback
     * @desc is called when the stop list is successfully loaded from the bus api.
     * in this case it tells the page to re-calculate the distances with the new
     * bus stop data. The page then proceeds to update the table.
     * more info on https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequestEventTarget/onload
     * @see busStopListStatechangecallback
     */
    busStopListLoadcallback(){
      if(this.status == "200" && this.readyState == 4){
        calculateResults(point, busStops);
      }
    }
  
    /**
     * busStopListstatechangecallback
     * @desc method that is called when state of XHR-object changes.
     * This usually means it's called when data is received from the bus api
     * When it's received data from the bus api, it will parse it and redefine
     * the busStops with the bus stop data.
     * @see busStopListloadcallback
     *
     * more info on https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/onreadystatechange
     */
    busStopListStatechangecallback(){
      if (this.status == "200" && this.readyState == 4){
        busStops = JSON.parse(this.responseText);
      }
    }
  
    /**
     * departureLoadcallback
     * @desc is called when the departure data is successfully loaded from the bus api.
     * @see departureStatechangecallback
     */
    departureLoadcallback(){
      if(this.status == "200" && this.readyState == 4){
        DocumentInterface.drawDepartureTable(departureList);
      }
    }
  
    /**
     * busStopListstatechangecallback
     * @desc method that is called when state of XHR-object changes.
     * This one saves the data of the bus departure list to a global variable.
     * @see departureLoadcallback
     */
    departureStatechangecallback(){
      if (this.status == "200" && this.readyState == 4){
        departureList = JSON.parse(this.responseText);
      }
    }
  
  }
  
  
  /** Class containing all static methods for displaying data on page */
  class DocumentInterface{
  
    /**
     * showPosition
     * @public
     * @desc Shows the position of the user in the textarea.
     * callback function that is passed by getLocation
     * @see getLocation
     * @param {*} position Json object of the user
     */
    static showPosition(position) {
      var x = document.getElementById("userPosition");
      //"Skeleton" of a valid geoJSON Feature collection
      let outJSON = { "type": "FeatureCollection", "features": [] };
      //skelly of a (point)feature
      let pointFeature = {"type": "Feature","properties": {},"geometry": {"type": "Point","coordinates": []}};
      pointFeature.geometry.coordinates = [position.coords.longitude, position.coords.latitude];
      //add the coordinates to the geoJson
      outJSON.features.push(pointFeature);
      x.innerHTML = JSON.stringify(outJSON);
    }
  
    /**
     * getLocation
     * @public
     * @desc function that requests the geographic position of the browser
     * @see getPosition
     */
    static getLocation() {
      var x = document.getElementById("userPosition");
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(this.showPosition);
      } else {
        x.innerHTML = "Geolocation is not supported by this browser.";
      }
    }
  
    /**
     * drawBusStopTable
     * @desc inserts the bus stop list into the Table on the web-page
     * @param {*} results array of JSON with contains
     */
    static drawBusStopTable(results) {
      var table = document.getElementById("resultTable2");
      //creates the Table with the distances
      for (var j = 0; j < results.length; j++) {
        var newRow = table.insertRow(j + 1);
        var cel1 = newRow.insertCell(0);
        var cel2 = newRow.insertCell(1);
        var cel3 = newRow.insertCell(2);
        cel1.innerHTML = results[j].name;
        cel2.innerHTML = results[j].coordinates;
        cel3.innerHTML = results[j].distance;
      }
    }
  
    /**
     * drawBusStopTable
     * @desc inserts the results into the Table on the web-page
     * @param {*} results array of JSON with contains
     */
    static drawDepartureTable(results){
      var table = document.getElementById("nextDeparturesTable");
      for (var j = 0; j < results.length; j++) {
        var newRow = table.insertRow(j + 1);
        var cel1 = newRow.insertCell(0);
        var cel2 = newRow.insertCell(1);
        var cel3 = newRow.insertCell(2);
        cel1.innerHTML = results[j].linienid;
        cel2.innerHTML = results[j].richtungstext;
        cel3.innerHTML = this.time(results[j].abfahrtszeit);
      }
    }
  
    /**
     * updateDepartureHeader
     * @desc updates the header above the departure table with the name of the stop.
     * @param {*} results array of JSON with contains
     */
    static updateDepartureHeader(busStopName){
      if(busStopName === undefined){
        document.getElementById("nextDeparturesHeader").innerHTML = "no upcoming departures";
      } else {
        let message = "upcoming departures from " + busStopName;
        document.getElementById("nextDeparturesHeader").innerHTML = message;
      }
  
    }
  
    /**
     * clearTable
     * @desc removes all table entries and rows except for the header.
     * @param tableID the id of the table to clear
     */
    static clearTable(tableID){
      //remove all table rows
      var tableHeaderRowCount = 1;
      var table = document.getElementById(tableID);
      var rowCount = table.rows.length;
      for (var i = tableHeaderRowCount; i < rowCount; i++) {
        table.deleteRow(tableHeaderRowCount);
      }
    }
  
    /**
     * displayGeojsonOnPage
     * @desc psuhes a given string onto the geoJSON-id'd tag in the DOM.
     * @param geoJSONString string, expected to represent geojson but can be anything.
     */
    static displayGeojsonOnPage(geoJSONString){
      document.getElementById('geoJSON').innerHTML = geoJSONString;
    }
  
    /**
     * time
     * @desc takes a second-value (as in seconds elapsed from jan 01 1970) of the time and returns the corresponding time.
     * source: https://stackoverflow.com/a/35890816
     * @param seconds time in milliseconds
     */
    static time(seconds) {
      seconds = parseInt(seconds); //ensure the value is an integer
      var ms = seconds*1000;
      var time = new Date(ms).toISOString().slice(11, -5);
      return time + " GMT";
    }
  
  
  }
  
  
  
  /** Class containing all static methods for geographic distance calculation */
  class GeoCalculator{
  
    /**
    * twoPointDistance
    * @public
    * @desc takes two geographic points and returns the distance between them. Uses the Haversine formula (http://www.movable-type.co.uk/scripts/latlong.html, https://stackoverflow.com/questions/27928/calculate-distance-between-two-latitude-longitude-points-haversine-formula)
    * @param start array of [lon, lat] coordinates
    * @param end array of [lon, lat] coordinates
    * @returns the distance between 2 points on the surface of a sphere with earth's radius
    */
    static twoPointDistance(start, end) {
      //variable declarations
      var earthRadius; //the earth radius in meters
      var phi1;
      var phi2;
      var deltaLat;
      var deltaLong;
  
      var a;
      var c;
      var distance; //the distance in meters
  
      //function body
      earthRadius = 6371e3; //Radius
      phi1 = this.toRadians(start[1]); //latitude at starting point. in radians.
      phi2 = this.toRadians(end[1]); //latitude at end-point. in radians.
      deltaLat = this.toRadians(end[1] - start[1]); //difference in latitude at start- and end-point. in radians.
      deltaLong = this.toRadians(end[0] - start[0]); //difference in longitude at start- and end-point. in radians.
  
      a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLong / 2) * Math.sin(deltaLong / 2);
      c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      distance = earthRadius * c;
  
      return distance;
    }
  
    /**
    * toRadians
    * @public
    * @desc helping function, takes degrees and converts them to radians
    * @returns a radian value
    */
    static toRadians(degrees) {
      var pi = Math.PI;
      return degrees * (pi / 180);
    }
  
    /**
    * toDegrees
    * @public
    * @desc helping function, takes radians and converts them to degrees
    * @returns a degree value
    */
    static toDegrees(radians) {
      var pi = Math.PI;
      return radians * (180 / pi);
    }
  
    /**
    * @function formatStringifiedGeoJSON
    * @desc formats String of geojson so it has whitespace and line breaks
    * @param text String of the text that is to be displayed
    * @returns String, html formatted geoJSON
    */
    static formatStringifiedGeoJSON(text){
      //replace line-breaks with according html
      text = text.replace(/(?:\r\n|\r|\n)/g, '<br>');
      //replace white space with according html
      text = text.replace(/\s/g, '&nbsp');
      return text;
    }
  }
  
  /** Class containing methods for geoJSON processing*/
  class GeoJSON{
    constructor(){
      this.featureCollection = { "type": "FeatureCollection", "features": [] };
      this.pointFeature = { "type": "Feature", "properties": {}, "geometry": { "type": "Point", "coordinates": [] } };
    }
  
    /**
    * arrayToGeoJSON
    * @public
    * @desc method that converts a given array of points into a geoJSON feature collection.
    * @param inputArray Array that is to be converted
    * @returns JSON of a geoJSON feature collection
    */
    arrayToGeoJSON(inputArray) {
      //"Skeleton" of a valid geoJSON Feature collection
      let outJSON = this.featureCollection;
  
      //turn all the points in the array into proper features and append
      for (const element of inputArray) {
        let newFeature = this.pointFeature;
        newFeature.geometry.coordinates = element;
        outJSON.features.push(JSON.parse(JSON.stringify(newFeature)));
      }
  
      return outJSON;
    }
  
    /**
    * isValidGeoJSONPoint
    * @public
    * @desc method that validates the input GeoJSON so it'S only a point
    * @param geoJSON the input JSON that is to be validated
    * @returns boolean true if okay, false if not
    */
    isValidGeoJSONPoint(geoJSON) {
      if (geoJSON.features.length == 1 &&
        geoJSON.features[0].geometry.type.toUpperCase() == "POINT"
      ) {
        return true;
      } else {
        return false;
      }
    }
  
  }
  
  //##############################################################################
  //## OBJECTS
  //##############################################################################
  const geoJSON = new GeoJSON();
  const busAPI = new BusAPI();