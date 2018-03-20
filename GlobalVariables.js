var doubtFrame = {};
var revisionRecord = {};
var doubtPlayerIndex = 0;

function updateTips(frame, doubtFrame){
    if (frame in doubtFrame){
        $("#doubtFont").empty();
        var content = "";
        for (var i = 0; i<revisionRecord[frame].length; i++){
            var object = doubtFrame[frame][i];
            if( revisionRecord[frame][i] == 0){
                content += "<font color='red'>" + object + "</font>, ";
            }
            else{
                content += "<font color='green'>" + object + "</font>, ";
            }
        }
        $(content).appendTo($("#doubtFont"));
    }
    else{

        $("#doubtFont").empty();
        $("<font color='blue'>None</font>").appendTo($("#doubtFont"));
    }
}

function doubtFrameSet(jobSlug){
    var folderLocation = "DumpFiles0313/";
    
    var fileNameFirstAppear = jobSlug + "FirstAppear.json";
    var fileNameTempDis = jobSlug + "TempDisappear.json";
    var fileNameReg = jobSlug + "RegressionDoubt.json";
    //var fistAppearLines = $.get(folderLocation+fileName);

    var fistAppear = JSON.parse($.ajax({type: "GET", url: folderLocation+fileNameFirstAppear, async: false}).responseText);
    var tempDis = JSON.parse($.ajax({type: "GET", url: folderLocation+fileNameTempDis, async: false}).responseText);
    var reg = JSON.parse($.ajax({type: "GET", url: folderLocation+fileNameReg, async: false}).responseText);
    //console.log(fistAppearLines);
    //fistAppearLines = fistAppearLines.split('\n');
    // get the doubtFrame dictionary
    
    for (var pathName in fistAppear){
        if(fistAppear[pathName].length != 0){
            for (frame in fistAppear[pathName]){
                //console.log(tempDis[pathName][frame]);
                if (fistAppear[pathName][frame].toString() in doubtFrame){
                    doubtFrame[fistAppear[pathName][frame].toString()].push(pathName);
                }
                else {
                    doubtFrame[fistAppear[pathName][frame].toString()] = [];
                    doubtFrame[fistAppear[pathName][frame].toString()].push(pathName);
                }
            }
        }
    }
    
    for (var pathName in tempDis){
        //console.log(pathName);
        if(tempDis[pathName].length != 0){
            for (frame in tempDis[pathName]){
                //console.log(tempDis[pathName][frame]);
                if (tempDis[pathName][frame].toString() in doubtFrame){
                    doubtFrame[tempDis[pathName][frame].toString()].push(pathName);
                }
                else {
                    doubtFrame[tempDis[pathName][frame].toString()] = [];
                    doubtFrame[tempDis[pathName][frame].toString()].push(pathName);
                }
            }
        }
    }

    for (var pathName in reg){
        //console.log(pathName);
        if(reg[pathName].length != 0){
            for (frame in reg[pathName]){
                //console.log(reg[pathName][frame]);
                if (reg[pathName][frame].toString() in doubtFrame){
                    doubtFrame[reg[pathName][frame].toString()].push(pathName);
                }
                else {
                    doubtFrame[reg[pathName][frame].toString()] = [];
                    doubtFrame[reg[pathName][frame].toString()].push(pathName);
                }
            }
        }
    }
    
    // assgin values to revisionRecord
    for (var key in doubtFrame){
        console.log(key);
        console.log(doubtFrame[key]);
        /*var array = [];
        for (var i; i<doubtFrame[key].length; i++){
            array.push(0);
        }*/
        revisionRecord[key] = new Array(doubtFrame[key].length).fill(0);
    }
    
    console.log(revisionRecord);
    
}
