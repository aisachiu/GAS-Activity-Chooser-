// -- Course Choices - By achiu@ais.edu.hk --
// This App displays logged-in student's credits (from spreadsheet) and displays them, 
// along with choices (from spreadsheet) for next yr's course selections.
//

// -- GLOBALS --
//Get Lists from Spreadsheet
//var myListDocID = '0AkB30i6AUCFldDFfTkZwZmpOMThOOGZjZEZzVmNtNUE' // Old ID for Live Course List File 
var myListDocID = '1bfqqyAMcAdG6MjjDEWE0anZZg8coMhb9ZX5y5LKN1lo'; // Live List File - 2016
//var myListDocID = '1rFZt8Odx-dtn5k2Y5BBMXXCsXeF5OpdqFmHyZpq1KbA'; //Trial DEV Course List File



//Spreadsheet sheet names for Get Lists...
var myListSheetName = 'ADVWeekChoices';
var myCreditsSheetName = 'Transcript';
var myGradReqsSheetName = 'GradReqs';
var myStudentDataSheetName = 'StudentList'; //Sheet for authorising students
var myApproverListSheetName = 'AWeekApprover';

//Spreadsheet for saving student choices and Teacher Recommendations. 
var mySurveyCollector = '1NLztRxdjOuBFlmXGSyUOws6BHnCUap9Wz09rTdckSgw'; //Live collector in 2012-13 for 2013-14 choices
//var mySurveyCollector = '1LsiB1BFZgc-RjmQ0zFUw4cNvAkyz7nSnKqLmPT70tCY'; //Trial DEV Spreadsheet


var mySurveySheetName = 'ADVWeekResults'; //Results sheet 
//var mySurveySheetName = 'Results-V2'; //Current results sheet with 2 Adv List Choices (obsolete - moved over to "results")
var mySurveyCourseCounts = 'CourseCounts';
var mySurveyTripCounts = 'AWeekCounts';
var myRecommendationSheetName = 'Recommendation';

//Get User

var thisUser = Session.getActiveUser().getEmail(); //Logged In User
//var thisUser = '809459@ais.edu.hk';  // 1 
//var thisUser = '210180@ais.edu.hk'; // 2
//var thisUser = '809217@ais.edu.hk'; //Miku
//var thisUser = '809385@ais.edu.hk'; //Jo-Eun (G9)
//var thisUser = '802313@ais.edu.hk'; //Carol Ho
//var thisUser = '212386@ais.edu.hk'; //Yvelin Lim
//var thisUser = '808362@ais.edu.hk'; //Esmeralda
//var thisUser = '993030@ais.edu.hk'; //Teresa
//var thisUser = '802898@ais.edu.hk'; //Larissa
//var thisUser = '807451@ais.edu.hk'; //Sylvia (1st in student list)
//var thisUser = '211527@ais.edu.hk'; //Ben Keller - bug?
//var thisUser = '809298@ais.edu.hk'; //

// G11 TEST
//var thisUser = '210212@ais.edu.hk'; //

//Globals for displaying course options in each block
var coursePerLine = 3; //obsolete!
var courseFontSize = '9px';

var DisableDateLocking = false; //turns on or off the date lock out.

//For HTMLService app (from template)
//var userSheetName = 'Members';
var challengeSheetName = 'Course Selections';
var appTitle = 'Choose Adventure Week Trip';
var entityTitle = 'Selections'; // used in titles throughout app


//
// -----
//  doGet - main function for web app
// -----
function doGet(){
  var myDoc = 'index';  
  return HtmlService.createTemplateFromFile(myDoc).evaluate().setSandboxMode(HtmlService.SandboxMode.IFRAME);
}
  
