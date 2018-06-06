var doubtFrame = {};
var revisionRecord = {};
var doubtPlayerIndex = 0;

var dynamicDoubtFrame = {};

var mergeLog = {}; // mergeLog["1_2"] --> object 1 and 2
var appearLog = {}; // appearLog["1"] = 1 --> 1 appear
var DAlog = {};
var DPlog = {};

// human supervision case order

var stage = 0;
var stageButton = 1;
var caseMerge1 = 0;
var merge1ID = "";
var caseMerge2 = 0;
var merge2ID = "";


var disappear = [];
var caseFP = 0;
var fpTrID = "";
var caseDisappear = 0;
var DATrID = "";
var caseDisplacement = 0;
var DPTrID = "";

var merge1Count = 0;
var merge2Count = 0;
var fpCount = 0;
var DACount = 0;
var DPCount = 0;



//console.log(caseDisplacement);
function disappearDoubt(tracks){
	console.log(tracks);
    var appearHistory = 0;
    var subtrahend = [];
    var disappearTemp = [];
    var disappear = {};

    for (var trackIndex in tracks){ // for each track
        if (!tracks[trackIndex].deleted){
            var keys = Object.keys(tracks[trackIndex].journal.annotations); //[0, 255, 258]
            //var labelName = job.labels[tracks[trackIndex].label] + (parseInt(trackIndex)+1).toString() + "(disappear)";
            console.log(keys);
            appearHistory = 0;
            disappearTemp = [];
            subtrahend = [];
            for(var key in keys){
                if (tracks[trackIndex].journal.annotations[keys[key]].outside == false){
                    appearHistory = 1;
                }
                if(appearHistory == 1 && tracks[trackIndex].journal.annotations[keys[key]].outside == true){
                    disappearTemp.push(keys[key]);
                    subtrahend.push(keys[key]);
                }
                if(tracks[trackIndex].journal.annotations[keys[key]].outside == false){
                    subtrahend = [];
                }
            }

            for (var i in subtrahend){
                //console.log(subtrahend[i]);
                var index = disappearTemp.indexOf(subtrahend[i]);
                disappearTemp.splice(index, 1);
            }

            disappear[trackIndex.toString()] = disappearTemp;
        }

    }
    console.log(disappear);
    return disappear;
}



function dynamicDoubtFrameSet(trackCollection, job){
	var tracks = trackCollection.tracks;

	console.log("Gaining dynamicDoubtFrameSet ... ");
	console.log(tracks);
	console.log(tracks.length);

	var firstAppear = {};
	var disappear = {};

	// for the object first appear frame
	for (var trackIndex in tracks){
		var keys = Object.keys(tracks[trackIndex].journal.annotations);
		for(var key in keys){
			if (tracks[trackIndex].journal.annotations[keys[key]].outside == false){ // got the first appear frame
			    var labelName = job.labels[tracks[trackIndex].label] + (parseInt(trackIndex)+1).toString() + "(appear)";
				//console.log(labelName);
				//console.log("Track number : " + trackIndex);
			    //console.log("First appear frame at : " + keys[key]);
                //console.log(tracks[trackIndex].journal.annotations[keys[key]]);
				//console.log(job.labels);
				if(keys[key].toString() in dynamicDoubtFrame){
					firstAppear[keys[key].toString()].push(labelName);
				}
				else{
				    firstAppear[keys[key].toString()] = [labelName];
				}
				break;
			}
		}
	}
	dynamicDoubtFrame["firstAppear"] = firstAppear;

	// for the disappear frame
	var appearHistory = 0;
	var subtrahend = [];
	var disappearTemp = [];

	for (var trackIndex in tracks){ // for each track
		var keys = Object.keys(tracks[trackIndex].journal.annotations);
		var labelName = job.labels[tracks[trackIndex].label] + (parseInt(trackIndex)+1).toString() + "(disappear)";
		appearHistory = 0;
		disappearTemp = [];
		subtrahend = [];
		for(var key in keys){
			if (tracks[trackIndex].journal.annotations[keys[key]].outside == false){
				appearHistory = 1;
			}
			if(appearHistory == 1 && tracks[trackIndex].journal.annotations[keys[key]].outside == true){
				disappearTemp.push(keys[key]);
				subtrahend.push(keys[key]);
			}
			if (tracks[trackIndex].journal.annotations[keys[key]].outside == false){
				subtrahend = [];
			}
		}

		for (var i in subtrahend){
			//console.log(subtrahend[i]);
			var index = disappearTemp.indexOf(subtrahend[i]);
            disappearTemp.splice(index, 1);
		}


		for (var i in disappearTemp){
			if(disappearTemp[i].toString() in disappear){
				disappear[disappearTemp[i].toString()].push(labelName);
			}
			else{
			    disappear[disappearTemp[i].toString()] = [labelName];
			}
		}

	}
	dynamicDoubtFrame["disappear"] = disappear;


	console.log(dynamicDoubtFrame);
	console.log("Finish gaining dynamicDoubtFrameSet!");

}


function updateTips(frame, doubtFrame){
    if (frame in doubtFrame){
        $("#doubtFont").empty();
        var content = "";
        for (var i = 0; i<revisionRecord[frame].length; i++){
            var object = doubtFrame[frame][i];
            if( revisionRecord[frame][i] == 0){
                content += "<font style=\" font-family:'monospace'\" color='red'>" + object + "</font>, ";
            }
            else{
                content += "<font style=\" font-family:'monospace'\" color='green'>" + object + "</font>, ";
            }
        }
        $(content).appendTo($("#doubtFont"));
    }
    else{

        $("#doubtFont").empty();
        $("<font style=\" font-family:'monospace'\" color='blue'>None</font>").appendTo($("#doubtFont"));
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
            for (frame in fistAppear[pathName]){ // the frame is index
				//console.log(frame);
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
    var framesCount = 0;
    for (var key in doubtFrame){
        framesCount++;
        //console.log(key);
        //console.log(doubtFrame[key]);
        /*var array = [];
        for (var i; i<doubtFrame[key].length; i++){
            array.push(0);
        }*/
        revisionRecord[key] = new Array(doubtFrame[key].length).fill(0);
    }
    console.log(framesCount);
    console.log(revisionRecord);
    console.log(doubtFrame);
}
