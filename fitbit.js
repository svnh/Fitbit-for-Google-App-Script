// This script will pull down your fitbit data
// and push it into a spreadsheet

var CONSUMER_KEY_PROPERTY_NAME = "fitbitConsumerKey";

var CONSUMER_SECRET_PROPERTY_NAME = "fitbitConsumerSecret";

var LOGGABLES = [ "activities/log/steps" ];

function refreshTimeSeries() {
  // if the user has never configured ask them to do it here
  if (!isConfigured()) {
    renderFitbitConfigurationDialog();
    return;
  }

  var user = authorize();
  var doc = SpreadsheetApp.getActiveSpreadsheet();
  doc.setFrozenRows(2);

  var options = {
    "oAuthServiceName" : "fitbit",
    "oAuthUseToken" : "always",
    "method" : "GET",
    "headers": {
        "Accept-Language": user.foodsLocale
    }
  };

  try {
    var result = UrlFetchApp.fetch("http://api.fitbit.com/1/user/-/friends/leaderboard.json", options);
  } catch (exception) {
    Logger.log(exception);
  }
  var o = Utilities.jsonParse(result.getContentText());

  // set title
  var titleCell = doc.getRange("a1");
  doc.getRange("a1").setValue("Rank");
  doc.getRange("b1").setValue("Friend");
  doc.getRange("c1").setValue("Total")
  doc.getRange("d1").setValue("Average")
  var cell = doc.getRange('a2');

  // fill data
  var index = 0;
  for ( var i in o) {
    // set title for this column
    var title = i.substring(i.lastIndexOf('-') + 1);

    var row = o[i];
    for ( var j in row) {
      var val = row[j];
      cell.offset(index, 0).setValue(val.rank.steps);
      cell.offset(index, 1).setValue(val.user.displayName);
      cell.offset(index, 2).setValue(val.summary.steps);
      cell.offset(index, 3).setValue(val.average.steps);
      index++;
    }
  }
}

function isConfigured() {
  return getConsumerKey() != "" && getConsumerSecret() != "";
}

/**
 * @return String OAuth consumer key to use when tweeting.
 */
function getConsumerKey() {
  var key = ScriptProperties.getProperty(CONSUMER_KEY_PROPERTY_NAME);
  if (key == null) {
    key = "";
  }
  return key;
}

/**
 * @param String
 *      OAuth consumer key to use when tweeting.
 */
function setConsumerKey(key) {
  ScriptProperties.setProperty(CONSUMER_KEY_PROPERTY_NAME, key);
}

/**
 * @param Array
 *      of String for loggable resources, i.e. "foods/log/caloriesIn"
 */
function setLoggables(loggable) {
  ScriptProperties.setProperty("loggables", loggable);
}

function setPeriod(period) {
  ScriptProperties.setProperty("period", period);
}

function getPeriod() {
  var period = ScriptProperties.getProperty("period");
  if (period == null) {
    period = "30d";
  }
  return period;
}

/**
 * @return String OAuth consumer secret to use when tweeting.
 */
function getConsumerSecret() {
  var secret = ScriptProperties.getProperty(CONSUMER_SECRET_PROPERTY_NAME);
  if (secret == null) {
    secret = "";
  }
  return secret;
}

/**
 * @param String
 *      OAuth consumer secret to use when tweeting.
 */
function setConsumerSecret(secret) {
  ScriptProperties.setProperty(CONSUMER_SECRET_PROPERTY_NAME, secret);
}

/** Retrieve config params from the UI and store them. */
function saveConfiguration(e) {
  setConsumerKey(e.parameter.consumerKey);
  setConsumerSecret(e.parameter.consumerSecret);
  setLoggables(e.parameter.loggables);
  setPeriod(e.parameter.period);
  var app = UiApp.getActiveApplication();
  app.close();
  return app;
}
/**
 * Configure all UI components and display a dialog to allow the user to
 * configure approvers.
 */
function renderFitbitConfigurationDialog() {
  var doc = SpreadsheetApp.getActiveSpreadsheet();
  var app = UiApp.createApplication().setTitle("Configure Fitbit");
  app.setStyleAttribute("padding", "10px");
  app.setHeight('0.9');

  var helpLabel = app
      .createLabel("From here you will configure access to fitbit -- Just supply your own"
          + "consumer key and secret \n\n"
          + "Important:  To authroize this app you need to load the script in the script editor"
          + " (tools->Script Manager) and then run the 'authorize' script.");
  helpLabel.setStyleAttribute("text-align", "justify");
  helpLabel.setWidth("95%");
  var consumerKeyLabel = app.createLabel("Fitbit OAuth Consumer Key:");
  var consumerKey = app.createTextBox();
  consumerKey.setName("consumerKey");
  consumerKey.setWidth("100%");
  consumerKey.setText(getConsumerKey());
  var consumerSecretLabel = app.createLabel("Fitbit OAuth Consumer Secret:");
  var consumerSecret = app.createTextBox();
  consumerSecret.setName("consumerSecret");
  consumerSecret.setWidth("100%");
  consumerSecret.setText(getConsumerSecret());

  var saveHandler = app.createServerClickHandler("saveConfiguration");
  var saveButton = app.createButton("Save Configuration", saveHandler);

  var listPanel = app.createGrid(6, 3);
  listPanel.setWidget(1, 0, consumerKeyLabel);
  listPanel.setWidget(1, 1, consumerKey);
  listPanel.setWidget(2, 0, consumerSecretLabel);
  listPanel.setWidget(2, 1, consumerSecret);

  // Ensure that all form fields get sent along to the handler
  saveHandler.addCallbackElement(listPanel);

  var dialogPanel = app.createFlowPanel();
  dialogPanel.add(helpLabel);
  dialogPanel.add(listPanel);
  dialogPanel.add(saveButton);
  app.add(dialogPanel);
  doc.show(app);
}

function authorize() {
  var oAuthConfig = UrlFetchApp.addOAuthService("fitbit");
  oAuthConfig.setAccessTokenUrl("http://api.fitbit.com/oauth/access_token");
  oAuthConfig.setRequestTokenUrl("http://api.fitbit.com/oauth/request_token");
  oAuthConfig.setAuthorizationUrl("http://api.fitbit.com/oauth/authorize");
  oAuthConfig.setConsumerKey(getConsumerKey());
  oAuthConfig.setConsumerSecret(getConsumerSecret());

  var options = {
    "oAuthServiceName" : "fitbit",
    "oAuthUseToken" : "always"
  };

  // get The profile but don't do anything with it -- just to force
  // authentication
  var result = UrlFetchApp.fetch(
      "http://api.fitbit.com/1/user/-/profile.json", options);
  var o = Utilities.jsonParse(result.getContentText());

  return o.user;
}

/** When the spreadsheet is opened, add a Fitbit menu. */
function onOpen() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var menuEntries = [ {
    name : "Refresh fitbit Time Data",
    functionName : "refreshTimeSeries"
  }, {
    name : "Configure",
    functionName : "renderFitbitConfigurationDialog"
  } ];
  ss.addMenu("Fitbit", menuEntries);
}

function onInstall() {
  onOpen();
  // put the menu when script is installed
}