// ----
// function loadGInfo() - Gets all info from spreadsheets and passes it back to the client
// -----
function loadGInfo() {

  var ListDoc = SpreadsheetApp.openById(myListDocID);
  var SurveyDoc = SpreadsheetApp.openById(mySurveyCollector);
  
  //Check are we adventure week approver, HRM teacher or student.
  var userType = {isStudent: false, isAdvisor: false, isApprover: false, isParent: false};
  var error = {status: false, class: "bg-danger", msg: "Error"};
  
  var approverList = ListDoc.getSheetByName(myApproverListSheetName).getDataRange().getValues();
  var studentList = ListDoc.getSheetByName(myStudentDataSheetName).getDataRange().getValues();
  var choicesList = SurveyDoc.getSheetByName(mySurveySheetName).getDataRange().getValues();

  var myApprover = getRowsMatching(approverList, 0, thisUser);
  var myAdvisor = getRowsMatching(studentList, 5, thisUser);
  var myStudentInfo = getRowsMatching(studentList, 1, thisUser);
  var myChildInfo = getRowsMatching(studentList, 14, thisUser);
  var studentInfo = [];
  var choiceData = [];
  var canPost = false; 
  
  userType.isApprover = (myApprover.length > 0);//We are an approver
  userType.isAdvisor = (myAdvisor.length > 0); //We are an advisor
  userType.isStudent = (myStudentInfo.length > 0); //We are a student
  userType.isParent = (myChildInfo.length > 0); //We are a parent
  
  if (userType.isApprover) { //We are an approver

    studentInfo = textifyDates(studentList.slice(1)); //prepare student info
    choiceData = textifyDates(choicesList);
    Logger.log(studentInfo);
    
  } else if (userType.isAdvisor) { //we are an advisor
    studentInfo = textifyDates(myAdvisor);
    choiceData = textifyDates(choicesList);
  } else if (userType.isStudent) { //we are a student
      Logger.log(myStudentInfo);
    canPost = checkCanPost(myStudentInfo); 
    studentInfo = textifyDates(myStudentInfo);
    Logger.log(studentInfo);
    choiceData = textifyDates(getRowsMatching(choicesList,1,thisUser));
    if(!myStudentInfo[0][10]) error = {status: true, class: "bg-danger", msg: "It seems the survey is not open to you. Have you paid your OELP deposit?"}
  } else if (userType.isParent) { //we are a student
    studentInfo = textifyDates(myChildInfo);
    for (var child = 0; child < studentInfo.length; child++)
      choiceData.push(textifyDates(getRowsMatching(choicesList,1,studentInfo[child][1])));
  } else {
    error.msg = "You don't have permissions to view anything here.";
    error.status = true;
  }
  
  var possibleChoices = [];
  var possibleChoiceList = ListDoc.getSheetByName(myListSheetName).getDataRange().getValues();
  for (var pc = 0; pc < possibleChoiceList.length; pc++){
    possibleChoices.push(possibleChoiceList[pc][0]);
  }
  var tripCounts = getTripCounts();
  
  var refreshTime = Utilities.formatDate(new Date(), "GMT+08:00", "dd-MMM-yyyy hh:mm:ss")
  
  return {studentInfo: studentInfo, choiceData: choiceData, userType: userType, possibleChoices: possibleChoices, canPost: canPost, error: error, tripCounts: tripCounts, refreshed: refreshTime};
}

function getTripCounts(){
  var SurveyDoc = SpreadsheetApp.openById(mySurveyCollector);
  var tripCounts = SurveyDoc.getSheetByName(mySurveyTripCounts).getDataRange().getValues();
  
  return tripCounts;
  
}

function checkCanPost(studentInfo){
  var timeOpen = timeCheck(studentInfo[0][11], studentInfo[0][12]);
  var canPost = (studentInfo[0][10] && timeOpen); //Check "Survey Permitted" column for this student, and if timeOpen is TRUE (line above)
  return canPost;
}
//-----
// function getStudentInfo(myID) returns the student listing info for thisUser
//-----
function getStudentInfo(ListDoc, myID){

  var myStudentListsheet = ListDoc.getSheetByName(myStudentDataSheetName);
  var studentInfo = getRowsMatching(myStudentListsheet.getDataRange().getValues(),1,myID);
  Logger.log(studentInfo);
  return studentInfo;
}

//-----
// function getStudentInfo(myID) returns all student listing info if thisUser is in Principals list
//-----
function getPrincipalInfo(myID){

  var studentInfo = [];
  var myPrincipalList = SpreadsheetApp.openById(myListDocID).getSheetByName(myApproverListSheetName).getDataRange().getValues();
  
  for (var i =0; i < myPrincipalList.length; i++){
    if (myID === myPrincipalList[i][0]) studentInfo = SpreadsheetApp.openById(myListDocID).getSheetByName(myStudentDataSheetName).getDataRange().getValues().splice(1);  
  }
  return studentInfo;
}


