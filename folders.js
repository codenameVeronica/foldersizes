var fs = require('fs');
var filesize = require("file-size");

var baseDir = ".";

var showProgress = 0;

var formatMap = {
    videos: ["mpeg", "avi", "mpg", "asf", "mkv", "mov"],
    music: ["mp3", "mp2", "wav", "aiff", "ogg", "amr"],
    pictures: ["jpeg", "jpg", "png", "bmp", "tiff", "gif"],
    documents: ["doc", "docx", "pdf", "xls", "xlsx", "ppt", "txt"],
    program: ["exe", "dll", "db", "pak", "chm", "js", "py", "rb", "css", "html", "so", 'lib', 'a', 'c', 'cpp', 'h', 'hpp'],
    archives: ['zip', "rar", "tar", "gz", "7z"],
    trash: ['log', 'bak', '$$$', 'old', '']
}

function getMediaTypeByFileName(fileName)
{
    var splits = fileName.split('.');
    if (splits.length < 2)
        return "unknown";
    
    var ext = splits[splits.length-1];
    
    // console.log("EXT: " + ext);
    
    var retType = 'unknown';
    
    for (var t in formatMap)
    {
        formatMap[t].forEach(function(element, index, array)
        {
            if (element == ext)
            {
                //console.log("recog: " + ext + " -> " + t);
                retType = t;
            }
        });
    };
    
    return retType;
}

function analyzeDir(dir, cb, progressCB)
{
    var totalSize = 0;
    
    var dirMap = {dirs: {}, files: {}, size: -1, mediaStats: {videos: 0, music: 0, pictures: 0, documents: 0, program: 0, unknown: 0, archives: 0, trash: 0}};
    
    if (showProgress)
        console.log("Entering: " + dir);
    
    fs.readdir(dir + "/", function(err, files){
        if (progressCB)
        {
            progressCB({added: files.length, done: 0});
        }
        if (showProgress)
            console.log(files.length + " nodes in this directory");
        var nodesDone = 0;
        if (files.length == 0)
        {
            dirMap.size = 0;
            dirMap.humanSize = filesize(0).human();
            cb(0, dirMap);
        }
        files.forEach(function(element, index, array){
            // console.log(element);
            var elementPath = dir + "/" + element;
            fs.lstat(elementPath, function(err, stats) {
                if (err)
                {
                    console.log("Error gettings stats for: " + elementPath);
                    console.log("Error code: " + err.code);
                    nodesDone++;
                    if (progressCB)
                    {
                        progressCB({added: 0, done: 1});
                    }
                    if (nodesDone == files.length)
                    {
                        dirMap.size = totalSize;
                        dirMap.humanSize = filesize(totalSize).human();
                        cb(totalSize, dirMap);
                    }
                }
                /*else if (stats.isBlockDevice() || stats.isCharacterDevice() || stats.isSymbolicLink() || stats.isFIFO || stats.isSocket())
                {
                    console.log("Skipping node: " + elementPath);
                    nodesDone++;
                    if (nodesDone == files.length)
                        cb(totalSize);
                }*/
                else if (stats.isDirectory())
                {
                    var dirPath = elementPath;
                    analyzeDir(dirPath, function(size, map){
                        if (showProgress)
                            console.log("[dir] " + dirPath + " -> " + size + " bytes");
                        dirMap.dirs[element] = map;
                        map.parentDirMap = dirMap;
                        dirMap.mediaStats['videos'] += map.mediaStats['videos'];
                        dirMap.mediaStats['music'] += map.mediaStats['music'];
                        dirMap.mediaStats['pictures'] += map.mediaStats['pictures'];
                        dirMap.mediaStats['documents'] += map.mediaStats['documents'];
                        dirMap.mediaStats['program'] += map.mediaStats['program'];
                        dirMap.mediaStats['archives'] += map.mediaStats['archives'];
                        dirMap.mediaStats['trash'] += map.mediaStats['trash'];
                        dirMap.mediaStats['unknown'] += map.mediaStats['unknown'];
                        totalSize += size;
                        nodesDone++;
                        if (progressCB)
                        {
                            progressCB({added: 0, done: 1});
                        }
                        if (nodesDone == files.length)
                        {
                            dirMap.size = totalSize;
                            dirMap.humanSize = filesize(totalSize).human();
                            cb(totalSize, dirMap);
                        }
                    }, progressCB);
                }
                else
                {
                    if (showProgress)
                        console.log(elementPath + " -> " + stats.size);
                    dirMap.mediaStats[getMediaTypeByFileName(element)] += stats.size;    
                    //console.log(JSON.stringify(dirMap));
                    dirMap.files[element] = {size: stats.size, humanSize: filesize(stats.size).human()};
                    totalSize += stats.size;
                    nodesDone++;
                    if (progressCB)
                    {
                        progressCB({added: 0, done: 1});
                    }
                    if (nodesDone == files.length)
                    {
                        dirMap.size = totalSize;
                        dirMap.humanSize = filesize(totalSize).human();
                        cb(totalSize, dirMap);
                    }
                }
                
                
                
            });
        });
    });
}

/*
baseDir = (process.argv.length > 2) ? process.argv[2] : baseDir;

var tree = {};

tree['c:'] = {size: 99999};
tree['c:'].dirs = {};
tree['c:'].dirs['Program Files'] = {size: 1000};

var a = 0;
var b = 0;

var stepsVals = [];

analyzeDir(baseDir, function(size, dirMap){
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

*/
module.exports.analyzeDir = analyzeDir;