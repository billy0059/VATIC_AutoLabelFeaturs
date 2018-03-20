var doubtFrame = {};
var doubtPlayerIndex = 0;

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
}