//--------
// studentPostData(data) - expects choice data from the interface - posts choices to sheet
//--------
function studentPostData(data, sindex){
  
  var ListDoc = SpreadsheetApp.openById(myListDocID);
  var SurveyDoc = SpreadsheetApp.openById(mySurveyCollector);
  var msg = "";
  var studentList = ListDoc.getSheetByName(myStudentDataSheetName).getDataRange().getValues(); 
  var myStudentInfo = getRowsMatching(studentList, 1, thisUser);

  if(myStudentInfo.length > 0){//check we can find this student user
    //Check student can post
    var canPost = checkCanPost(myStudentInfo);
    var myChoices = getRowsMatching(SurveyDoc.getSheetByName(mySurveySheetName).getDataRange().getValues(),1,thisUser);//Get Current Choices
    var hrmApproved = false;
    var principalApproved = false;  
    if(myChoices.length > 0){
      hrmApproved = myChoices[0][4];
      principalApproved = myChoices[0][9];
    }
    
    if (canPost && !(hrmApproved) && !(principalApproved)){ //If student can post (survey is open) and principal / HRM have not approved
      var myC = new Array();  
      myC.push([thisUser.substring(0,thisUser.search('@')), 
                  thisUser,
                  new Date(),
                  data.hrm,
                  data.advisorChecked,
                  data.choice1,
                  data.choice2,
                  data.approvalChange,
                  data.approvalDate,
                  data.principalChecked,
                  data.paid]);
   
      return postData(myC, SurveyDoc, true, sindex, canPost);
  } else {
    msg = "No permissions to post";
  }
  } else {
    msg = "An error occured"
  }
  return {error: {status: true, msg: msg, class: "bg-danger", log: textifyDates(myStudentInfo)}};
}

//--------
// approverPostData(data) - expects choice data from the interface - posts choices to sheet
//--------
function approverPostData(data, sindex){
  
  var passTest = true;
  //Check we have permission to approve
  passTest = getPrincipalInfo(thisUser).length > -1; 
  //check choices data exists and has been filled 

  if(passTest){   
    var mySurveyFile = SpreadsheetApp.openById(mySurveyCollector);
      var myC = new Array();  
      myC.push([data.id, 
                  data.email,
                  data.timeDate,
                  data.hrm,
                  data.principalChecked,
                  data.choice1,
                  data.choice2,
                  thisUser,
                  new Date(),
                  data.principalChecked,
                  data.paid]);
      return postData(myC, mySurveyFile, false, sindex, false);
  } else {
      return {error: {status: true, msg: "No posting permissions", class: "bg-danger"}};
  }
}

//-------
//DO POST
//-------

function postData(myC, SurveyDoc, checkQuota, sindex, canPost) {

  var sheet = SurveyDoc.getSheetByName(mySurveySheetName);
  var countSheet = SurveyDoc.getSheetByName(mySurveyTripCounts);
  var statusMessage = "";
  var problemEnc = false;
  
  //Get Lock
  var lock = LockService.getPublicLock();
  lock.waitLock(30000);

  //Get the survey data.
  var lastRow = sheet.getLastRow();
  var sheetData = sheet.getRange(1,1,lastRow,14).getValues();
  var thisRow = getExistingRow(sheetData,1,myC[0][1]);  
  var nowTime = new Date();
    
  //If record already exists, clear it first (this is to ensure that we get accurate course spot counts without including this user's previous choice)
  if (thisRow < lastRow){   
    var clearRange = sheet.getRange(thisRow+1, 1, 1, 7).setValues([[myC[0][0], myC[0][1], myC[0][2], myC[0][3], myC[0][4], '', '']] );    
    //sheet.deleteRow(thisRow+1);
  }
  
  if(checkQuota){//If we are checking quota
    //Check not over quota. Get quota info...
    var myCounts = countSheet.getDataRange().getValues();
    // For each course entered, if spots taken greater or equal spots available, blank that course and add error message.
    for (var x=5; x <= 5; x++){
      var RowX = ArrayLib.indexOf(myCounts, 0, myC[0][x]);
      if (RowX > -1){ 
        if (myCounts[RowX][2] >= myCounts[RowX][1]) {
          statusMessage += myC[0][x] + ' already full! Please choose another trip!'; 
          problemEnc = true;
          myC[0][x] = '';
        }
      }
    } 
  }

  var targetRange = sheet.getRange(thisRow+1, 1, 1, myC[0].length).setValues(myC);    
    
  SpreadsheetApp.flush();
  // clean up and release the lock
  lock.releaseLock();
  
  //var canPost = checkCanPost(thisUser);
  
  var choice = {};
  var myChoices = textifyDates(getRowsMatching(sheet.getDataRange().getValues(),0,myC[0][0]));
  if (myChoices.length > 0) {
    choice = { id: myChoices[0][0],
                       email: myChoices[0][1],
                       timeDate: myChoices[0][2],
                       hrm: myChoices[0][3],
                       advisorChecked: myChoices[0][4],
                       choice1: myChoices[0][5],
                       choice2: myChoices[0][6],
                       approvalChange: myChoices[0][7],
                       approvalDate: myChoices[0][8],
                       principalChecked: myChoices[0][9],
                       paid: myChoices[0][10],
                       canPost: canPost
                        }
  } else {
    problemEnc = true;
    statusMessage = "Could not reload your data. Try reloading this page.";
  }

  return {error: {status: problemEnc, msg: statusMessage, class: "bg-danger", log: myChoices}, choice: choice, sindex: sindex};
}


