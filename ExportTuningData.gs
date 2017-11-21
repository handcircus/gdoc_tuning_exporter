var DEBUG = true;

// For POST requests, just call same endpoint for GET
function doPost(e) {
  return doGet(e);  
}

// The core function called by GET requests
function doGet(e) {
  try {
    return ContentService.createTextOutput(GetTuningData(e)).setMimeType(ContentService.MimeType.JSON);    
  }
  catch(errorData) {    
    var error = {status: 'error',error:errorData}    
    return ContentService.createTextOutput(JSON.stringify(error)).setMimeType(ContentService.MimeType.JSON);
  }
}


// Allow testing in Google Script editor editor
function testGetTuningData()
{
  var e={};
  e.parameters={};
  e.parameters.key="YOUR_SPREADSHEET_KEY_HERE";
  var res = GetTuningData(e)
  Logger.log(res);  
}

function GetTuningData(e)
{
  var key;
  var version;
  
  if (e===undefined || e.parameters===undefined || e.parameters.key===undefined) 
    throw("No spreadsheet key passed")
  else 
    id = e.parameters.key;
  
  var spreadsheet;
  try {
    spreadsheet = SpreadsheetApp.openById(id);
  }
  catch (errorData) {
    throw("Can't find Spreadsheet '"+e.parameters.key+"'");
  }
  if (spreadsheet===null) throw("Can't find Spreadsheet '"+e.parameters.key+"'");
  
  var sheetObjects = {};
  
  var sheets = spreadsheet.getSheets();
  for (var i=0; i<sheets.length; ++i)
  {
    var sheetName=sheets[i].getName();
    var sheetExportIndex=sheetName.indexOf("_export_table");
    if (sheetExportIndex>-1) { // Process sheets containing "_export_table"
      var clippedSheetName=sheetName.substring(0,sheetExportIndex); // Strip "_export_table" portion of title
      sheetObjects[clippedSheetName]=SheetToTable(sheets[i]); 
    }
    sheetExportIndex=sheetName.indexOf("_export_column");
    if (sheetExportIndex>-1) { // Process sheets containing "_export_column"
      var clippedSheetName=sheetName.substring(0,sheetExportIndex); // Strip "_export_column" portion of title
      sheetObjects[clippedSheetName]=SheetToColumns(sheets[i]); 
    }
  }
  
  var JsonValue = JSON.stringify(sheetObjects, null, 2);
  return JsonValue;
}

function SheetToTable(sheet) 
{
  // Get spreadsheet data
  var range = sheet.getDataRange();
  var values = range.getValues();
  
  // Define objects for storing processed data
  var sheetItems=[];
  var columnsValid=[];
  var columnTitles=[];
  
  // Define columns and test validity
  for (var i=0; i<values[0].length; ++i) { 
    var columnTitle=values[0][i];
    columnTitles[i]=values[0][i];    
    columnsValid[i]=columnTitle.indexOf(" ")==-1; // Ignore any column with spaces    
  }
  
  // For every row other than zero (column headers), try to find valid object
  for (var i=1; i<values.length; ++i) {
   
    var isValidObject=false;
    var newRowObject = {};
    for (var column=0; column<values[i].length; ++column) {
       if (columnsValid[column]) {
          var columnName=columnTitles[column];
          var columnValue=values[i][column];
          if ((""+columnValue).length>0) { // Nonempty
            newRowObject[columnName]=values[i][column];
            isValidObject=true;
          }
       }
    }      
    if (isValidObject) sheetItems.push(newRowObject);        
  }
  return sheetItems;
}

function SheetToColumns(sheet) 
{
  // Get spreadsheet data
  var range = sheet.getDataRange();
  var values = range.getValues();
  
  // Define objects for storing processed data
  var sheetItems={}; 
  // Cycle through columns
  for (var columnIndex=0; columnIndex<values[0].length; ++columnIndex) { 
    var columnTitle=values[0][columnIndex];
          
    if (columnTitle.indexOf(" ")==-1) { // Ignore any column with spaces 
       var newColumnObject = [];
       var isValidObject=false;
       for (var rowIndex=1; rowIndex<values.length; ++rowIndex) {
         var cellValue=values[rowIndex][columnIndex];
          if ((""+cellValue).length>0) { // Nonempty
            newColumnObject.push(values[rowIndex][columnIndex]);  
            isValidObject=true;
          }
       }
       if (isValidObject) sheetItems[columnTitle]=newColumnObject;  
    }          
  }    
  return sheetItems;
}

