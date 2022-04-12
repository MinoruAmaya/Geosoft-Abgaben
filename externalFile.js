
console.log(cities)
console.log(point)
function distance_calculator (lat1, lon1,  lat2, lon2)
{
    
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI/180; // φ, λ in radians
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;
    
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    const d = R * c; // in metres

    return d
}

//Beispiel Distanz zwischen Köln und Amsterdam
var x = distance_calculator (6.9570,50.9367, 4.9041, 52.3676)
console.log("Distanz zwischen den beiden Punkten ist", x)


//ForEach-Schleife berechnet Distanz aller Punkte der Städte mit dem Punkt aus point.js
var sortedList = [];
cities.forEach(element => { 
    var result = (distance_calculator (element[0], element [1], point[0], point [1]))  ;
    sortedList.push(result);
    sortedList.sort();
});

console.log(sortedList)


   
//For-Each-Schleife, die durch die Sorted List durchgeht
sortedList.forEach(element => {
    document.getElementById("1").innerHTML += element + "<br>";
})