// ----
// postPApproval(data) - posts principal's approval
// ----
function postPApproval(data){
  var studentID = data.studentID;
  var approval = data.approval;
  var HRM = data.HRM;
  var clientIndex = data.index;
  var choices = data.choices;
  Logger.log(choices);
  
  var passTest = true;
  //Check we have permission to approve
  passTest = getPrincipalInfo(thisUser).length > -1; 
  //check choices data exists and has been filled 

  if(passTest){   
    var mySurveyFile = SpreadsheetApp.openById(mySurveyCollector);
    var sheet = mySurveyFile.getSheetByName(mySurveySheetName);
    var countSheet = mySurveyFile.getSheetByName(mySurveyCourseCounts);
  
    
    //write approval, editing user
    // get the lock, because we're now modifying the shared resource
    var lock = LockService.getPublicLock();
    lock.waitLock(30000);
    
    //Get the survey data.
    var lastRow = sheet.getLastRow();
    var sheetData = sheet.getRange(1,1,lastRow,14).getValues();
    var thisRow = getExistingRow(sheetData,0,studentID);  
  
    Logger.log(thisRow);
      
    //If record exists, make the change
      if (thisRow < lastRow){
        var nowTime = new Date();
        //TRUE	APS5E.01	HEA5C.01	CTD4C.01	ENG4C.03	MCA5C.11	MCA5C.21	SEN4C.02			achiu@ais.edu.hk	15/04/2016 15:28:17	TRUE
        var approvaldata = sheet.getRange(thisRow+1, 5, 1, 13).setValues([[approval, choices[5], choices[6], choices[7], choices[8], choices[9], choices[10], choices[11], choices[12], choices[13], thisUser, nowTime, approval]] );
        //var updatedbyData = sheet.getRange(thisRow+1, 15, 1, 3).setValues([[thisUser, nowTime, approval]] );
  
      SpreadsheetApp.flush();
      // clean up and release the lock
      lock.releaseLock();
      }
        //Get the survey data.
      var lastRow = sheet.getLastRow();
      var sheetData = sheet.getRange(1,1,lastRow,17).getValues();
      var thisRow = getExistingRow(sheetData,0,studentID);  
  
      Logger.log(thisRow);
      
      //get course counts
      var courseCountsSheet = mySurveyFile.getSheetByName(mySurveyCourseCounts);  
      var courseCounts = courseCountsSheet.getRange(2,1,courseCountsSheet.getLastRow()-1,3).getValues();
      
    //If record exists, pass back the change
      if (thisRow < lastRow){
        return {courseCounts: courseCounts, data: textifyDates1D(sheetData[thisRow]), index: clientIndex, error: "" };
      }
      return {data: data, index: clientIndex, error: "Could not save / read data"};
    } else {
       return {data: data, index: clientIndex, error: "Wrong permissions of data problem - could not save."};
    }
}




//-----
// function getStudentInfo(myID) returns the student listing info for thisUser
//-----
function getStudentInfo(myID){

  var myStudentListsheet = SpreadsheetApp.openById(myListDocID).getSheetByName(myStudentDataSheetName);  
  var LastSsRow = myStudentListsheet.getLastRow()-1;
  var studentInfo = getRowsMatching(myStudentListsheet.getRange(2, 1, LastSsRow,myStudentListsheet.getLastColumn()).getValues(),1,myID);

  return studentInfo;
}


