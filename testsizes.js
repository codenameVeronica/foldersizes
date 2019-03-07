var folders = require('./folders.js');
var filesize = require("file-size");

var baseDir = ".";

baseDir = (process.argv.length > 2) ? process.argv[2] : baseDir;

var tree = {};

tree['c:'] = {size: 99999};
tree['c:'].dirs = {};
tree['c:'].dirs['Program Files'] = {size: 1000};

var a = 0;
var b = 0;

var stepsVals = [];

folders.analyzeDir(baseDir, function(size, dirMap){
    console.log("\n\nDONE CALCULATING");
    console.log(baseDir + " -> " + size + " bytes");
    //console.log(JSON.stringify(dirMap));
    
    console.log("Media stats for: " + baseDir);
    console.log("Videos: " + filesize(dirMap.mediaStats.videos).human());
    console.log("Music: " + filesize(dirMap.mediaStats.music).human());
    console.log("Pictures: " + filesize(dirMap.mediaStats.pictures).human());
    console.log("Documents: " + filesize(dirMap.mediaStats.documents).human());
    console.log("Program files: " + filesize(dirMap.mediaStats.program).human());
    console.log("Archives: " + filesize(dirMap.mediaStats.archives).human());
    console.log("Trash files: " + filesize(dirMap.mediaStats.trash).human());
    console.log("Unreckognized files: " + filesize(dirMap.mediaStats.unknown).human());
    
}, function(data){
    a += data.done;
    b += data.added;
    // console.log(a + "/" + b);
    var _steps = ((a/b)*100)/2;
    stepsVals.push(_steps);
    if (stepsVals.length > 101000)
        stepsVals = stepsVals.slice(stepsVals.length - 100000);
    
    var avg = 0;
    for (var i = 0; i < stepsVals.length; i++)
        avg += stepsVals[i];
    avg = avg / stepsVals.length;
    
    var steps = avg;
    
    var bar = "[";
    for (var i = 0; i < steps; i++)
        bar += "*";
    for (var i = steps; i < 50; i++)
        bar += "-";
    bar += "]";
    process.stdout.write("\r" + bar + " " + ((a/b)*100).toFixed(0) + "% done");
});