//-----
//function getMyRecommendations() returns the recommendations of the student
//-----
function getMyRecommendations(){

  var myRecommendedSheet = SpreadsheetApp.openById(mySurveyCollector).getSheetByName(myRecommendationSheetName);
  var LastRecRow = myRecommendedSheet.getLastRow() -1;  
  //var myRecommended = ArrayLib.filterByText(myRecommendedSheet.getRange(2, 1, LastRecRow,5).getValues(), 2, thisUser);
  var myRecommended = getRowsMatching(myRecommendedSheet.getRange(2, 1, LastRecRow, 5).getValues(), 2, thisUser);
  //Sort the items by course code
      myRecommended.sort(function(a, b){ 
        var x = a[3];
        var y = b[3];
        return (x < y ? -1 : (x > y ? 1 : 0));}); 
  return myRecommended;
}

/*
function getMyCredits(){
  //Get User's Credits List & Graduation Requirements & Teacher Recommendations
  var myCredList = SpreadsheetApp.openById(myListDocID).getSheetByName(myCreditsSheetName);
  var LastCredRow = myCredList.getLastRow() -1;
  var CredList = getRowsMatching(myCredList.getRange(2, 1, LastCredRow,10).getValues(),1,thisUser);

  return CredList;
}

//-----
//   displayMyCredits
//
//----
function displayMyCredits(app, reqCol, myRecommended, CredListItems){
  
  //Get User's Credits List & Graduation Requirements & Teacher Recommendations
  //var myCredList = SpreadsheetApp.openById(myListDocID).getSheetByName(myCreditsSheetName);
  var myGradReqsListsheet = SpreadsheetApp.openById(myListDocID).getSheetByName(myGradReqsSheetName);
 
  
  var myGradReqs = myGradReqsListsheet.getRange(1, 1, myGradReqsListsheet.getLastRow(), myGradReqsListsheet.getLastColumn()).getValues();

  //Create a grid for recommendations results
  var rGrid = app.createVerticalPanel().setId('recPanel').add(app.createHTML('<b>Recommended Subjects:</b>'));
  for(var thisRec=0; thisRec<myRecommended.length; thisRec++){
    if(myRecommended[thisRec][3] != 'NONE') rGrid.add(app.createHTML(myRecommended[thisRec][3])); //If it is not "None", then add to list for printing
  }
  
  //Create a grid for the transcript results
  var tGrid = app.createGrid(myGradReqs.length, 4).setId('transGrid').setStyleAttribute('vertical-align', 'text-top').setBorderWidth(1); 
 
  //Grid headers
  tGrid.setWidget(0,0,app.createHTML('Department'));
  tGrid.setWidget(0,1,app.createHTML('Course (Year)'));
  tGrid.setWidget(0,2,app.createHTML('Total Credits (Earned/Required)'));
  tGrid.setWidget(0,3,app.createHTML('Recommended:')); 
  
  //Cycle through departments, showing courses and total credits and any recommendations
  for (var dept = 1; dept < myGradReqs.length; dept++){ 
    //var thisDeptCreds = ArrayLib.filterByText(CredListItems,5,myGradReqs[dept][0]);
    var thisDeptCreds = getRowsMatching(CredListItems,5,myGradReqs[dept][0]);
    //var thisDeptRecs = ArrayLib.filterByText(myRecommended,4,myGradReqs[dept][0]);
    var thisDeptRecs = getRowsMatching(myRecommended,4,myGradReqs[dept][0]);

    //Reset Credits counter (for summing credits in this department)
    var thisDeptTotal = 0; 
    var myCourses = '';
    
    //Print Department Name (col 1)
    tGrid.setWidget(dept, 0, app.createLabel(myGradReqs[dept][1])); 
    
    //Print list of courses from transcript (col 2)
    //If student has credits in this department, list them.
    if (typeof thisDeptCreds[0] !== 'undefined') { 
      //Sort the items by Year completed
      thisDeptCreds.sort(function(a, b){ 
        var x = a[7];
        var y = b[7];
        return (x < y ? -1 : (x > y ? 1 : 0));});      
      
      for (var myCreds = 0; myCreds < thisDeptCreds.length; myCreds++){
        thisDeptTotal += thisDeptCreds[myCreds][8];
        if (thisDeptCreds[myCreds][7] == 'Current') {//Make font red if it is "current"
          myCourses += '<span style="color:A00;">'+thisDeptCreds[myCreds][9] + ' (' + thisDeptCreds[myCreds][7] +');</span><br />'; 
        }
        else  myCourses += thisDeptCreds[myCreds][9] + ' (' + thisDeptCreds[myCreds][7] +');<br />'; 
      }
      
      //Print all courses in grid.
      tGrid.setWidget(dept, 1, app.createHTML(myCourses));
    }
    
    //Print department total credits earned and total needed(col 3).
    tGrid.setWidget(dept, 2, app.createLabel(thisDeptTotal + '/' + myGradReqs[dept][reqCol])); 
    
    //Print recommended credits in this department (col 4).
    var myRecCourses = '';
    if (typeof thisDeptRecs[0] !== 'undefined') { 
      for (var myRecs = 0; myRecs < thisDeptRecs.length; myRecs++){
        myRecCourses += thisDeptRecs[myRecs][3] +'<br />'; 
      }
      
      //Print all Recommended courses in grid.
      tGrid.setWidget(dept, 3, app.createHTML(myRecCourses));
    }
    
    
  }
  
  
  var bigHorizon = app.createHorizontalPanel();//Containing Horizontal Grid
  bigHorizon.add(tGrid);
  bigHorizon.add(rGrid);
  
  return bigHorizon;
}
*/

//-----
//   displaySurvey - returns a Form that contains all survey information
//
//-----
function displaySurvey(app, myRecs, HRM, CreditList, canPost){

  var mySheet1 = SpreadsheetApp.openById(myListDocID).getSheetByName(myListSheetName);
  var surveysheet = SpreadsheetApp.openById(mySurveyCollector).getSheetByName(mySurveySheetName);
  var msgNoPost = '<span style="color:red;">Survey not open for this user.</span>';
  
  //Get list of live course counts
  var courseCountsSheet = SpreadsheetApp.openById(mySurveyCollector).getSheetByName(mySurveyCourseCounts);  
  var courseCounts = courseCountsSheet.getRange(2,1,courseCountsSheet.getLastRow()-1,3).getValues();
  
  var lastCol = mySheet1.getLastColumn();
  var lastRow = mySheet1.getLastRow();

  var grid = app.createGrid(lastCol+2, 4).setId('surveyGrid').setBorderWidth(1); //set up grid for displaying form (2 extra rows - one for button, one for header)
  var myListBox = new Array();
  var myListLabel = new Array();
  
  //Get credits course codes (first 5 letters)
  var myCreds = new Array();
  for (var cRow = 0; cRow < CreditList.length; cRow++)
    myCreds[cRow] = String(CreditList[cRow][9]).substring(0,5);

  
  
  //--A: Get current choices, if they exist--
  var surveyLastRow = surveysheet.getLastRow();
  var surveyLastCol = surveysheet.getLastColumn();
  var surveyData1 = surveysheet.getRange(1,1, surveyLastRow,surveyLastCol).getValues();
  var myRow = getExistingRow(surveyData1,1,thisUser);
  var myCurrentChoices = new Array();
  //If exists, write the row into myCurrentChoices, otherwise set myCurrentChoices to blank
  if (myRow < surveyLastRow) {
    myCurrentChoices = surveyData1[myRow];
    //if survey has been approved, do not allow posting
    if(surveyData1[myRow][4]) {
      canPost = false;
      msgNoPost = '<span style="color:green;">Advisor Approved.<br />See advisor / Mr. Wing to make changes.</span>';
    }
  }
  else {
    for(var i=0; i<surveyLastCol; i++){
      myCurrentChoices[i] = '';
    }
  }

  
  //change any blanks to "Not Chosen Yet" in myCurrentChoices
  for(var i=0; i<surveyLastCol; i++) if(myCurrentChoices[i] == '') myCurrentChoices[i] = '<span style="color:red;font-weight:bold;">NOT CHOSEN YET!</span>'; 
  //--End A.--
  
  
  //Write Headers on survey grid
  grid.setWidget(0,0,app.createHTML('BLOCK'))
    .setWidget(0,1,app.createHTML('Current Choice <br /> (applications / spots available)'))
    .setWidget(0,2,app.createHTML('Change to: '))
    .setWidget(0,3,app.createHTML('Options:'));
   
 
  //For each column with data create a listbox and list out the choices
  for (var c = 0; c < lastCol; c++){ 
    var cl = c+1;
    var clOffset = 4; //column offset in survey data table from "cl"
    var list1ItemArray = usableColValues(mySheet1.getRange(1,cl,lastRow,1).getValues(),lastRow);
    
    //Logger.log(list1ItemArray);
    
    var smallSubjectListHTML = '<table ><tr><td style="font-size:'+courseFontSize+';vertical-align:top;">';

    myListLabel[c]= [app.createLabel(list1ItemArray[0]), app.createHTML(courseWithEnrolCount(myCurrentChoices[cl+clOffset],courseCounts))];
    myListBox[c] = app.createListBox().setWidth('150px').setName('choice'+cl);
    var lastLevel = 1;
    for(var r=1; r<list1ItemArray.length; r++){
      //add the course to the list box and make it selected if it matches the current choice.
      myListBox[c].addItem(courseWithEnrolCount(list1ItemArray[r],courseCounts),list1ItemArray[r]);
      if (list1ItemArray[r] == myCurrentChoices[cl+clOffset]) myListBox[c].setSelectedIndex(r-1);
      
      //Add courses available in this block into a table

      var courseCode = String(list1ItemArray[r]).substring(0,5);
      var thisLevel = String(list1ItemArray[r]).substring(3,4);
      
      //If this course is the next level, make a new column
      if(thisLevel != lastLevel) smallSubjectListHTML += '</td><td style="font-size:'+courseFontSize+';vertical-align:top;">';
      lastLevel = thisLevel;

      //check if course has been recommended, make green and bold, otherwise, print course
      if ( ArrayLib.countif(myRecs, courseCode) > 0)
        smallSubjectListHTML += '<span style="color:green; font-weight:bold;">'+list1ItemArray[r] +'</span><br />'
      else if(ArrayLib.countif(myCreds, courseCode) > 0)
              smallSubjectListHTML += '<span style="text-decoration:line-through; font-weight:lighter;">'+list1ItemArray[r] +'</span><br />' 
      else
        smallSubjectListHTML += list1ItemArray[r] +'<br />';
      
      //new column for each coursePerLine number of items
      //if(r % coursePerLine == 0) smallSubjectListHTML += '</td><td style="font-size:'+courseFontSize+'">';
    }
   
    //Logger.log(myListLabel[0][1]);
    //myListBox[c].setItemSelected(foundMatchingChoice, true);
    
    smallSubjectListHTML += '</td></tr></table>';
    
    grid.setWidget(cl, 0, myListLabel[c][0])
        .setWidget(cl, 1, myListLabel[c][1])
        .setWidget(cl, 2, myListBox[c])
        .setWidget(cl, 3, app.createHTML(smallSubjectListHTML));
  }
  
  //Create submit button and button disabler
  var mySubmitBtn = app.createSubmitButton('Submit');
  var buttonDisabler = app.createClientHandler().forTargets(mySubmitBtn).setEnabled(false);
  
  if(canPost) 
    grid.setWidget(lastCol+1,2, mySubmitBtn);
  else
    grid.setWidget(lastCol+1,2, app.createHTML(msgNoPost));
  grid.setWidget(lastCol+1,1, app.createHidden('HRM', HRM)); //Pass the homeroom info in the form.
  
  var form = app.createFormPanel().setId('frm').setEncoding('multipart/form-data').addSubmitHandler(buttonDisabler); //Form container for Course Choices

  form.add(grid);
  
  return form;
  
}


//-----
// courseWithEnrolCount (coursecode) - returns the enrollment count of given course code
//-----
function courseWithEnrolCount(coursecode, courseCounts){
  
  var myFormattedString = coursecode;
  
  for (var i=0; i < courseCounts.length; i++){
    if (courseCounts[i][0] == coursecode) {
      myFormattedString += ' (' + courseCounts[i][1] + '/' + courseCounts[i][2]+')';
      return myFormattedString;
    }
  }
  return myFormattedString;
}
//-----
// showExistingChoicesGrid - returns a grid with the existing user's choices
// a = current app
//-----
function showExistingChoicesGrid(a){
  //Sheet containing current entries
  var sheet = SpreadsheetApp.openById(mySurveyCollector).getSheetByName(mySurveySheetName);
  
  var thisGrid = a.createGrid(9, 2);
  var lastRow = sheet.getLastRow();
  var sheetData1 = sheet.getRange(1,1,lastRow,11).getValues();
  var myRow = getExistingRow(sheetData1,1,thisUser);
  var myData = new Array();
  if (myRow < lastRow) {
   myData = sheetData1[myRow]
  }
  else {
    for(var i=0; i<11; i++){
      myData[i] = 'Not Chosen Yet';
    }
  }
  
  thisGrid.setWidget(0,0, a.createHTML('Current Choices'));
  for (var j=1; j<=8; j++){
    thisGrid.setWidget(j,0, a.createHTML('Class '+ (j)));
    thisGrid.setWidget(j,1, a.createHTML(myData[j+1]));
  }
  thisGrid.setWidget(8,0, a.createHTML('Adventure Week'));
  thisGrid.setWidget(8,1, a.createHTML(myData[9]));
  
  return thisGrid;
}


//-----
// getExistingRow - returns the row that contains the data matching the criteria, or returns the next row in the spreadsheet.
//
//-----
function getExistingRow(myList,checkCol,checkCriteria){
  var myRow = 0;
  while (myRow < myList.length){
    if (myList[myRow][checkCol] == checkCriteria) {
      return myRow;
    }
    myRow++;
  } 
  return myRow;
}


function myClickHandler(e) {
  var app = UiApp.getActiveApplication();

  var label = app.getElementById('statusLabel');
  label.setVisible(true);

  app.close();
  return app;
}

function usableColValues(coldata, lastrow) {
  for( var i = (lastrow - 1) ; i > 0; i--){

    if(coldata[i] != "") {
      return coldata.slice(0,i+1);
      };
  };
  return coldata;
}



//getRowsMatching takes a data list and searches the sortIndex for all values that match valueToFind, returning the rows that match this value

function getRowsMatching(DataList, sortIndex, valueToFind){
  
  var foundList = new Array();
  var myDataList = DataList.slice(0); //Added this line and changed the function parameter from myDataList to DataList - hoping to stop changes to original array
  myDataList.sort(function(a, b){ //Sort the items by studentID
    var x = a[sortIndex];
    var y = b[sortIndex];
    return (x < y ? -1 : (x > y ? 1 : 0));});
  
  var cdr = 0;
  var found = false; 

  while ( cdr < myDataList.length){
    if (myDataList[cdr][sortIndex] == valueToFind) {
      found=true;
      foundList.push(myDataList[cdr])
    }
    else if (found){
      return foundList;
    }
    cdr++;
  }

  return foundList;
  
}



//-----
// function timeCheck (studentInfo)
//-----
function timeCheck(openTime, closeTime) {
  Logger.log([openTime, closeTime, (new Date() >= openTime)]);
  return DisableDateLocking || ((new Date() >= openTime) && (new Date() <= closeTime));
}

// -----
// include - include files
// -----
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename)
      .getContent();
}

// ------------------------------------ USEFUL FUNCTIONS--------------------------------------------------
//

//-----
// function textifyDates(myArr) - converts all dates into text format - assumes a 2D array as an input, returns the array.
//-----
function textifyDates(myArr){
  
  
  for(var r=0; r < myArr.length; r++){
    for(var c=0; c < myArr[r].length; c++){
      if (Object.prototype.toString.call(myArr[r][c]) === '[object Date]'){
        try {           
          //myArr[r] = myArr[r].toString();
          myArr[r][c] = Utilities.formatDate(myArr[r][c], "GMT+08:00", "dd-MMM-yyyy hh:mm:ss")
        } 
        catch(err) { myArr[r][c] = err};
      }
    }
  }
  return myArr;
}

//-----
// function textifyDates(myArr) - converts all dates into text format - assumes a 2D array as an input, returns the array.
//-----
function textifyDates1D(myArr){
  
  for(var r=0; r < myArr.length; r++){
      if (Object.prototype.toString.call(myArr[r]) === '[object Date]'){
        try {
          //myArr[r] = myArr[r].toString();
          myArr[r] = Utilities.formatDate(myArr[r], "GMT+08:00", "dd-MMM-yyyy")
          } 
        catch(err) { myArr[r] = err};
      }
    
  }
  return myArr;
}